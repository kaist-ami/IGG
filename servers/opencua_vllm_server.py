#!/usr/bin/env python
"""Start an OpenCUA /act server for the JS interaction runner, backed by vLLM.

OpenCUA uses a custom architecture (trust_remote_code), so the model itself is
served by `vllm serve` (OpenAI-compatible API). This adapter keeps the IGG
protocol identical to the other servers: same system prompt, same user message,
same strict parser. OpenCUA emits absolute pixel coordinates on the
smart-resized image (Qwen2-VL resize, factor 28), so the screenshot is resized
here first and the action is mapped back to the 1440x900 viewport.
"""

from __future__ import annotations

import argparse
import base64
import io
import json
import math
import re
import sys
import time
import urllib.request
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

SERVER_DIR = Path(__file__).resolve().parent
INTERACTION_DIR = Path(__file__).resolve().parents[1]
for _p in (SERVER_DIR, INTERACTION_DIR):
    if str(_p) not in sys.path:
        sys.path.insert(0, str(_p))

from prompts.igg_prompt import (  # noqa: E402
    PROMPT_VERSION,
    VIEWPORT_HEIGHT,
    VIEWPORT_WIDTH,
    build_user_message,
    get_system_prompt,
    parse_action_response,
)
from qwen_vl_server_common import materialize_screenshot  # noqa: E402

DEFAULT_MAX_NEW_TOKENS = 1024
# From OpenCUA-72B preprocessor_config.json (Qwen2VLImageProcessor).
RESIZE_FACTOR = 28
MIN_PIXELS = 3136
MAX_PIXELS = 12845056


def smart_resize(height: int, width: int) -> tuple[int, int]:
    h = max(RESIZE_FACTOR, round(height / RESIZE_FACTOR) * RESIZE_FACTOR)
    w = max(RESIZE_FACTOR, round(width / RESIZE_FACTOR) * RESIZE_FACTOR)
    if h * w > MAX_PIXELS:
        beta = math.sqrt((height * width) / MAX_PIXELS)
        h = math.floor(height / beta / RESIZE_FACTOR) * RESIZE_FACTOR
        w = math.floor(width / beta / RESIZE_FACTOR) * RESIZE_FACTOR
    elif h * w < MIN_PIXELS:
        beta = math.sqrt(MIN_PIXELS / (height * width))
        h = math.ceil(height * beta / RESIZE_FACTOR) * RESIZE_FACTOR
        w = math.ceil(width * beta / RESIZE_FACTOR) * RESIZE_FACTOR
    return h, w


_LENIENT_TYPE_RE = re.compile(r'"type"\s*:\s*"(\w+)"')
_LENIENT_NUM_RE = r'"?\b{key}"?\s*[:=]\s*"?\s*(-?\d+(?:\.\d+)?)'


def lenient_parse(text: str) -> dict[str, Any] | None:
    """Reference-only fallback: pull type and coordinates out of malformed JSON
    such as {"type": "click", "x": "119, y=129}". Not part of the IGG protocol."""
    type_match = _LENIENT_TYPE_RE.search(text or "")
    if not type_match:
        return None
    fields: dict[str, Any] = {"type": type_match.group(1)}
    for key in ("x", "y", "startX", "startY", "endX", "endY", "deltaX", "deltaY", "ms"):
        m = re.search(_LENIENT_NUM_RE.format(key=key), text)
        if m:
            fields[key] = m.group(1)
    return parse_action_response(json.dumps(fields))


def _format_trace(trace: list[dict[str, Any]]) -> list[dict[str, Any]]:
    formatted: list[dict[str, Any]] = []
    for index, item in enumerate(trace):
        if isinstance(item, dict) and "action" in item:
            formatted.append(item)
        else:
            formatted.append({"step": index + 1, "action": item, "result": {}})
    return formatted


def _rescale(action: dict[str, Any], sx: float, sy: float) -> dict[str, Any]:
    rescaled = dict(action)
    for key in ("x", "startX", "endX"):
        if key in rescaled and rescaled[key] is not None:
            rescaled[key] = max(0, min(VIEWPORT_WIDTH, int(round(float(rescaled[key]) * sx))))
    for key in ("y", "startY", "endY"):
        if key in rescaled and rescaled[key] is not None:
            rescaled[key] = max(0, min(VIEWPORT_HEIGHT, int(round(float(rescaled[key]) * sy))))
    return rescaled


