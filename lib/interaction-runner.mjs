import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { spawn } from "node:child_process";
import { chromium } from "@playwright/test";
import {
  APP_CONFIGS,
  DEFAULT_VIEWPORT,
  actionForTrace,
  buildTaskUrl,
  normalizeRuntimeAction,
} from "./interaction-contract.mjs";

// Linux Chromium hints glyphs and rounds text advances to whole pixels; turning hinting off
// makes text widths, and so every layout, match macOS (see lib/igg-fonts.css).
const BROWSER_ARGS = ["--font-render-hinting=none"];

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function repoRootFromUrl(importMetaUrl) {
  return path.resolve(path.dirname(new URL(importMetaUrl).pathname), "..", "..");
}

export function workspaceRootFromRepo(repoRoot) {
  return repoRoot;
}

export async function waitForServer(url, timeoutMs = 180_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);
    try {
      const response = await fetch(url, { signal: controller.signal });
      if (response.status < 500) return;
    } catch {
    } finally {
      clearTimeout(timeout);
    }
    await sleep(1000);
  }
  throw new Error(`Timed out waiting for server: ${url}`);
}

export async function isServerAvailable(url) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response.status < 500;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export function startAppServer(config, repoRoot, options = {}) {
  let [command, rawArgs] = config.devCommand;
  if (options.forceProductionServer) {
    const port = new URL(config.baseUrl).port;
    command = path.join(repoRoot, "node_modules", ".bin", "next");
    rawArgs = ["start", `./apps/${config.app}`, "--port", port];
  }
  const args = [...rawArgs];
  if (
    options.forceWebpackDevServer
    && command === "npm"
    && args[0] === "run"
    && String(args[1] ?? "").startsWith("dev:")
    && !args.includes("--webpack")
  ) {
    args.push("--", "--webpack");
  }
  const child = spawn(command, args, {
    cwd: repoRoot,
    env: { ...process.env },
    stdio: "pipe",
    // npm is a .cmd script on Windows and can only be started through a shell.
    shell: process.platform === "win32",
  });

  child.stdout.on("data", (chunk) => process.stdout.write(`[${config.app}-dev] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${config.app}-dev] ${chunk}`));
  return child;
}

export async function stopAppServer(server) {
  if (!server) return;
  if (process.platform === "win32") {
    // Killing the shell would leave `next dev` running; end the whole process tree.
    spawn("taskkill", ["/pid", String(server.pid), "/T", "/F"], { stdio: "ignore" });
    await sleep(1000);
    return;
  }
  server.kill("SIGTERM");
  await sleep(1000);
  if (!server.killed) server.kill("SIGKILL");
}

async function getRuntimeState(page, runtimeStateKey) {
  return page.evaluate((key) => {
    const state = window[key];
    return state ? JSON.parse(JSON.stringify(state)) : null;
  }, runtimeStateKey);
}

async function waitForRuntimeState(page, runtimeStateKey, timeout = 15_000) {
  await page.waitForFunction((key) => Boolean(window[key]), runtimeStateKey, { timeout });
}

async function waitForReviewBridge(page, runtimeStateKey, timeout = 15_000) {
  await page.waitForFunction(
    (key) => Boolean(window[key]) && window.__IGG_REVIEW_CAPTURE_INSTALLED__ === true,
    runtimeStateKey,
    { timeout },
  );
}

async function getObservedTargetAtPoint(page, x, y) {
  return page.evaluate(({ clickX, clickY }) => {
    const element = document.elementFromPoint(clickX, clickY);
    const target = element?.closest("[data-igg-id]") ?? null;
    const disabledControl = target?.closest("button:disabled, input:disabled, select:disabled, textarea:disabled, option:disabled, optgroup:disabled") ?? null;
    const ariaDisabled = target?.closest("[aria-disabled='true']") ?? null;
    const inertTarget = target?.closest("[inert]") ?? null;
    const style = target ? window.getComputedStyle(target) : null;
    return {
      observedTargetId: target?.getAttribute("data-igg-id") ?? null,
      targetActionable: Boolean(target && !disabledControl && !ariaDisabled && !inertTarget && style?.pointerEvents !== "none"),
    };
  }, { clickX: x, clickY: y });
}

async function resolveActionPoint(page, action, options = {}) {
  if (Number.isFinite(action.x) && Number.isFinite(action.y)) {
    return { x: action.x, y: action.y, selector: action.selector ?? null };
  }

  if (!action.selector) {
    const viewport = page.viewportSize() ?? DEFAULT_VIEWPORT;
    return { x: Math.round(viewport.width / 2), y: Math.round(viewport.height / 2), selector: null };
  }

  const locator = page.locator(action.selector).first();
  await locator.waitFor({ state: options.waitState ?? "visible", timeout: options.timeout ?? 15_000 });
  if (options.scrollIntoView !== false) {
    await locator.scrollIntoViewIfNeeded();
  }
  const box = await locator.boundingBox();
  if (!box) throw new Error(`Unable to resolve bounding box for selector: ${action.selector}`);
  return {
    x: box.x + box.width / 2,
    y: box.y + box.height / 2,
    selector: action.selector,
  };
}

