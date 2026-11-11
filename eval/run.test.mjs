import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { randomUUID } from "node:crypto";
import { existsSync, rmSync } from "node:fs";
import test from "node:test";
import { fileURLToPath } from "node:url";

test("rejects an empty task selection without writing aggregate metrics", (t) => {
  const name = `test-empty-${randomUUID()}`;
  const outputDir = new URL(`../results/${name}/`, import.meta.url);
  t.after(() => rmSync(outputDir, { recursive: true, force: true }));

  const run = spawnSync(process.execPath, [
    fileURLToPath(new URL("./run.mjs", import.meta.url)),
    "--gold", "--apps", "shopping", "--dataset", "main",
    "--task-ids", "phase2-nonexistent-id", "--name", name,
  ], { encoding: "utf8", timeout: 10_000 });

  assert.ifError(run.error);
  assert.equal(run.status, 1, run.stdout + run.stderr);
  assert.match(run.stderr, /No tasks were evaluated for apps: shopping \(dataset: main\)/);
  assert.match(run.stderr, /--task-ids/);
  assert.equal(existsSync(new URL("summary.json", outputDir)), false);
  assert.equal(existsSync(new URL("tasks.jsonl", outputDir)), false);
});