class OpenCUAVLLMAgent:
    name = "opencua_vllm_http_agent"

    def __init__(
        self,
        *,
        vllm_url: str,
        served_model: str,
        model_id: str,
        prompt_version: str = PROMPT_VERSION,
        max_new_tokens: int = DEFAULT_MAX_NEW_TOKENS,
        timeout_s: float = 600.0,
        lenient_parse: bool = False,
    ) -> None:
        self.lenient_parse = lenient_parse
        self.vllm_url = vllm_url.rstrip("/")
        self.served_model = served_model
        self.model_id = model_id
        self.prompt_version = prompt_version
        self.max_new_tokens = max_new_tokens
        self.timeout_s = timeout_s
        self.system_prompt = get_system_prompt(prompt_version)
        self.family = "opencua"

    def _encode_resized(self, screenshot_path: str) -> tuple[str, int, int]:
        from PIL import Image

        with Image.open(screenshot_path) as img:
            img = img.convert("RGB")
            resized_h, resized_w = smart_resize(img.height, img.width)
            if (img.width, img.height) != (resized_w, resized_h):
                img = img.resize((resized_w, resized_h), Image.BICUBIC)
            buf = io.BytesIO()
            img.save(buf, format="PNG")
        return base64.b64encode(buf.getvalue()).decode("ascii"), resized_h, resized_w

    def _chat(self, image_b64: str, user_text: str) -> str:
        body = {
            "model": self.served_model,
            "messages": [
                {"role": "system", "content": self.system_prompt},
                {
                    "role": "user",
                    "content": [
                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{image_b64}"}},
                        {"type": "text", "text": user_text},
                    ],
                },
            ],
            "max_tokens": self.max_new_tokens,
            "temperature": 0,
        }
        request = urllib.request.Request(
            f"{self.vllm_url}/chat/completions",
            data=json.dumps(body).encode("utf-8"),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(request, timeout=self.timeout_s) as response:
            payload = json.loads(response.read().decode("utf-8"))
        return payload["choices"][0]["message"]["content"] or ""

    def act(self, observation: dict[str, Any]) -> dict[str, Any]:
        screenshot_path, cleanup_path = materialize_screenshot(observation)
        try:
            image_b64, resized_h, resized_w = self._encode_resized(screenshot_path)
        finally:
            if cleanup_path:
                try:
                    Path(cleanup_path).unlink(missing_ok=True)
                except OSError:
                    pass

        user_text = build_user_message(
            instruction=str(observation.get("instruction") or ""),
            trace=_format_trace(observation.get("trace") or []),
            step_index=int(observation.get("stepIndex") or 0),
            viewport=(VIEWPORT_WIDTH, VIEWPORT_HEIGHT),
        )
        raw_text = self._chat(image_b64, user_text)

        action = parse_action_response(raw_text)
        if action is None and self.lenient_parse:
            action = lenient_parse(raw_text)
            if action is not None:
                print(f"[opencua] lenient parse used: {raw_text!r}", file=sys.stderr)
        if action is None:
            raise ValueError(f"Failed to parse action from response: {raw_text!r}")
        action = _rescale(action, VIEWPORT_WIDTH / resized_w, VIEWPORT_HEIGHT / resized_h)
        return {"action": action, "rawText": raw_text}


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def make_handler(agent: OpenCUAVLLMAgent) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        server_version = "IGGOpenCUAServer/1.0"

        def log_message(self, fmt: str, *args: Any) -> None:
            print(f"[http] {self.address_string()} {fmt % args}", file=sys.stderr)

        def do_GET(self) -> None:  # noqa: N802
            if self.path.rstrip("/") == "/health":
                try:
                    with urllib.request.urlopen(f"{agent.vllm_url}/models", timeout=10) as response:
                        response.read()
                except Exception as e:  # noqa: BLE001
                    _json_response(self, 503, {"ok": False, "error": f"vllm not ready: {e}"})
                    return
                _json_response(self, 200, {
                    "ok": True,
                    "modelId": agent.model_id,
                    "family": agent.family,
                    "coordSpace": "resized",
                    "promptVersion": agent.prompt_version,
                })
                return
            _json_response(self, 404, {"ok": False, "error": "not_found"})

        def do_POST(self) -> None:  # noqa: N802
            if self.path.rstrip("/") != "/act":
                _json_response(self, 404, {"ok": False, "error": "not_found"})
                return
            try:
                length = int(self.headers.get("Content-Length") or "0")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
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
                print(f"[opencua] /act failed: {type(e).__name__}: {e}", file=sys.stderr)
                _json_response(self, 500, {"ok": False, "error": f"{type(e).__name__}: {e}"})

    return Handler


def build_argparser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=18029)
    parser.add_argument("--vllm-url", default="http://127.0.0.1:18100/v1")
    parser.add_argument("--served-model", default="opencua-72b")
    parser.add_argument("--model-id", default="xlangai/OpenCUA-72B")
    parser.add_argument("--prompt-version", default=PROMPT_VERSION)
    parser.add_argument("--max-new-tokens", type=int, default=DEFAULT_MAX_NEW_TOKENS)
    parser.add_argument("--lenient-parse", action="store_true",
                        help="Reference only: regex fallback when strict parsing fails.")
    parser.add_argument("--smoke-screenshot", default=None,
                        help="Run one /act on this screenshot and exit.")
    parser.add_argument("--smoke-instruction", default="Click the bottom-right corner of the screen.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_argparser().parse_args(argv)
    agent = OpenCUAVLLMAgent(
        vllm_url=args.vllm_url,
        served_model=args.served_model,
        model_id=args.model_id,
        prompt_version=args.prompt_version,
        max_new_tokens=args.max_new_tokens,
        lenient_parse=args.lenient_parse,
    )
    if args.smoke_screenshot:
        started = time.time()
        result = agent.act({
            "screenshotPath": args.smoke_screenshot,
            "instruction": args.smoke_instruction,
            "trace": [],
            "stepIndex": 0,
        })
        print(json.dumps({**result, "elapsed_s": round(time.time() - started, 2)}, indent=2))
        return 0

    server = ThreadingHTTPServer((args.host, args.port), make_handler(agent))
    print(f"[opencua] listening on http://{args.host}:{args.port} -> {args.vllm_url}", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[opencua] shutting down", file=sys.stderr)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