async function scrollByAction(page, action) {
  const dy = Number(action.dy ?? 0);
  if (action.selector) {
    const locator = page.locator(action.selector).first();
    await locator.waitFor({ state: "attached", timeout: 15_000 });
    const result = await locator.evaluate((element, scrollDy) => {
      function isScrollableElement(node) {
        if (!node) return false;
        const style = window.getComputedStyle(node);
        const canScrollY = ["auto", "scroll"].includes(style.overflowY) || ["auto", "scroll"].includes(style.overflow);
        return canScrollY && node.scrollHeight > node.clientHeight + 4;
      }
      function findScrollableAncestor(start) {
        let node = start;
        while (node && node !== document.body) {
          if (isScrollableElement(node)) return node;
          node = node.parentElement;
        }
        return document.scrollingElement;
      }
      const target = findScrollableAncestor(element) ?? element;
      if (!target || target === document.body || target === document.documentElement || target === document.scrollingElement) {
        window.scrollBy({ top: scrollDy, behavior: "auto" });
        return { scrollScope: "viewport" };
      }
      target.scrollBy({ top: scrollDy, behavior: "auto" });
      return {
        scrollScope: "container",
        observedTargetId: target.closest("[data-igg-id]")?.getAttribute("data-igg-id") ?? null,
      };
    }, dy);
    return { x: action.x ?? null, y: action.y ?? null, selector: action.selector, dy, ...result };
  }

  const x = Number.isFinite(action.x) ? action.x : undefined;
  const y = Number.isFinite(action.y) ? action.y : undefined;
  const result = await page.evaluate(({ scrollX, scrollY, scrollDy }) => {
    function isScrollableElement(element) {
      if (!element) return false;
      const style = window.getComputedStyle(element);
      const canScrollY = ["auto", "scroll"].includes(style.overflowY) || ["auto", "scroll"].includes(style.overflow);
      return canScrollY && element.scrollHeight > element.clientHeight + 4;
    }
    function findScrollableAncestor(start) {
      let node = start;
      while (node && node !== document.body) {
        if (isScrollableElement(node)) return node;
        node = node.parentElement;
      }
      return document.scrollingElement;
    }
    const x = Number.isFinite(scrollX) ? scrollX : window.innerWidth / 2;
    const y = Number.isFinite(scrollY) ? scrollY : window.innerHeight / 2;
    const target = document.elementsFromPoint(x, y)
      .map((element) => findScrollableAncestor(element))
      .find(Boolean) ?? document.scrollingElement;
    if (!target || target === document.body || target === document.documentElement || target === document.scrollingElement) {
      window.scrollBy({ top: scrollDy, behavior: "auto" });
      return {
        scrollScope: "viewport",
        observedTargetId: document.scrollingElement?.closest?.("[data-igg-id]")?.getAttribute("data-igg-id") ?? null,
      };
    }
    target.scrollBy({ top: scrollDy, behavior: "auto" });
    return {
      scrollScope: "container",
      observedTargetId: target.closest("[data-igg-id]")?.getAttribute("data-igg-id") ?? null,
    };
  }, { scrollX: x, scrollY: y, scrollDy: dy });
  return { x: x ?? null, y: y ?? null, selector: null, dy, ...result };
}

export async function executeDirectRuntimeAction(page, rawAction, task, options = {}) {
  const action = normalizeRuntimeAction(rawAction);
  const startedAt = Date.now();

  if (action.type === "scroll") {
    const result = await scrollByAction(page, action);
    await sleep(options.scrollDelayMs ?? 350);
    return {
      ok: true,
      done: false,
      matched: false,
      actionType: "scroll",
      action,
      message: `${result.scrollScope ?? "viewport"} scrolled by ${result.dy}`,
      ...result,
      elapsedMs: Date.now() - startedAt,
    };
  }

  if (action.type === "wait") {
    const ms = Number(action.ms ?? 1000);
    await sleep(ms);
    return {
      ok: true,
      done: false,
      matched: false,
      actionType: "wait",
      action,
      ms,
      message: `waited for ${ms}ms`,
      elapsedMs: Date.now() - startedAt,
    };
  }

  if (action.type === "drag") {
    let startX = Number(action.startX ?? 0);
    let startY = Number(action.startY ?? 0);
    const endX = Number(action.endX ?? 0);
    const endY = Number(action.endY ?? 0);
    if (action.selector) {
      const point = await resolveActionPoint(page, action);
      startX = point.x;
      startY = point.y;
    }
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(endX, endY, { steps: 20 });
    await page.mouse.up();
    await sleep(options.dragDelayMs ?? 350);
    return {
      ok: true,
      done: false,
      matched: false,
      actionType: "drag",
      action,
      selector: action.selector ?? null,
      startX,
      startY,
      endX,
      endY,
      message: `dragged from (${startX},${startY}) to (${endX},${endY})`,
      elapsedMs: Date.now() - startedAt,
    };
  }

  if (action.type === "move") {
    const point = await resolveActionPoint(page, action);
    await page.mouse.move(point.x, point.y);
    const ms = Number(action.ms ?? 220);
    await sleep(ms);
    const { observedTargetId } = await getObservedTargetAtPoint(page, point.x, point.y);
    return {
      ok: true,
      done: false,
      matched: false,
      actionType: "move",
      action,
      selector: point.selector,
      x: point.x,
      y: point.y,
      ms,
      observedTargetId,
      message: "moved pointer",
      elapsedMs: Date.now() - startedAt,
    };
  }

  if (action.type === "click") {
    const point = await resolveActionPoint(page, action);
    const { observedTargetId, targetActionable } = await getObservedTargetAtPoint(page, point.x, point.y);
    const expectedTargetId = task.target_id ?? null;
    const matched = Boolean(expectedTargetId && observedTargetId === expectedTargetId && targetActionable);
    await page.mouse.click(point.x, point.y);
    await sleep(options.clickDelayMs ?? 350);
    return {
      ok: true,
      done: matched,
      matched,
      actionType: "click",
      action,
      selector: point.selector,
      x: point.x,
      y: point.y,
      observedTargetId,
      targetActionable,
      expectedTargetId,
      message: matched
        ? "target matched"
        : observedTargetId === expectedTargetId && !targetActionable
          ? "clicked target before actionable"
          : "clicked non-target",
      elapsedMs: Date.now() - startedAt,
    };
  }

  throw new Error(`Unsupported action type: ${action.type}`);
}

