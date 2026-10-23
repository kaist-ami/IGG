#!/usr/bin/env node
// Run the IGG benchmark against an /act model server (or replay gold traces)
// across all mock apps and write an aggregated GA / AC / RER / TT summary.
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { APP_CONFIGS } from "../lib/interaction-contract.mjs";
import { createGoldTraceAgent, runAppWithAgent } from "../lib/interaction-runner.mjs";
import { createHttpAgentFactory } from "./http-agent.mjs";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ALL_APPS = Object.keys(APP_CONFIGS);

export const SUBTYPES = Object.freeze({
  "1-1": "CT1-1 Scroll-based Exploration",
  "2-1": "CT2-1 Visual Disambiguation",
  "2-2": "CT2-2 Hidden State Activation",
  "2-3": "CT2-3 Removable Occlusion",
  "3-1": "CT3-1 Delayed State Activation",
  "3-2": "CT3-2 Dynamic Target Interaction",
  "3-3": "CT3-3 Movable Occlusion",
});

const USAGE = `Usage: node eval/run.mjs [options]

Agent (choose one):
  --agent-url URL        Model /act server (see servers/)
  --gold                 Replay annotated gold traces (sanity check)

Options:
  --name NAME            Run name; results go to results/NAME (default: timestamp)
  --apps a,b,c           Apps to run (default: all ${ALL_APPS.length})
  --dataset main|hint    Instruction set (default: main)
  --task-ids ID1,ID2     Run only these task ids
  --max-steps N          Action budget per task (default: 8, as in the paper)
  --retry-limit N        HTTP retries on 429/5xx from the agent (default: 0)
  --timeout-ms MS        Timeout per /act call (default: 300000)
  --no-headless          Show the Chromium window
`;

function parseArgs(argv) {
  const opts = {
    agentUrl: null,
    gold: false,
    name: new Date().toISOString().replace(/[:.]/g, "-"),
    apps: ALL_APPS,
    dataset: "main",
    taskIds: null,
    maxSteps: 8,
    retryLimit: 0,
    timeoutMs: 300_000,
    headless: true,
  };
  const args = [...argv];
  while (args.length) {
    const flag = args.shift();
    const value = () => {
      const next = args.shift();
      if (next === undefined || next.startsWith("--")) throw new Error(`Missing value for ${flag}`);
      return next;
    };
    switch (flag) {
      case "--agent-url": opts.agentUrl = value(); break;
      case "--gold": opts.gold = true; break;
      case "--name": opts.name = value(); break;
      case "--apps": {
        const apps = value();
        opts.apps = apps === "all" ? ALL_APPS : apps.split(",").map((a) => a.trim()).filter(Boolean);
        break;
      }
      case "--dataset": opts.dataset = value(); break;
      case "--task-ids": opts.taskIds = new Set(value().split(",").map((id) => id.trim())); break;
      case "--max-steps": opts.maxSteps = Number(value()); break;
      case "--retry-limit": opts.retryLimit = Number(value()); break;
      case "--timeout-ms": opts.timeoutMs = Number(value()); break;
      case "--no-headless": opts.headless = false; break;
      case "--help": case "-h": console.log(USAGE); process.exit(0);
      default: throw new Error(`Unknown argument: ${flag}\n\n${USAGE}`);
    }
  }
  if (!opts.gold && !opts.agentUrl) throw new Error(`Pass --agent-url or --gold.\n\n${USAGE}`);
  for (const app of opts.apps) {
    if (!APP_CONFIGS[app]) throw new Error(`Unknown app: ${app} (choose from ${ALL_APPS.join(", ")})`);
  }
  if (!["main", "hint"].includes(opts.dataset)) throw new Error(`Unknown dataset: ${opts.dataset}`);
  return opts;
}

