#!/usr/bin/env python
"""Start a GUI-Owl 1.5 /act server for the JS interaction runner.

Also serves other Qwen3-VL-based GUI grounding models (KV-Ground, Indeed-UI,
UI-Venus-1.5, MAI-UI, Holo2) via --model-id; they differ only in the
normalized coordinate range they emit (--coord-scale).
"""

from __future__ import annotations

import argparse
import inspect
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

if os.environ.get("PYTHONNOUSERSITE") != "1":
    sys.path[:] = [p for p in sys.path if "/.local/lib/" not in p]
for _mod in list(sys.modules):
    if _mod == "transformers" or _mod.startswith("transformers."):
        del sys.modules[_mod]

SERVER_DIR = Path(__file__).resolve().parent
INTERACTION_DIR = Path(__file__).resolve().parents[1]
REPO_ROOT = Path(__file__).resolve().parents[1]
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))
if str(INTERACTION_DIR) not in sys.path:
    sys.path.insert(0, str(INTERACTION_DIR))

from prompts.igg_prompt import (  # noqa: E402
    PROMPT_VERSION,
    VIEWPORT_HEIGHT,
    VIEWPORT_WIDTH,
    build_user_message,
    get_system_prompt,
    parse_action_response,
)
from qwen_vl_server_common import (  # noqa: E402
    materialize_screenshot,
    write_synthetic_screenshot,
)


DEFAULT_MODEL_ID = "mPLUG/GUI-Owl-1.5-8B-Instruct"
DEFAULT_MAX_NEW_TOKENS = 256
DEFAULT_MAX_PIXELS = 3_072_000
DEFAULT_MIN_PIXELS = 65_536


def _torch_dtype(name: str) -> Any:
    import torch

    return {
        "auto": "auto",
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
    }[name]


def _format_trace(trace: list[dict[str, Any]]) -> list[dict[str, Any]]:
    formatted: list[dict[str, Any]] = []
    for index, item in enumerate(trace):
        if isinstance(item, dict) and "action" in item:
            formatted.append(item)
        else:
            formatted.append({"step": index + 1, "action": item, "result": {}})
    return formatted