async function postReviewRuntimeAction(page, action, timeoutMs = 20_000) {
  const requestId = `runner-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return page.evaluate(
    ({ requestId: id, action: runtimeAction, timeout }) =>
      new Promise((resolve) => {
        const timeoutId = window.setTimeout(() => {
          window.removeEventListener("message", handler);
          resolve({
            ok: false,
            error: "timeout",
            message: "review runtime action timed out",
          });
        }, timeout);

        function handler(event) {
          if (event.data?.type !== "igg-review-response" || event.data?.requestId !== id) return;
          window.clearTimeout(timeoutId);
          window.removeEventListener("message", handler);
          resolve(JSON.parse(JSON.stringify(event.data)));
        }

        window.addEventListener("message", handler);
        window.postMessage(
          {
            type: "igg-review-action",
            requestId: id,
            action: runtimeAction,
          },
          "*",
        );
      }),
    { requestId, action, timeout: timeoutMs },
  );
}

export async function executeReviewRuntimeAction(page, rawAction, task, options = {}) {
  const action = normalizeRuntimeAction(rawAction);
  const startedAt = Date.now();
  const response = await postReviewRuntimeAction(page, action, options.reviewActionTimeoutMs ?? 20_000);

  if (response?.ok === false) {
    throw new Error(response.error ?? response.message ?? "review runtime action failed");
  }

  const actionType = response.actionType ?? action.type;
  const observedTargetId =
    response.observedTargetId ??
    response.hoverTargetId ??
    response.matchedTargetId ??
    null;
  const expectedTargetId = task.target_id ?? null;
  const targetActionable = response.targetActionable !== false;
  const done = Boolean(
    actionType === "click" &&
      expectedTargetId &&
      observedTargetId &&
      observedTargetId === expectedTargetId &&
      targetActionable,
  );

  return {
    ok: true,
    done,
    matched: done,
    actionType,
    action,
    selector: response.selector ?? action.selector ?? null,
    x: response.x ?? action.x ?? null,
    y: response.y ?? action.y ?? null,
    startX: response.startX ?? action.startX ?? null,
    startY: response.startY ?? action.startY ?? null,
    endX: response.endX ?? action.endX ?? null,
    endY: response.endY ?? action.endY ?? null,
    dy: response.dy ?? action.dy ?? null,
    ms: response.ms ?? action.ms ?? null,
    dwellMs: response.dwellMs ?? null,
    scrollScope: response.scrollScope ?? null,
    observedTargetId,
    targetActionable,
    expectedTargetId,
    runtimeState: response.runtimeState ?? null,
    message: done
      ? "target matched"
      : actionType === "click" && observedTargetId === expectedTargetId && !targetActionable
        ? "clicked target before actionable"
        : actionType === "click"
          ? "clicked non-target"
          : response.message ?? `${actionType} executed`,
    reviewMessage: response.message ?? null,
    elapsedMs: Date.now() - startedAt,
  };
}

export async function executeRuntimeAction(page, rawAction, task, options = {}) {
  if (options.runtimeExecutor === "direct") {
    return executeDirectRuntimeAction(page, rawAction, task, options);
  }
  return executeReviewRuntimeAction(page, rawAction, task, options);
}

export function computeInteractionMetrics(results) {
  const total = results.length;
  if (total === 0) {
    return { GA: 0, AC: 0, TT_ms: 0, OR: 0, total: 0, passed: 0, by_level: {} };
  }

  const passedResults = results.filter((result) => result.passed);
  const optimalRatios = passedResults
    .map((result) => {
      const gold = Number(result.gold_trace_length ?? 0);
      const actual = Number(result.trace_length ?? 0);
      return gold > 0 && actual > 0 ? gold / actual : null;
    })
    .filter((value) => value !== null);

  const byLevel = {};
  for (const result of results) {
    const level = String(result.level ?? "unknown");
    byLevel[level] ??= { total: 0, passed: 0, trace_sum: 0, total_time_sum: 0 };
    byLevel[level].total += 1;
    byLevel[level].passed += result.passed ? 1 : 0;
    byLevel[level].trace_sum += Number(result.trace_length ?? 0);
    byLevel[level].total_time_sum += Number(result.total_elapsed_ms ?? 0);
  }
  for (const bucket of Object.values(byLevel)) {
    bucket.GA = bucket.total ? bucket.passed / bucket.total : 0;
    bucket.AC = bucket.total ? bucket.trace_sum / bucket.total : 0;
    bucket.TT_ms = bucket.total ? bucket.total_time_sum / bucket.total : 0;
  }

  return {
    GA: passedResults.length / total,
    AC: results.reduce((sum, result) => sum + Number(result.trace_length ?? 0), 0) / total,
    TT_ms: results.reduce((sum, result) => sum + Number(result.total_elapsed_ms ?? 0), 0) / total,
    OR: optimalRatios.length
      ? optimalRatios.reduce((sum, value) => sum + value, 0) / optimalRatios.length
      : 0,
    total,
    passed: passedResults.length,
    by_level: byLevel,
  };
}

async function saveObservation(page, taskDir, slug, trace, instruction) {
  const filename = `${slug}-viewport.png`;
  const screenshotPath = path.join(taskDir, filename);
  await page.screenshot({ path: screenshotPath, fullPage: false });
  return {
    screenshotPath,
    screenshotMode: "viewport_only",
    instruction,
    trace: trace.map((step) => actionForTrace(step.action ?? step)),
  };
}

export function createGoldTraceAgent(task) {
  let index = 0;
  return {
    name: "gold_trace_scripted_agent",
    async act() {
      const action = task.gold_trace?.[index] ?? null;
      index += 1;
      return action;
    },
  };
}

function lastClickIndex(actions = []) {
  for (let index = actions.length - 1; index >= 0; index -= 1) {
    try {
      if (normalizeRuntimeAction(actions[index]).type === "click") return index;
    } catch {
      // Invalid gold actions are handled when the runner tries to execute them.
    }
  }
  return -1;
}

function traceStepFromResult(step, rawAction, result, runtimeState, task, phase) {
  return {
    step,
    phase,
    action: actionForTrace(result.action ?? rawAction),
    result: {
      ok: result.ok,
      done: result.done,
      matched: result.matched,
      observedTargetId: result.observedTargetId ?? null,
      targetActionable: result.targetActionable ?? null,
      expectedTargetId: result.expectedTargetId ?? task.target_id ?? null,
      x: result.x ?? null,
      y: result.y ?? null,
      selector: result.selector ?? null,
      message: result.message,
      elapsedMs: result.elapsedMs,
    },
    runtime_state: runtimeState,
  };
}

function classifyClickResult(result, task) {
  if (result.done) return "target_matched";
  if (!result.observedTargetId) return "clicked_empty";
  if (result.observedTargetId === task.target_id && result.targetActionable === false) {
    return "clicked_target_not_actionable";
  }
  return "clicked_wrong_target";
}

function computeOracleClickMetrics(results) {
  const total = results.length;
  const passed = results.filter((result) => result.passed).length;
  const byLevel = {};
  const byConstraintType = {};
  const failureReasons = {};

  for (const result of results) {
    const level = String(result.level ?? "unknown");
    byLevel[level] ??= { total: 0, passed: 0 };
    byLevel[level].total += 1;
    byLevel[level].passed += result.passed ? 1 : 0;

    const constraintType = String(result.constraint_type ?? "unknown");
    byConstraintType[constraintType] ??= { total: 0, passed: 0 };
    byConstraintType[constraintType].total += 1;
    byConstraintType[constraintType].passed += result.passed ? 1 : 0;

    if (!result.passed) {
      failureReasons[result.stop_reason] = (failureReasons[result.stop_reason] ?? 0) + 1;
    }
  }

  for (const bucket of Object.values(byLevel)) {
    bucket.pass_at_1 = bucket.total ? bucket.passed / bucket.total : 0;
  }
  for (const bucket of Object.values(byConstraintType)) {
    bucket.pass_at_1 = bucket.total ? bucket.passed / bucket.total : 0;
  }

  return {
    pass_at_1: total ? passed / total : 0,
    total,
    passed,
    by_level: byLevel,
    by_constraint_type: byConstraintType,
    failure_reasons: failureReasons,
  };
}

export async function runTaskOracleClickLoop(page, task, dataset, taskDir, options = {}) {
  const trace = [];
  const observations = [];
  const agent = options.agent;
  if (!agent || typeof agent.act !== "function") {
    throw new Error("runTaskOracleClickLoop requires an agent with act(observation).");
  }

  const taskUrl = buildTaskUrl(options.baseUrl ?? dataset.baseUrl, task, dataset);
  const finalClickIndex = lastClickIndex(task.gold_trace ?? []);
  const taskStartedAt = Date.now();

  if (finalClickIndex < 0) {
    return {
      id: task.id,
      level: task.level ?? null,
      constraint_type: task.constraint_type ?? null,
      instruction: task.instruction,
      state_id: task.state_id,
      target_id: task.target_id,
      passed: false,
      stop_reason: "no_gold_click",
      matched_target_id: null,
      trace_length: 0,
      gold_trace_length: task.gold_trace?.length ?? 0,
      oracle_prefix_length: 0,
      total_elapsed_ms: Date.now() - taskStartedAt,
      observations: [],
      review_shots: [],
      trace,
    };
  }

  const oraclePrefix = (task.gold_trace ?? []).slice(0, finalClickIndex);
  const oracleTargetClick = task.gold_trace[finalClickIndex];

  await page.goto(taskUrl, {
    waitUntil: options.gotoWaitUntil ?? "domcontentloaded",
    timeout: options.gotoTimeoutMs ?? 30_000,
  });
  if (!options.skipRuntimeStateWait) {
    await waitForRuntimeState(page, options.runtimeStateKey);
    await waitForReviewBridge(page, options.runtimeStateKey);
  }
  await sleep(options.initialStabilizeMs ?? 250);
  observations.push(await saveObservation(page, taskDir, "step-00-initial", trace, task.instruction));

  let stopReason = "agent_no_action";
  let passed = false;
  let matchedTargetId = null;

  for (let index = 0; index < oraclePrefix.length; index += 1) {
    const rawAction = oraclePrefix[index];
    let result;
    try {
      result = await executeRuntimeAction(page, rawAction, task, options);
    } catch (error) {
      stopReason = `oracle_prefix_error: ${error.name}: ${error.message}`;
      trace.push({
        step: index + 1,
        phase: "oracle_prefix",
        action: typeof rawAction === "object" && rawAction !== null ? rawAction : { type: "invalid" },
        result: {
          ok: false,
          done: false,
          matched: false,
          message: stopReason,
        },
        runtime_state: null,
      });
      observations.push(await saveObservation(page, taskDir, "oracle-prefix-error", trace, task.instruction));
      return {
        id: task.id,
        level: task.level ?? null,
        constraint_type: task.constraint_type ?? null,
        instruction: task.instruction,
        state_id: task.state_id,
        target_id: task.target_id,
        passed: false,
        stop_reason: stopReason,
        matched_target_id: null,
        trace_length: 0,
        gold_trace_length: task.gold_trace?.length ?? 0,
        oracle_prefix_length: oraclePrefix.length,
        oracle_target_click: actionForTrace(oracleTargetClick),
        total_elapsed_ms: Date.now() - taskStartedAt,
        observations: observations.map((observation) => ({
          ...observation,
          screenshotPath: path.relative(taskDir, observation.screenshotPath),
        })),
        review_shots: observations.map((observation) => observation.screenshotPath),
        trace,
      };
    }

    const runtimeState = result.runtimeState ?? await getRuntimeState(page, options.runtimeStateKey);
    trace.push(traceStepFromResult(index + 1, rawAction, result, runtimeState, task, "oracle_prefix"));
  }

  observations.push(await saveObservation(page, taskDir, "oracle-preclick", trace, task.instruction));
  const oracleTraceLength = trace.length;
  const oraclePreclickObservation = observations[observations.length - 1];

  let rawAction;
  try {
    rawAction = await agent.act({
      ...oraclePreclickObservation,
      task,
      stepIndex: oracleTraceLength,
      targetId: task.target_id ?? null,
      oracle: {
        mode: "preclick",
        prefixLength: oraclePrefix.length,
      },
    });
  } catch (error) {
    stopReason = `agent_error: ${error.name}: ${error.message}`;
  }

  if (rawAction && !stopReason.startsWith("agent_error:")) {
    let normalizedAction = null;
    try {
      normalizedAction = normalizeRuntimeAction(rawAction);
    } catch (error) {
      stopReason = `action_parse_error: ${error.name}: ${error.message}`;
    }

    if (normalizedAction && normalizedAction.type !== "click") {
      stopReason = "non_click_action";
      trace.push({
        step: oracleTraceLength + 1,
        phase: "model_click",
        action: actionForTrace(normalizedAction),
        result: {
          ok: false,
          done: false,
          matched: false,
          observedTargetId: null,
          targetActionable: null,
          expectedTargetId: task.target_id ?? null,
          x: normalizedAction.x ?? null,
          y: normalizedAction.y ?? null,
          selector: normalizedAction.selector ?? null,
          message: "model returned a non-click action in click-only oracle mode",
        },
        runtime_state: await getRuntimeState(page, options.runtimeStateKey),
      });
    } else if (normalizedAction) {
      try {
        const result = await executeRuntimeAction(page, normalizedAction, task, options);
        const runtimeState = result.runtimeState ?? await getRuntimeState(page, options.runtimeStateKey);
        passed = Boolean(result.done);
        matchedTargetId = result.observedTargetId ?? null;
        stopReason = classifyClickResult(result, task);
        trace.push(traceStepFromResult(oracleTraceLength + 1, normalizedAction, result, runtimeState, task, "model_click"));
        observations.push(await saveObservation(page, taskDir, "model-after-click", trace, task.instruction));
      } catch (error) {
        stopReason = `execute_error: ${error.name}: ${error.message}`;
      }
    }
  }

  const modelTrace = trace.slice(oracleTraceLength);
  return {
    id: task.id,
    level: task.level ?? null,
    constraint_type: task.constraint_type ?? null,
    instruction: task.instruction,
    state_id: task.state_id,
    target_id: task.target_id,
    passed,
    stop_reason: stopReason,
    matched_target_id: matchedTargetId,
    trace_length: modelTrace.length,
    gold_trace_length: task.gold_trace?.length ?? 0,
    oracle_prefix_length: oraclePrefix.length,
    oracle_target_click: actionForTrace(oracleTargetClick),
    total_elapsed_ms: Date.now() - taskStartedAt,
    observations: observations.map((observation) => ({
      ...observation,
      screenshotPath: path.relative(taskDir, observation.screenshotPath),
    })),
    review_shots: observations.map((observation) => observation.screenshotPath),
    trace,
  };
}

export async function runTaskInteractionLoop(page, task, dataset, taskDir, options = {}) {
  const trace = [];
  const observations = [];
  const maxSteps = options.maxSteps ?? Math.max(20, (task.gold_trace?.length ?? 0) + 5);
  const agent = options.agent ?? createGoldTraceAgent(task);
  const taskUrl = buildTaskUrl(options.baseUrl ?? dataset.baseUrl, task, dataset);

  // Next dev servers can keep HMR/streaming connections open. The benchmark
  // state is the readiness gate, so do not wait for network quiescence here.
  await page.goto(taskUrl, {
    waitUntil: options.gotoWaitUntil ?? "domcontentloaded",
    timeout: options.gotoTimeoutMs ?? 30_000,
  });
  if (!options.skipRuntimeStateWait) {
    await waitForRuntimeState(page, options.runtimeStateKey);
    await waitForReviewBridge(page, options.runtimeStateKey);
  }
  await sleep(options.initialStabilizeMs ?? 250);
  observations.push(await saveObservation(page, taskDir, "step-00-initial", trace, task.instruction));
  const taskStartedAt = Date.now();

  let passed = false;
  let matchedTargetId = null;
  let stopReason = "max_steps";
  let actionErrors = 0;

  for (let index = 0; index < maxSteps; index += 1) {
    const observation = observations[observations.length - 1];
    let rawAction;
    try {
      rawAction = await agent.act({
        ...observation,
        task,
        stepIndex: index,
        targetId: task.target_id ?? null,
      });
    } catch (error) {
      stopReason = `agent_error: ${error.name}: ${error.message}`;
      break;
    }
    if (!rawAction) {
      stopReason = "agent_no_action";
      break;
    }

    let result;
    try {
      result = await executeRuntimeAction(page, rawAction, task, options);
    } catch (error) {
      trace.push({
        step: index + 1,
        action: typeof rawAction === "object" && rawAction !== null ? rawAction : { type: "invalid" },
        result: {
          ok: false,
          done: false,
          matched: false,
          message: `execute_error: ${error.name}: ${error.message}`,
        },
        runtime_state: null,
      });
      actionErrors += 1;
      if (actionErrors >= (options.maxActionErrors ?? 3)) {
        stopReason = "too_many_action_errors";
        break;
      }
      continue;
    }
    const runtimeState = result.runtimeState ?? await getRuntimeState(page, options.runtimeStateKey);
    const stepNo = String(index + 1).padStart(2, "0");
    const traceStep = {
      step: index + 1,
      action: actionForTrace(result.action),
      result: {
        ok: result.ok,
        done: result.done,
        matched: result.matched,
        observedTargetId: result.observedTargetId ?? null,
        targetActionable: result.targetActionable ?? null,
        expectedTargetId: result.expectedTargetId ?? task.target_id ?? null,
        x: result.x ?? null,
        y: result.y ?? null,
        selector: result.selector ?? null,
        message: result.message,
        elapsedMs: result.elapsedMs,
      },
      runtime_state: runtimeState,
    };
    trace.push(traceStep);

    if (result.actionType === "click") {
      matchedTargetId = result.observedTargetId ?? null;
    }

    observations.push(await saveObservation(page, taskDir, `step-${stepNo}-after-${result.actionType}`, trace, task.instruction));

    if (result.done) {
      passed = true;
      stopReason = "target_matched";
      break;
    }
  }

  return {
    id: task.id,
    level: task.level ?? null,
    constraint_type: task.constraint_type ?? null,
    instruction: task.instruction,
    state_id: task.state_id,
    target_id: task.target_id,
    passed,
    stop_reason: stopReason,
    matched_target_id: matchedTargetId,
    trace_length: trace.length,
    gold_trace_length: task.gold_trace?.length ?? 0,
    wait_time_ms: trace
      .filter((step) => step.action?.type === "wait" && Number.isFinite(Number(step.action.ms)))
      .reduce((sum, step) => sum + Number(step.action.ms), 0),
    action_elapsed_ms: trace.reduce((sum, step) => sum + Number(step.result?.elapsedMs ?? 0), 0),
    total_elapsed_ms: Date.now() - taskStartedAt,
    observations: observations.map((observation) => ({
      ...observation,
      screenshotPath: path.relative(taskDir, observation.screenshotPath),
    })),
    review_shots: observations.map((observation) => observation.screenshotPath),
    trace,
  };
}

function buildLoopReport(summary) {
  const lines = [
    `# ${summary.app} Interaction Loop Report`,
    "",
    `- Run directory: ${summary.run_dir}`,
    `- Screenshot mode: ${summary.screenshot_mode}`,
    `- Viewport: ${summary.viewport.width}x${summary.viewport.height}`,
    `- Total tasks: ${summary.total_tasks}`,
    `- Passed tasks: ${summary.passed_tasks}`,
    `- Failed tasks: ${summary.failed_tasks.length === 0 ? "none" : summary.failed_tasks.join(", ")}`,
    "",
    "## Task Review",
    "",
  ];

  for (const result of summary.results) {
    lines.push(`### ${result.id}`);
    lines.push(`- Instruction: ${result.instruction}`);
    lines.push(`- Passed: ${result.passed ? "yes" : "no"}`);
    lines.push(`- Stop reason: ${result.stop_reason}`);
    lines.push(`- Target ID: ${result.target_id}`);
    lines.push(`- Matched target ID: ${result.matched_target_id ?? "none"}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export async function runAppWithAgent(app, agentFactory, options = {}) {
  const config = APP_CONFIGS[app];
  if (!config) throw new Error(`Unknown app: ${app}`);
  if (typeof agentFactory !== "function") {
    throw new Error("runAppWithAgent requires an agentFactory(task) function.");
  }

  const repoRoot = options.repoRoot ?? process.cwd();
  const workspaceRoot = options.workspaceRoot ?? workspaceRootFromRepo(repoRoot);
  const datasetPath = path.resolve(repoRoot, options.datasetPath ?? config.datasetPath);
  const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
  const baseUrl = process.env[config.envBaseUrl] ?? options.baseUrl ?? dataset.baseUrl ?? config.baseUrl;
  const viewport = dataset.app_viewport ?? dataset.appViewport ?? DEFAULT_VIEWPORT;
  const outputRoot = path.resolve(workspaceRoot, options.outputDir ?? config.outputDir);
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = path.join(outputRoot, runId);
  await mkdir(runDir, { recursive: true });

  const server = (await isServerAvailable(baseUrl)) ? null : startAppServer(config, repoRoot, options);
  let browser = null;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({ headless: options.headless ?? true, args: BROWSER_ARGS });
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

    const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : null;
    const allTasks = typeof options.taskFilter === "function"
      ? (dataset.tasks ?? []).filter((task) => options.taskFilter(task))
      : (dataset.tasks ?? []);
    const tasks = limit ? allTasks.slice(0, limit) : allTasks;
    const results = [];
    for (const task of tasks) {
      const taskDir = path.join(runDir, task.id);
      await mkdir(taskDir, { recursive: true });
      const result = await runTaskInteractionLoop(page, task, dataset, taskDir, {
        ...options,
        baseUrl,
        runtimeStateKey: config.runtimeStateKey,
        agent: agentFactory(task),
      });
      results.push(result);
      await writeFile(path.join(taskDir, "trace.json"), `${JSON.stringify(result, null, 2)}\n`);
    }

    const metrics = computeInteractionMetrics(results);
    const summary = {
      app,
      dataset_name: dataset.dataset_name ?? `${app}-final-dataset`,
      version: dataset.version ?? "final",
      base_url: baseUrl,
      viewport,
      screenshot_mode: "viewport_only",
      run_dir: runDir,
      total_tasks: results.length,
      requested_task_limit: limit,
      passed_tasks: metrics.passed,
      failed_tasks: results.filter((result) => !result.passed).map((result) => result.id),
      metrics,
      results: results.map((result) => ({
        ...result,
        review_shots: result.review_shots.map((shotPath) => path.relative(runDir, shotPath)),
      })),
    };

    await writeFile(path.join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await writeFile(
      path.join(runDir, "review_manifest.json"),
      `${JSON.stringify({
        run_id: runId,
        app,
        screenshot_mode: "viewport_only",
        viewport,
        tasks: summary.results.map((result) => ({
          id: result.id,
          instruction: result.instruction,
          passed: result.passed,
          stop_reason: result.stop_reason,
          review_shots: result.review_shots,
        })),
      }, null, 2)}\n`,
    );
    await writeFile(path.join(runDir, "loop_report.md"), buildLoopReport(summary));
    return summary;
  } finally {
    if (browser) await browser.close();
    await stopAppServer(server);
  }
}

export async function runAppWithGoldTrace(app, options = {}) {
  return runAppWithAgent(app, (task) => createGoldTraceAgent(task), options);
}

function buildOracleClickReport(summary) {
  const lines = [
    `# ${summary.app} Oracle Click Report`,
    "",
    `- Run directory: ${summary.run_dir}`,
    `- Screenshot mode: ${summary.screenshot_mode}`,
    `- Viewport: ${summary.viewport.width}x${summary.viewport.height}`,
    `- Total tasks: ${summary.total_tasks}`,
    `- Passed tasks: ${summary.passed_tasks}`,
    `- pass@1: ${summary.metrics.pass_at_1.toFixed(4)}`,
    `- Failed tasks: ${summary.failed_tasks.length === 0 ? "none" : summary.failed_tasks.join(", ")}`,
    "",
    "## Task Review",
    "",
  ];

  for (const result of summary.results) {
    lines.push(`### ${result.id}`);
    lines.push(`- Instruction: ${result.instruction}`);
    lines.push(`- Passed: ${result.passed ? "yes" : "no"}`);
    lines.push(`- Stop reason: ${result.stop_reason}`);
    lines.push(`- Target ID: ${result.target_id}`);
    lines.push(`- Matched target ID: ${result.matched_target_id ?? "none"}`);
    lines.push(`- Oracle prefix length: ${result.oracle_prefix_length}`);
    lines.push("");
  }
  return `${lines.join("\n")}\n`;
}