function aggregate(results) {
  const summarize = (rows) => {
    const passed = rows.filter((r) => r.passed);
    const ratios = passed
      .filter((r) => r.gold_trace_length > 0 && r.trace_length > 0)
      .map((r) => r.gold_trace_length / r.trace_length);
    const mean = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    return {
      tasks: rows.length,
      passed: passed.length,
      GA: rows.length ? passed.length / rows.length : 0,
      AC: mean(rows.map((r) => r.trace_length)),
      RER: mean(ratios),
      TT_ms: mean(rows.map((r) => r.total_elapsed_ms)),
    };
  };
  const groupBy = (key) => {
    const groups = {};
    for (const r of results) (groups[key(r)] ??= []).push(r);
    return Object.fromEntries(Object.keys(groups).sort().map((k) => [k, summarize(groups[k])]));
  };
  return {
    overall: summarize(results),
    by_subtype: groupBy((r) => SUBTYPES[r.level] ?? String(r.level)),
    by_app: groupBy((r) => r.app),
  };
}

function formatTable(summary) {
  const pct = (x) => `${(x * 100).toFixed(1)}`.padStart(6);
  const row = (label, s) =>
    `${label.padEnd(36)} ${String(s.tasks).padStart(5)} ${pct(s.GA)} ${s.AC.toFixed(2).padStart(6)} ${s.RER.toFixed(2).padStart(6)}`;
  const lines = [`${"".padEnd(36)} ${"tasks".padStart(5)} ${"GA%".padStart(6)} ${"AC".padStart(6)} ${"RER".padStart(6)}`];
  lines.push(row("Overall", summary.overall), "");
  for (const [k, s] of Object.entries(summary.by_subtype)) lines.push(row(k, s));
  lines.push("");
  for (const [k, s] of Object.entries(summary.by_app)) lines.push(row(k, s));
  return lines.join("\n");
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const outputRoot = path.join(REPO_ROOT, "results", opts.name);
  await mkdir(outputRoot, { recursive: true });

  const agentFactory = opts.gold
    ? (task) => createGoldTraceAgent(task)
    : createHttpAgentFactory({
        agentUrl: opts.agentUrl,
        timeoutMs: opts.timeoutMs,
        sendPathOnly: false,
        retryLimit: opts.retryLimit,
      });

  const results = [];
  const runs = {};
  for (const app of opts.apps) {
    const config = APP_CONFIGS[app];
    const datasetPath = path.join("dataset", opts.dataset, `${app}-dataset.json`);
    const taskFilter = (task) => !opts.taskIds || opts.taskIds.has(task.id);
    const dataset = JSON.parse(await readFile(path.join(REPO_ROOT, datasetPath), "utf8"));
    if (!dataset.tasks.some(taskFilter)) continue;

    const baseUrl = process.env[config.envBaseUrl] ?? config.baseUrl;
    console.error(`[igg] ${app}: running ${dataset.tasks.filter(taskFilter).length} tasks on ${baseUrl}`);
    const summary = await runAppWithAgent(app, agentFactory, {
      repoRoot: REPO_ROOT,
      datasetPath,
      outputDir: path.join(outputRoot, app),
      // Gold traces are replayed without a budget; models get the paper's 8 actions.
      maxSteps: opts.gold ? undefined : opts.maxSteps,
      headless: opts.headless,
      taskFilter,
    });
    runs[app] = path.relative(REPO_ROOT, summary.run_dir);
    for (const r of summary.results) {
      results.push({
        app,
        id: r.id,
        level: r.level,
        passed: r.passed,
        stop_reason: r.stop_reason,
        trace_length: r.trace_length,
        gold_trace_length: r.gold_trace_length,
        total_elapsed_ms: r.total_elapsed_ms,
      });
    }
  }

  const summary = {
    agent: opts.gold ? "gold_trace" : opts.agentUrl,
    dataset: opts.dataset,
    max_steps: opts.gold ? null : opts.maxSteps,
    ...aggregate(results),
    runs,
  };
  await writeFile(path.join(outputRoot, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
  await writeFile(path.join(outputRoot, "tasks.jsonl"), results.map((r) => JSON.stringify(r)).join("\n") + "\n");

  console.log(formatTable(summary));
  console.log(`\nResults written to ${path.relative(process.cwd(), outputRoot) || "."}`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exit(1);
});
