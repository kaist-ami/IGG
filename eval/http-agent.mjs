// Client for the IGG /act protocol. Each step POSTs the instruction, the prior
// trace, and the current viewport screenshot; the server returns one action.
import { readFile } from "node:fs/promises";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableAgentError(errorText, status) {
  const text = String(errorText ?? "").toLowerCase();
  return (
    status === 429 ||
    (status >= 500 && status <= 599) ||
    text.includes("ratelimiterror") ||
    text.includes("rate_limit_error")
  );
}

export function createHttpAgentFactory({ agentUrl, timeoutMs, sendPathOnly, retryLimit = 0, retryBaseMs = 15000 }) {
  const endpoint = new URL("/act", agentUrl);

  return (task) => ({
    name: "visual_model_http_agent",
    async act(observation) {
      const payload = {
        instruction: observation.instruction,
        trace: observation.trace,
        stepIndex: observation.stepIndex,
        screenshotMode: observation.screenshotMode,
        task: { id: task.id },
      };

      if (sendPathOnly) {
        payload.screenshotPath = observation.screenshotPath;
      } else {
        const image = await readFile(observation.screenshotPath);
        payload.screenshotBase64 = image.toString("base64");
        payload.screenshotMimeType = "image/png";
      }

      for (let attempt = 0; attempt <= retryLimit; attempt += 1) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(timeoutMs),
        });
        const body = await response.json().catch(() => ({}));
        if (response.ok && body.ok) {
          return {
            ...body.action,
            _modelRawText: body.rawText ?? null,
            _modelId: body.modelId ?? null,
            _promptVersion: body.promptVersion ?? null,
          };
        }

        const errorText = body.error ?? `Agent /act failed with HTTP ${response.status}`;
        if (attempt >= retryLimit || !isRetryableAgentError(errorText, response.status)) {
          throw new Error(errorText);
        }

        const delayMs = retryBaseMs * (attempt + 1);
        console.error(
          `[visual_model_http_agent] retryable /act failure for ${task.id}; retry ${attempt + 1}/${retryLimit} in ${delayMs}ms: ${errorText}`,
        );
        await sleep(delayMs);
      }
      throw new Error("Agent /act failed after retries");
    },
  });
}