export async function runAppWithOracleClickAgent(app, agentFactory, options = {}) {
  const config = APP_CONFIGS[app];
  if (!config) throw new Error(`Unknown app: ${app}`);
  if (typeof agentFactory !== "function") {
    throw new Error("runAppWithOracleClickAgent requires an agentFactory(task) function.");
  }

  const repoRoot = options.repoRoot ?? process.cwd();
  const workspaceRoot = options.workspaceRoot ?? workspaceRootFromRepo(repoRoot);
  const datasetPath = path.resolve(repoRoot, options.datasetPath ?? config.datasetPath);
  const dataset = JSON.parse(await readFile(datasetPath, "utf8"));
  const baseUrl = process.env[config.envBaseUrl] ?? options.baseUrl ?? dataset.baseUrl ?? config.baseUrl;
  const viewport = dataset.app_viewport ?? dataset.appViewport ?? DEFAULT_VIEWPORT;
  const outputRoot = options.outputDir
    ? path.resolve(workspaceRoot, options.outputDir)
    : path.resolve(repoRoot, "artifacts", `${app}-oracle-click`);
  const runId = options.runId ?? new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = options.runDir ? path.resolve(repoRoot, options.runDir) : path.join(outputRoot, runId);
  await mkdir(runDir, { recursive: true });

  const server = (await isServerAvailable(baseUrl)) ? null : startAppServer(config, repoRoot, options);
  let browser = null;

  try {
    await waitForServer(baseUrl);
    browser = await chromium.launch({ headless: options.headless ?? true, args: BROWSER_ARGS });
    const page = await browser.newPage({ viewport, deviceScaleFactor: 1 });

    const limit = Number.isFinite(Number(options.limit)) ? Number(options.limit) : null;
    const allTasks = typeof options.taskFilter === "function"
      ? (dataset.tasks ?? []).filter((task) => options.taskFilter(task))
      : (dataset.tasks ?? []);
    const tasks = limit ? allTasks.slice(0, limit) : allTasks;
    const results = [];
    for (const task of tasks) {
      const taskDir = path.join(runDir, task.id);
      await mkdir(taskDir, { recursive: true });
      const result = await runTaskOracleClickLoop(page, task, dataset, taskDir, {
        ...options,
        baseUrl,
        runtimeStateKey: config.runtimeStateKey,
        agent: agentFactory(task),
      });
      results.push(result);
      await writeFile(path.join(taskDir, "trace.json"), `${JSON.stringify(result, null, 2)}\n`);
    }

    const metrics = computeOracleClickMetrics(results);
    const summary = {
      app,
      dataset_name: dataset.dataset_name ?? `${app}-final-dataset`,
      version: dataset.version ?? "final",
      base_url: baseUrl,
      viewport,
      screenshot_mode: "oracle_preclick_viewport",
      run_dir: runDir,
      total_tasks: results.length,
      requested_task_limit: limit,
      passed_tasks: metrics.passed,
      failed_tasks: results.filter((result) => !result.passed).map((result) => result.id),
      metrics,
      results: results.map((result) => ({
        ...result,
        review_shots: result.review_shots.map((shotPath) => path.relative(runDir, shotPath)),
      })),
    };

    await writeFile(path.join(runDir, "summary.json"), `${JSON.stringify(summary, null, 2)}\n`);
    await writeFile(
      path.join(runDir, "review_manifest.json"),
      `${JSON.stringify({
        run_id: runId,
        app,
        screenshot_mode: "oracle_preclick_viewport",
        viewport,
        tasks: summary.results.map((result) => ({
          id: result.id,
          instruction: result.instruction,
          passed: result.passed,
          stop_reason: result.stop_reason,
          review_shots: result.review_shots,
        })),
      }, null, 2)}\n`,
    );
    await writeFile(path.join(runDir, "oracle_click_report.md"), buildOracleClickReport(summary));
    return summary;
  } finally {
    if (browser) await browser.close();
    await stopAppServer(server);
  }
}