class GUIOwl15Agent:
    name = "gui_owl_1_5_http_agent"

    def __init__(
        self,
        model_id: str = DEFAULT_MODEL_ID,
        *,
        prompt_version: str = PROMPT_VERSION,
        max_new_tokens: int = DEFAULT_MAX_NEW_TOKENS,
        max_pixels: int = DEFAULT_MAX_PIXELS,
        min_pixels: int = DEFAULT_MIN_PIXELS,
        dtype: str = "bfloat16",
        device_map: str = "auto",
        attn_impl: str | None = None,
        trust_remote_code: bool = False,
        low_cpu_mem_usage: bool = True,
        do_sample: bool = False,
        temperature: float | None = None,
        coord_scale: float = 1000.0,
        family: str = "gui-owl15",
    ) -> None:
        import torch  # noqa: F401
        import transformers as _tf
        from transformers import AutoConfig, AutoProcessor

        model_type = AutoConfig.from_pretrained(
            model_id, trust_remote_code=trust_remote_code
        ).model_type
        try:
            if model_type != "qwen3_vl":
                # e.g. Holo3 (qwen3_5_moe): let the Auto class pick the architecture.
                raise ImportError(model_type)
            from transformers import Qwen3VLForConditionalGeneration

            model_cls = Qwen3VLForConditionalGeneration
        except ImportError:
            try:
                from transformers import AutoModelForImageTextToText

                model_cls = AutoModelForImageTextToText
            except ImportError as e:
                raise ImportError(
                    "GUI-Owl 1.5 is Qwen3-VL based. This env needs a recent "
                    "transformers build exposing Qwen3VLForConditionalGeneration "
                    "or AutoModelForImageTextToText. Current transformers: "
                    f"{_tf.__version__} at {_tf.__file__}"
                ) from e

        model_kwargs: dict[str, Any] = {
            "torch_dtype": _torch_dtype(dtype),
            "device_map": device_map,
            "trust_remote_code": trust_remote_code,
            "low_cpu_mem_usage": low_cpu_mem_usage,
        }
        if attn_impl:
            model_kwargs["attn_implementation"] = attn_impl

        print(f"[gui-owl15] loading model: {model_id}", file=sys.stderr)
        self.model = model_cls.from_pretrained(model_id, **model_kwargs)
        self.processor = AutoProcessor.from_pretrained(
            model_id,
            min_pixels=min_pixels,
            max_pixels=max_pixels,
            trust_remote_code=trust_remote_code,
        )
        self.model.eval()

        self.model_id = model_id
        self.prompt_version = prompt_version
        self.max_new_tokens = max_new_tokens
        self.max_pixels = max_pixels
        self.min_pixels = min_pixels
        self.system_prompt = get_system_prompt(prompt_version)
        self.do_sample = do_sample
        self.temperature = temperature
        self.coord_scale = coord_scale
        self.family = family
        print(f"[gui-owl15] ready (prompt={prompt_version})", file=sys.stderr)

    def _build_messages(
        self,
        *,
        screenshot_path: str,
        instruction: str,
        trace: list[dict[str, Any]],
        step_index: int,
    ) -> list[dict[str, Any]]:
        user_text = build_user_message(
            instruction=instruction,
            trace=_format_trace(trace),
            step_index=step_index,
            viewport=(VIEWPORT_WIDTH, VIEWPORT_HEIGHT),
        )
        return [
            {"role": "system", "content": [{"type": "text", "text": self.system_prompt}]},
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "image": screenshot_path,
                        "min_pixels": self.min_pixels,
                        "max_pixels": self.max_pixels,
                    },
                    {"type": "text", "text": user_text},
                ],
            },
        ]

    @staticmethod
    def _rescale(action: dict[str, Any], sx: float, sy: float) -> dict[str, Any]:
        rescaled = dict(action)
        for key in ("x", "startX", "endX"):
            if key in rescaled and rescaled[key] is not None:
                rescaled[key] = max(0, min(VIEWPORT_WIDTH, int(round(float(rescaled[key]) * sx))))
        for key in ("y", "startY", "endY"):
            if key in rescaled and rescaled[key] is not None:
                rescaled[key] = max(0, min(VIEWPORT_HEIGHT, int(round(float(rescaled[key]) * sy))))
        return rescaled

    def _apply_chat_template(self, messages: list[dict[str, Any]]) -> str:
        kwargs: dict[str, Any] = {
            "tokenize": False,
            "add_generation_prompt": True,
        }
        signature = inspect.signature(self.processor.apply_chat_template)
        accepts_kwargs = any(
            parameter.kind is inspect.Parameter.VAR_KEYWORD
            for parameter in signature.parameters.values()
        )
        if "enable_thinking" in signature.parameters or accepts_kwargs:
            kwargs["enable_thinking"] = False
        # Holo2's chat template checks `thinking` rather than `enable_thinking`.
        if "thinking" in signature.parameters or accepts_kwargs:
            kwargs["thinking"] = False
        return self.processor.apply_chat_template(messages, **kwargs)

    def _run_inference(self, messages: list[dict[str, Any]]) -> str:
        import torch
        from qwen_vl_utils import process_vision_info

        text = self._apply_chat_template(messages)
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = self.processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to(self.model.device)

        generate_kwargs: dict[str, Any] = {
            "max_new_tokens": self.max_new_tokens,
            "do_sample": self.do_sample,
        }
        if self.temperature is not None:
            generate_kwargs["temperature"] = self.temperature

        with torch.no_grad():
            generated = self.model.generate(**inputs, **generate_kwargs)
        input_len = inputs.input_ids.shape[1]
        trimmed = generated[:, input_len:]
        output_text = self.processor.batch_decode(
            trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0]
        return output_text

    def act(self, observation: dict[str, Any]) -> dict[str, Any]:
        screenshot_path, cleanup_path = materialize_screenshot(observation)
        try:
            messages = self._build_messages(
                screenshot_path=screenshot_path,
                instruction=str(observation.get("instruction") or ""),
                trace=observation.get("trace") or [],
                step_index=int(observation.get("stepIndex") or 0),
            )
            raw_text = self._run_inference(messages)
        finally:
            if cleanup_path:
                try:
                    Path(cleanup_path).unlink(missing_ok=True)
                except OSError:
                    pass

        action = parse_action_response(raw_text)
        if action is None:
            raise ValueError(f"Failed to parse action from response: {raw_text!r}")

        # GUI-Owl 1.5 is Qwen3-VL based and emits coordinates in a 0..1000
        # normalized space, independent of the resized image dimensions.
        # MAI-UI uses 0..999 instead (--coord-scale 999).
        sx = VIEWPORT_WIDTH / self.coord_scale
        sy = VIEWPORT_HEIGHT / self.coord_scale
        action = self._rescale(action, sx, sy)
        return {"action": action, "rawText": raw_text}


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def make_handler(agent: GUIOwl15Agent) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        server_version = "IGGGUIOwl15Server/1.0"

        def log_message(self, fmt: str, *args: Any) -> None:
            print(f"[http] {self.address_string()} {fmt % args}", file=sys.stderr)

        def do_GET(self) -> None:  # noqa: N802
            if self.path.rstrip("/") == "/health":
                _json_response(self, 200, {
                    "ok": True,
                    "modelId": agent.model_id,
                    "family": agent.family,
                    "coordScale": agent.coord_scale,
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
                print(f"[gui-owl15] /act failed: {type(e).__name__}: {e}", file=sys.stderr)
                _json_response(self, 500, {
                    "ok": False,
                    "error": f"{type(e).__name__}: {e}",
                })

    return Handler


def build_argparser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8012)
    parser.add_argument("--model-id", default=DEFAULT_MODEL_ID)
    parser.add_argument("--prompt-version", default=PROMPT_VERSION)
    parser.add_argument("--max-new-tokens", type=int, default=DEFAULT_MAX_NEW_TOKENS)
    parser.add_argument("--max-pixels", type=int, default=DEFAULT_MAX_PIXELS)
    parser.add_argument("--min-pixels", type=int, default=DEFAULT_MIN_PIXELS)
    parser.add_argument("--dtype", choices=["auto", "bfloat16", "float16", "float32"], default="bfloat16")
    parser.add_argument("--device-map", default="auto")
    parser.add_argument("--attn-impl", default=None)
    parser.add_argument("--trust-remote-code", action="store_true")
    parser.add_argument("--no-low-cpu-mem-usage", action="store_true")
    parser.add_argument("--do-sample", action="store_true")
    parser.add_argument("--temperature", type=float, default=None)
    parser.add_argument("--coord-scale", type=float, default=1000.0,
                        help="Upper bound of the model's normalized coordinate range (1000 for Qwen3-VL/GUI-Owl, 999 for MAI-UI).")
    parser.add_argument("--family", default="gui-owl15", help="Label reported by /health.")
    parser.add_argument("--smoke-test", action="store_true")
    parser.add_argument("--smoke-screenshot", default=None)
    parser.add_argument("--smoke-instruction", default="Find the 'Music' button.")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_argparser().parse_args(argv)
    agent = GUIOwl15Agent(
        model_id=args.model_id,
        prompt_version=args.prompt_version,
        max_new_tokens=args.max_new_tokens,
        max_pixels=args.max_pixels,
        min_pixels=args.min_pixels,
        dtype=args.dtype,
        device_map=args.device_map,
        attn_impl=args.attn_impl,
        trust_remote_code=args.trust_remote_code,
        low_cpu_mem_usage=not args.no_low_cpu_mem_usage,
        do_sample=args.do_sample,
        temperature=args.temperature,
        coord_scale=args.coord_scale,
        family=args.family,
    )

    if args.smoke_test:
        screenshot = Path(args.smoke_screenshot or (REPO_ROOT / ".tmp-smoke/gui-owl15.png"))
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
    print(f"[gui-owl15] listening on http://{args.host}:{args.port}", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[gui-owl15] shutting down", file=sys.stderr)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
