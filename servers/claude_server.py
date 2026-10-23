#!/usr/bin/env python
"""HTTP /act server for Claude IGG agents.

Two modes share the same proposal loop in ``lib/interaction-runner.mjs``:

  * ``--mode plain`` — vision baseline. Same system prompt as the Qwen and
    GUI-Owl servers (``prompts.igg_prompt.SYSTEM_PROMPT_V1``), JSON action
    output parsed via ``parse_action_response``. Stateless.

  * ``--mode cu`` — Anthropic computer-use tool. Per-task conversation state
    keyed by ``task.id`` so subsequent screenshots are delivered as
    ``tool_result`` blocks tied to the prior ``tool_use``. The model picks
    actions through the ``computer`` tool; supported actions are mapped to
    the IGG action space.
"""

from __future__ import annotations

import argparse
import base64
import json
import os
import sys
import time
import threading
import re
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

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
from qwen_vl_server_common import materialize_screenshot  # noqa: E402

DEFAULT_MODEL_ID = "claude-sonnet-4-6"
DEFAULT_MAX_TOKENS = 1024
DEFAULT_TOOL_VERSION = "computer_20251124"
COMPUTER_TOOL_VERSION_RE = re.compile(r"^computer_(\d{4})(\d{2})(\d{2})$")

CU_SYSTEM_PROMPT_V1 = f"""You are an Interactive GUI Grounding (IGG) agent operating a browser via the computer tool.

Your ONLY goal is to locate the single UI element described in the instruction
and click on it. The element may NOT be visible in the current screenshot. In
that case, take the minimum interaction needed to reveal it (scroll, hover,
expand, wait, drag an occluder aside) and then click the element.

This is a grounding task, not a navigation task. Do NOT try to complete any
higher-level workflow; just find the target and click it.

The browser viewport is {VIEWPORT_WIDTH} x {VIEWPORT_HEIGHT} pixels. All
coordinates are integer pixels in this space with (0, 0) at the top-left.

Allowed computer actions (use ONLY these):
  - left_click(coordinate)               commits the grounding answer
  - mouse_move(coordinate)               triggers hover-reveal targets/tooltips
  - scroll(coordinate, scroll_direction, scroll_amount)
  - left_click_drag(start_coordinate, coordinate)   to nudge an occluder aside
  - wait(duration)                       for delayed/timed targets

Do NOT use: screenshot, key, type, right_click, double_click, triple_click,
hold_key, cursor_position, left_mouse_down, left_mouse_up. A fresh screenshot
is supplied automatically after every action — never request one.

Click semantics: a left_click is the grounding commit. If the click lands on
the target element, the task ends with success. If it lands on anything else,
the task continues but you have wasted budget. Be deliberate; do NOT click
exploratory elements just to see what happens.

Budget: at most 8 actions per task. Reply with a single tool_use per turn.
"""


CU_SYSTEM_PROMPT_V2 = CU_SYSTEM_PROMPT_V1 + """

CRITICAL — strict format requirements:
1. You MUST emit exactly one tool_use per turn. Never reply with text alone.
2. Do NOT respond with text claiming completion — the task ends ONLY when
   your left_click lands on the target element (we evaluate every click).
3. The action you emit MUST be one of these five only:
   left_click, mouse_move, scroll, left_click_drag, wait.
   Any other action (screenshot, key, type, right_click, double_click,
   triple_click, hold_key, cursor_position, left_mouse_down/up) will be
   REJECTED and waste a step from your 8-action budget.
4. If you think the target is visible, emit left_click on it; if uncertain,
   emit one more revealing action from the allowed set.
"""


CU_PROMPTS = {"v1.0": CU_SYSTEM_PROMPT_V1, "v2.0": CU_SYSTEM_PROMPT_V2}


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


def _b64_image_block(image_bytes: bytes, mime: str = "image/png") -> dict[str, Any]:
    return {
        "type": "image",
        "source": {
            "type": "base64",
            "media_type": mime,
            "data": base64.b64encode(image_bytes).decode("ascii"),
        },
    }


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
    return data, mime


