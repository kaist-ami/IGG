#!/usr/bin/env python
"""HTTP /act server for OpenAI IGG agents.

This is the screenshot-only commercial baseline for IGG. The browser proposal
loop lives in ``lib/interaction-runner.mjs``; this server only sends the
current screenshot and shared IGG prompt to the OpenAI Responses API and
returns one normalized action JSON object.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

import requests

REPO_ROOT = Path(__file__).resolve().parents[1]
SERVER_DIR = Path(__file__).resolve().parent
INTERACTION_DIR = Path(__file__).resolve().parents[1]
for module_dir in (SERVER_DIR, INTERACTION_DIR):
    if str(module_dir) not in sys.path:
        sys.path.insert(0, str(module_dir))

from prompts.igg_prompt import (  # noqa: E402
    PROMPT_VERSION,
    VIEWPORT_HEIGHT,
    VIEWPORT_WIDTH,
    build_user_message,
    get_system_prompt,
    parse_action_response,
)
from qwen_vl_server_common import materialize_screenshot, write_synthetic_screenshot  # noqa: E402

DEFAULT_MODEL_ID = "gpt-5.5"
DEFAULT_MAX_OUTPUT_TOKENS = 4096
DEFAULT_REASONING_EFFORT = "medium"
DEFAULT_IMAGE_DETAIL = "high"
RESPONSES_URL = "https://api.openai.com/v1/responses"


def load_env_file(path: Path = REPO_ROOT / ".env") -> None:
    """Load simple KEY=VALUE pairs without overriding existing environment."""
    try:
        lines = path.read_text(encoding="utf-8").splitlines()
    except FileNotFoundError:
        return

    for raw_line in lines:
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("export "):
            line = line[len("export "):].strip()
        key, sep, value = line.partition("=")
        if not sep:
            continue
        key = key.strip()
        if not key or key in os.environ:
            continue
        value = value.strip()
        if len(value) >= 2 and value[0] == value[-1] and value[0] in {"'", '"'}:
            value = value[1:-1]
        os.environ[key] = value


def _read_screenshot(observation: dict[str, Any]) -> tuple[bytes, str]:
    path, cleanup = materialize_screenshot(observation)
    try:
        data = Path(path).read_bytes()
    finally:
        if cleanup:
            try:
                Path(cleanup).unlink(missing_ok=True)
            except OSError:
                pass
    mime = "image/png"
    if path.lower().endswith((".jpg", ".jpeg")):
        mime = "image/jpeg"
    elif path.lower().endswith(".webp"):
        mime = "image/webp"
    return data, mime


def _format_trace(trace: list[dict[str, Any]]) -> list[dict[str, Any]]:
    formatted: list[dict[str, Any]] = []
    for index, item in enumerate(trace):
        if isinstance(item, dict) and "action" in item:
            formatted.append(item)
        else:
            formatted.append({"step": index + 1, "action": item, "result": {}})
    return formatted


def _extract_output_text(response_json: dict[str, Any]) -> str:
    output_text = response_json.get("output_text")
    if isinstance(output_text, str):
        return output_text.strip()

    chunks: list[str] = []
    for item in response_json.get("output") or []:
        if not isinstance(item, dict):
            continue
        if item.get("type") == "message":
            for content in item.get("content") or []:
                if isinstance(content, dict) and isinstance(content.get("text"), str):
                    chunks.append(content["text"])
        elif item.get("type") == "output_text" and isinstance(item.get("text"), str):
            chunks.append(item["text"])
    return "".join(chunks).strip()


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


class OpenAIPlainAgent:
    """Vision baseline: same system prompt as Qwen, JSON-out, stateless."""

    name = "openai_plain_http_agent"

    def __init__(
        self,
        *,
        model_id: str,
        prompt_version: str,
        max_output_tokens: int,
        reasoning_effort: str,
        image_detail: str,
        temperature: float | None,
        timeout: float,
        api_key: str,
    ) -> None:
        self.model_id = model_id
        self.prompt_version = prompt_version
        self.max_output_tokens = max_output_tokens
        self.reasoning_effort = reasoning_effort
        self.image_detail = image_detail
        self.temperature = temperature
        self.timeout = timeout
        self.api_key = api_key
        self.system_prompt = get_system_prompt(prompt_version)
        self.family = "openai"
        print(
            f"[openai] ready (model={model_id}, prompt={prompt_version}, "
            f"reasoning={reasoning_effort}, image_detail={image_detail})",
            file=sys.stderr,
        )

    def act(self, observation: dict[str, Any]) -> dict[str, Any]:
        image_bytes, mime = _read_screenshot(observation)
        instruction = str(observation.get("instruction") or "")
        trace = _format_trace(observation.get("trace") or [])
        step_index = int(observation.get("stepIndex") or 0)
        user_text = build_user_message(
            instruction=instruction,
            trace=trace,
            step_index=step_index,
            viewport=(VIEWPORT_WIDTH, VIEWPORT_HEIGHT),
        )
        image_url = f"data:{mime};base64,{base64.b64encode(image_bytes).decode('ascii')}"
        payload: dict[str, Any] = {
            "model": self.model_id,
            "instructions": self.system_prompt,
            "input": [
                {
                    "role": "user",
                    "content": [
                        {"type": "input_text", "text": user_text},
                        {
                            "type": "input_image",
                            "image_url": image_url,
                            "detail": self.image_detail,
                        },
                    ],
                }
            ],
            "max_output_tokens": self.max_output_tokens,
            "reasoning": {"effort": self.reasoning_effort},
            "store": False,
        }
        if self.temperature is not None:
            payload["temperature"] = self.temperature

        response = requests.post(
            RESPONSES_URL,
            headers={
                "Authorization": f"Bearer {self.api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
            timeout=self.timeout,
        )
        try:
            data = response.json()
        except ValueError as e:
            raise RuntimeError(f"OpenAI returned non-JSON HTTP {response.status_code}: {response.text[:500]}") from e

        if not response.ok:
            error = data.get("error") if isinstance(data, dict) else None
            message = error.get("message") if isinstance(error, dict) else str(data)
            raise RuntimeError(f"OpenAI HTTP {response.status_code}: {message}")

        raw_text = _extract_output_text(data)
        action = parse_action_response(raw_text)
        if action is None:
            incomplete = data.get("incomplete_details") if isinstance(data, dict) else None
            status = data.get("status") if isinstance(data, dict) else None
            detail = f" status={status!r} incomplete_details={incomplete!r}"
            raise ValueError(f"Could not parse OpenAI action response: {raw_text!r}.{detail}")
        return {"action": action, "rawText": raw_text}


def make_handler(agent: OpenAIPlainAgent) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        server_version = "IGGOpenAIServer/1.0"

        def log_message(self, fmt: str, *args: Any) -> None:
            print(f"[http] {self.address_string()} {fmt % args}", file=sys.stderr)

        def do_GET(self) -> None:  # noqa: N802
            if self.path.rstrip("/") == "/health":
                _json_response(self, 200, {
                    "ok": True,
                    "modelId": agent.model_id,
                    "family": agent.family,
                    "promptVersion": agent.prompt_version,
                    "reasoningEffort": agent.reasoning_effort,
                    "imageDetail": agent.image_detail,
                })
                return
            _json_response(self, 404, {"ok": False, "error": "not_found"})

        def do_POST(self) -> None:  # noqa: N802
            if self.path.rstrip("/") != "/act":
                _json_response(self, 404, {"ok": False, "error": "not_found"})
                return

            try:
                length = int(self.headers.get("Content-Length") or "0")
                payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
                started = time.time()
                result = agent.act(payload)
                _json_response(self, 200, {
                    "ok": True,
                    "action": result["action"],
                    "rawText": result["rawText"],
                    "elapsedMs": int(round((time.time() - started) * 1000)),
                    "modelId": agent.model_id,
                    "promptVersion": agent.prompt_version,
                })
            except Exception as e:  # noqa: BLE001
                print(f"[{agent.family}] /act failed: {type(e).__name__}: {e}", file=sys.stderr)
                _json_response(self, 500, {
                    "ok": False,
                    "error": f"{type(e).__name__}: {e}",
                })

    return Handler


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Start an OpenAI IGG /act server.")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8015)
    parser.add_argument("--model-id", default=DEFAULT_MODEL_ID)
    parser.add_argument("--prompt-version", default=PROMPT_VERSION)
    parser.add_argument("--max-output-tokens", type=int, default=DEFAULT_MAX_OUTPUT_TOKENS)
    parser.add_argument(
        "--reasoning-effort",
        choices=["none", "low", "medium", "high", "xhigh"],
        default=DEFAULT_REASONING_EFFORT,
    )
    parser.add_argument("--image-detail", choices=["low", "high", "auto"], default=DEFAULT_IMAGE_DETAIL)
    parser.add_argument("--temperature", type=float, default=None)
    parser.add_argument("--timeout", type=float, default=180.0)
    parser.add_argument("--api-key", default=None, help="Override OPENAI_API_KEY for this process.")
    parser.add_argument("--smoke-test", action="store_true")
    parser.add_argument("--smoke-screenshot", default=None)
    parser.add_argument("--smoke-instruction", default="Find the 'Music' button.")
    args = parser.parse_args(argv)

    load_env_file()
    api_key = args.api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("[openai] OPENAI_API_KEY is not set; refusing to start.", file=sys.stderr)
        return 2

    agent = OpenAIPlainAgent(
        model_id=args.model_id,
        prompt_version=args.prompt_version,
        max_output_tokens=args.max_output_tokens,
        reasoning_effort=args.reasoning_effort,
        image_detail=args.image_detail,
        temperature=args.temperature,
        timeout=args.timeout,
        api_key=api_key,
    )

    if args.smoke_test:
        screenshot = Path(args.smoke_screenshot or (REPO_ROOT / ".tmp-smoke" / "openai.png"))
        if not screenshot.exists() or args.smoke_screenshot is None:
            write_synthetic_screenshot(screenshot)
        started = time.time()
        result = agent.act({
            "screenshotPath": str(screenshot),
            "instruction": args.smoke_instruction,
            "trace": [],
            "stepIndex": 0,
        })
        print(json.dumps({
            "ok": True,
            "action": result["action"],
            "rawText": result["rawText"],
            "elapsed_s": round(time.time() - started, 2),
            "screenshot": str(screenshot),
            "model_id": args.model_id,
            "prompt_version": args.prompt_version,
        }, indent=2))
        return 0

    server = ThreadingHTTPServer((args.host, args.port), make_handler(agent))
    print(f"[openai] listening on http://{args.host}:{args.port}", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[openai] shutting down", file=sys.stderr)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