def _format_trace(trace: list[dict[str, Any]]) -> list[dict[str, Any]]:
    formatted: list[dict[str, Any]] = []
    for index, item in enumerate(trace):
        if isinstance(item, dict) and "action" in item:
            formatted.append(item)
        else:
            formatted.append({"step": index + 1, "action": item, "result": {}})
    return formatted


class ClaudePlainAgent:
    """Vision baseline: same system prompt as Qwen, JSON-out, stateless."""

    name = "claude_plain_http_agent"

    def __init__(
        self,
        *,
        model_id: str,
        prompt_version: str,
        max_tokens: int,
        api_key: str | None,
    ) -> None:
        import anthropic  # local import keeps import-time cost low for non-API runs

        self.client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()
        self.model_id = model_id
        self.prompt_version = prompt_version
        self.max_tokens = max_tokens
        self.system_prompt = get_system_prompt(prompt_version)
        self.family = "claude-plain"
        print(f"[claude-plain] ready (model={model_id}, prompt={prompt_version})", file=sys.stderr)

    def reset(self, _task_id: str) -> None:
        return

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
        response = self.client.messages.create(
            model=self.model_id,
            max_tokens=self.max_tokens,
            system=self.system_prompt,
            messages=[
                {
                    "role": "user",
                    "content": [
                        _b64_image_block(image_bytes, mime),
                        {"type": "text", "text": user_text},
                    ],
                }
            ],
        )
        raw_text = "".join(
            block.text for block in response.content if getattr(block, "type", None) == "text"
        ).strip()
        action = parse_action_response(raw_text)
        if action is None:
            raise ValueError(f"Failed to parse action from response: {raw_text!r}")
        return {"action": action, "rawText": raw_text}


def _coord_pair(value: Any) -> tuple[int, int]:
    if not isinstance(value, (list, tuple)) or len(value) != 2:
        raise ValueError(f"Expected [x, y] coordinate, got: {value!r}")
    x = int(round(float(value[0])))
    y = int(round(float(value[1])))
    return x, y


def _clamp(value: int, low: int, high: int) -> int:
    return max(low, min(high, value))


def _computer_use_beta(tool_version: str) -> str:
    match = COMPUTER_TOOL_VERSION_RE.match(tool_version)
    if not match:
        raise ValueError(f"Unsupported computer-use tool version: {tool_version!r}")
    year, month, day = match.groups()
    return f"computer-use-{year}-{month}-{day}"


def _map_cu_action(tool_input: dict[str, Any], scroll_pixels_per_unit: int) -> dict[str, Any]:
    """Map an Anthropic ``computer`` tool_use input to an IGG action."""
    raw = str(tool_input.get("action") or "").strip().lower()
    if raw == "left_click":
        x, y = _coord_pair(tool_input.get("coordinate"))
        return {"type": "click", "x": _clamp(x, 0, VIEWPORT_WIDTH), "y": _clamp(y, 0, VIEWPORT_HEIGHT)}
    if raw == "mouse_move":
        x, y = _coord_pair(tool_input.get("coordinate"))
        return {"type": "move", "x": _clamp(x, 0, VIEWPORT_WIDTH), "y": _clamp(y, 0, VIEWPORT_HEIGHT)}
    if raw == "left_click_drag":
        sx, sy = _coord_pair(tool_input.get("start_coordinate"))
        ex, ey = _coord_pair(tool_input.get("coordinate"))
        return {
            "type": "drag",
            "startX": _clamp(sx, 0, VIEWPORT_WIDTH),
            "startY": _clamp(sy, 0, VIEWPORT_HEIGHT),
            "endX": _clamp(ex, 0, VIEWPORT_WIDTH),
            "endY": _clamp(ey, 0, VIEWPORT_HEIGHT),
        }
    if raw == "wait":
        duration = tool_input.get("duration")
        try:
            secs = float(duration) if duration is not None else 1.0
        except (TypeError, ValueError):
            secs = 1.0
        return {"type": "wait", "ms": max(0, int(round(secs * 1000)))}
    if raw == "scroll":
        x, y = _coord_pair(tool_input.get("coordinate"))
        amount = int(tool_input.get("scroll_amount") or 0)
        direction = str(tool_input.get("scroll_direction") or "down").lower()
        if direction in ("left", "right"):
            raise ValueError(f"Horizontal scroll is not in the IGG action space: {tool_input!r}")
        sign = -1 if direction == "up" else 1
        dy = sign * amount * scroll_pixels_per_unit
        return {
            "type": "scroll",
            "x": _clamp(x, 0, VIEWPORT_WIDTH),
            "y": _clamp(y, 0, VIEWPORT_HEIGHT),
            "dy": dy,
        }
    raise ValueError(f"Unsupported computer-use action: {raw!r} (input={tool_input!r})")


class ClaudeCuAgent:
    """Computer-use mode: per-task conversation state with the ``computer`` tool."""

    name = "claude_cu_http_agent"

    def __init__(
        self,
        *,
        model_id: str,
        prompt_version: str,
        max_tokens: int,
        tool_version: str,
        scroll_pixels_per_unit: int,
        api_key: str | None,
    ) -> None:
        import anthropic

        self.client = anthropic.Anthropic(api_key=api_key) if api_key else anthropic.Anthropic()
        self.model_id = model_id
        self.prompt_version = prompt_version
        self.max_tokens = max_tokens
        self.tool_version = tool_version
        self.computer_use_beta = _computer_use_beta(tool_version)
        self.scroll_pixels_per_unit = scroll_pixels_per_unit
        self.system_prompt = CU_PROMPTS.get(prompt_version) or CU_PROMPTS["v1.0"]
        self.family = "claude-cu"
        # Per-task session state: {task_id: {"messages": [...], "pending_tool_use_id": str|None}}
        self._sessions: dict[str, dict[str, Any]] = {}
        self._lock = threading.Lock()
        print(
            f"[claude-cu] ready (model={model_id}, tool={tool_version}, prompt={prompt_version})",
            file=sys.stderr,
        )

    def _session(self, task_id: str) -> dict[str, Any]:
        with self._lock:
            session = self._sessions.get(task_id)
            if session is None:
                session = {"messages": [], "pending_tool_use_id": None}
                self._sessions[task_id] = session
            return session

    def reset(self, task_id: str) -> None:
        with self._lock:
            self._sessions.pop(task_id, None)

    def _tool_param(self) -> dict[str, Any]:
        return {
            "type": self.tool_version,
            "name": "computer",
            "display_width_px": VIEWPORT_WIDTH,
            "display_height_px": VIEWPORT_HEIGHT,
        }

    def act(self, observation: dict[str, Any]) -> dict[str, Any]:
        task = observation.get("task") or {}
        task_id = str(task.get("id") or "default")
        step_index = int(observation.get("stepIndex") or 0)
        instruction = str(observation.get("instruction") or "")
        image_bytes, mime = _read_screenshot(observation)

        if step_index == 0:
            self.reset(task_id)
        session = self._session(task_id)

        if not session["messages"]:
            user_text = (
                f"Instruction: {instruction}\n"
                f"Viewport: {VIEWPORT_WIDTH} x {VIEWPORT_HEIGHT}\n"
                f"Locate the described UI element and left_click it. The current screenshot is attached."
            )
            session["messages"].append(
                {
                    "role": "user",
                    "content": [
                        _b64_image_block(image_bytes, mime),
                        {"type": "text", "text": user_text},
                    ],
                }
            )
        else:
            pending_id = session.get("pending_tool_use_id")
            if not pending_id:
                raise RuntimeError(
                    "CU session has no pending tool_use to attach the new screenshot to. "
                    "Reset the task or check stepIndex sequencing."
                )
            session["messages"].append(
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "tool_result",
                            "tool_use_id": pending_id,
                            "content": [_b64_image_block(image_bytes, mime)],
                        }
                    ],
                }
            )

        response = self.client.beta.messages.create(
            model=self.model_id,
            max_tokens=self.max_tokens,
            system=self.system_prompt,
            tools=[self._tool_param()],
            messages=session["messages"],
            betas=[self.computer_use_beta],
        )

        # Persist the assistant turn so the next step can attach a tool_result.
        assistant_blocks = [block.model_dump(mode="json", exclude_none=True) for block in response.content]
        session["messages"].append({"role": "assistant", "content": assistant_blocks})

        tool_use = next(
            (block for block in response.content if getattr(block, "type", None) == "tool_use"),
            None,
        )
        if tool_use is None:
            text_blocks = [
                block.text for block in response.content if getattr(block, "type", None) == "text"
            ]
            session["pending_tool_use_id"] = None
            raise ValueError(
                f"Claude returned no tool_use; text-only response: {' '.join(text_blocks)[:500]!r}"
            )

        session["pending_tool_use_id"] = tool_use.id
        try:
            action = _map_cu_action(dict(tool_use.input), self.scroll_pixels_per_unit)
        except ValueError as e:
            # Surface malformed/unsupported actions to the runner without losing context.
            raise ValueError(f"{e}") from None

        return {
            "action": action,
            "rawText": json.dumps({"name": tool_use.name, "input": tool_use.input}),
        }


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def make_handler(agent: ClaudePlainAgent | ClaudeCuAgent) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        server_version = "IGGClaudeServer/1.0"

        def log_message(self, fmt: str, *args: Any) -> None:
            print(f"[http] {self.address_string()} {fmt % args}", file=sys.stderr)

        def do_GET(self) -> None:  # noqa: N802
            if self.path.rstrip("/") == "/health":
                _json_response(self, 200, {
                    "ok": True,
                    "modelId": agent.model_id,
                    "family": agent.family,
                    "promptVersion": agent.prompt_version,
                })
                return
            _json_response(self, 404, {"ok": False, "error": "not_found"})

        def do_POST(self) -> None:  # noqa: N802
            path = self.path.rstrip("/")
            try:
                length = int(self.headers.get("Content-Length") or "0")
                payload = json.loads(self.rfile.read(length).decode("utf-8") or "{}")
            except Exception as e:  # noqa: BLE001
                _json_response(self, 400, {"ok": False, "error": f"bad_request: {e}"})
                return

            if path == "/reset":
                task_id = str(((payload.get("task") or {}).get("id")) or payload.get("taskId") or "default")
                agent.reset(task_id)
                _json_response(self, 200, {"ok": True, "reset": task_id})
                return
            if path != "/act":
                _json_response(self, 404, {"ok": False, "error": "not_found"})
                return

            try:
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
    parser = argparse.ArgumentParser(description="Start a Claude IGG /act server.")
    parser.add_argument("--mode", choices=["plain", "cu"], required=True)
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=None,
                        help="Default 8013 for plain, 8014 for cu.")
    parser.add_argument("--model-id", default=DEFAULT_MODEL_ID)
    parser.add_argument("--prompt-version", default=PROMPT_VERSION)
    parser.add_argument("--max-tokens", type=int, default=DEFAULT_MAX_TOKENS)
    parser.add_argument("--tool-version", default=DEFAULT_TOOL_VERSION,
                        help="Anthropic computer-use tool type (cu mode only).")
    parser.add_argument("--scroll-pixels-per-unit", type=int, default=100,
                        help="dy multiplier for CU scroll_amount → IGG dy (default 100).")
    parser.add_argument("--api-key", default=None,
                        help="Override ANTHROPIC_API_KEY for this process.")
    args = parser.parse_args(argv)

    load_env_file()
    api_key = args.api_key or os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("[claude] ANTHROPIC_API_KEY is not set; refusing to start.", file=sys.stderr)
        return 2

    port = args.port or (8013 if args.mode == "plain" else 8014)

    if args.mode == "plain":
        agent: ClaudePlainAgent | ClaudeCuAgent = ClaudePlainAgent(
            model_id=args.model_id,
            prompt_version=args.prompt_version,
            max_tokens=args.max_tokens,
            api_key=api_key,
        )
    else:
        agent = ClaudeCuAgent(
            model_id=args.model_id,
            prompt_version=args.prompt_version,
            max_tokens=args.max_tokens,
            tool_version=args.tool_version,
            scroll_pixels_per_unit=args.scroll_pixels_per_unit,
            api_key=api_key,
        )

    server = ThreadingHTTPServer((args.host, port), make_handler(agent))
    print(f"[claude-{args.mode}] listening on http://{args.host}:{port}", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print(f"\n[claude-{args.mode}] shutting down", file=sys.stderr)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
