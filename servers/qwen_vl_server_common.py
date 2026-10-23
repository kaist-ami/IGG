#!/usr/bin/env python
"""HTTP inference server helpers for Qwen-VL IGG agents.

The browser proposal loop lives in ``lib/interaction-runner.mjs``. This module
only loads a Qwen visual-language model and answers ``POST /act`` with one
normalized action JSON object.
"""

from __future__ import annotations

import argparse
import base64
import inspect
import json
import os
import sys
import tempfile
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

REPO_ROOT = Path(__file__).resolve().parents[1]
INTERACTION_DIR = Path(__file__).resolve().parents[1]
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


DEFAULT_MAX_NEW_TOKENS = 256
DEFAULT_MAX_PIXELS = 1600 * 1120
DEFAULT_MIN_PIXELS = 256 * 28 * 28


def scrub_user_site_packages() -> None:
    """Best-effort guard for gpu09 envs with stale user-site transformers."""
    if os.environ.get("PYTHONNOUSERSITE") == "1":
        return
    sys.path[:] = [p for p in sys.path if "/.local/lib/" not in p]
    for mod in list(sys.modules):
        if mod == "transformers" or mod.startswith("transformers."):
            del sys.modules[mod]


def _torch_dtype(name: str) -> Any:
    import torch

    return {
        "bfloat16": torch.bfloat16,
        "float16": torch.float16,
        "float32": torch.float32,
        "auto": "auto",
    }[name]


def _format_trace(trace: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """The JS runner sends action-only trace items; prompt code accepts steps."""
    formatted: list[dict[str, Any]] = []
    for index, item in enumerate(trace):
        if isinstance(item, dict) and "action" in item:
            formatted.append(item)
        else:
            formatted.append({"step": index + 1, "action": item, "result": {}})
    return formatted


class QwenVLAgent:
    name = "qwen_vl_http_agent"

    def __init__(
        self,
        *,
        family: str,
        model_id: str,
        prompt_version: str = PROMPT_VERSION,
        max_new_tokens: int = DEFAULT_MAX_NEW_TOKENS,
        max_pixels: int = DEFAULT_MAX_PIXELS,
        min_pixels: int = DEFAULT_MIN_PIXELS,
        dtype: str = "bfloat16",
        device_map: str = "auto",
        attn_impl: str | None = None,
        adapter_path: str | None = None,
        coordinate_space: str = "auto",
    ) -> None:
        import torch  # noqa: F401
        from transformers import AutoProcessor

        if family == "qwen25vl":
            from transformers import Qwen2_5_VLForConditionalGeneration

            model_cls = Qwen2_5_VLForConditionalGeneration
        elif family == "qwen3vl":
            try:
                from transformers import Qwen3VLForConditionalGeneration
            except ImportError as e:
                import transformers as _tf

                raise ImportError(
                    "Could not import Qwen3VLForConditionalGeneration from "
                    f"transformers=={_tf.__version__} at {_tf.__file__}. "
                    "Run with PYTHONNOUSERSITE=1 and transformers>=4.57."
                ) from e
            model_cls = Qwen3VLForConditionalGeneration
        else:
            raise ValueError(f"Unknown Qwen family: {family}")

        model_kwargs: dict[str, Any] = {
            "torch_dtype": _torch_dtype(dtype),
            "device_map": device_map,
        }
        if attn_impl:
            model_kwargs["attn_implementation"] = attn_impl

        print(f"[{family}] loading model: {model_id}", file=sys.stderr)
        self.model = model_cls.from_pretrained(model_id, **model_kwargs)
        self.adapter_path = str(adapter_path) if adapter_path else None
        if self.adapter_path:
            try:
                from peft import PeftModel
            except ImportError as e:
                raise ImportError(
                    "Loading a LoRA/PEFT adapter requires peft. Install peft in "
                    "the same environment as transformers."
                ) from e
            print(f"[{family}] loading adapter: {self.adapter_path}", file=sys.stderr)
            self.model = PeftModel.from_pretrained(self.model, self.adapter_path)
        self.processor = AutoProcessor.from_pretrained(
            model_id,
            min_pixels=min_pixels,
            max_pixels=max_pixels,
        )
        self.model.eval()

        self.family = family
        self.model_id = model_id
        self.prompt_version = prompt_version
        self.max_new_tokens = max_new_tokens
        self.max_pixels = max_pixels
        self.min_pixels = min_pixels
        self.system_prompt = get_system_prompt(prompt_version)
        self.coordinate_space = self._resolve_coordinate_space(coordinate_space)
        print(
            f"[{family}] ready (prompt={prompt_version}, coordinate_space={self.coordinate_space})",
            file=sys.stderr,
        )

    def _resolve_coordinate_space(self, coordinate_space: str) -> str:
        if coordinate_space != "auto":
            return coordinate_space
        if self.family == "qwen3vl":
            return "normalized1000"
        return "resized"

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
            coordinate_space="normalized1000"
            if "norm1000" in self.prompt_version
            else "viewport",
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

    def _run_inference(self, messages: list[dict[str, Any]]) -> tuple[str, tuple[int, int] | None]:
        import torch
        from qwen_vl_utils import process_vision_info

        template_kwargs: dict[str, Any] = {
            "tokenize": False,
            "add_generation_prompt": True,
        }
        signature = inspect.signature(self.processor.apply_chat_template)
        accepts_kwargs = any(
            parameter.kind is inspect.Parameter.VAR_KEYWORD
            for parameter in signature.parameters.values()
        )
        if self.family == "qwen3vl" and ("enable_thinking" in signature.parameters or accepts_kwargs):
            template_kwargs["enable_thinking"] = False
        text = self.processor.apply_chat_template(messages, **template_kwargs)
        image_inputs, video_inputs = process_vision_info(messages)
        inputs = self.processor(
            text=[text],
            images=image_inputs,
            videos=video_inputs,
            padding=True,
            return_tensors="pt",
        ).to(self.model.device)

        resized_hw: tuple[int, int] | None = None
        grid_thw = getattr(inputs, "image_grid_thw", None)
        if grid_thw is not None and grid_thw.numel() >= 3:
            patch_size = getattr(self.processor.image_processor, "patch_size", 14)
            resized_hw = (
                int(grid_thw[0, 1]) * patch_size,
                int(grid_thw[0, 2]) * patch_size,
            )

        with torch.no_grad():
            generated = self.model.generate(
                **inputs,
                max_new_tokens=self.max_new_tokens,
                do_sample=False,
            )
        input_len = inputs.input_ids.shape[1]
        trimmed = generated[:, input_len:]
        output_text = self.processor.batch_decode(
            trimmed,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=False,
        )[0]
        return output_text, resized_hw

    def act(self, observation: dict[str, Any]) -> dict[str, Any]:
        screenshot_path, cleanup_path = materialize_screenshot(observation)
        try:
            messages = self._build_messages(
                screenshot_path=screenshot_path,
                instruction=str(observation.get("instruction") or ""),
                trace=observation.get("trace") or [],
                step_index=int(observation.get("stepIndex") or 0),
            )
            raw_text, resized_hw = self._run_inference(messages)
        finally:
            if cleanup_path:
                try:
                    Path(cleanup_path).unlink(missing_ok=True)
                except OSError:
                    pass

        action = parse_action_response(raw_text)
        if action is None:
            raise ValueError(f"Failed to parse action from response: {raw_text!r}")

        if self.coordinate_space == "viewport":
            return {"action": action, "rawText": raw_text}
        if self.coordinate_space == "normalized1000":
            # Base Qwen3-VL tends to emit coordinates in a 0..1000 normalized
            # space, independent of the resized image dimensions.
            sx = VIEWPORT_WIDTH / 1000.0
            sy = VIEWPORT_HEIGHT / 1000.0
            action = self._rescale(action, sx, sy)
        elif self.coordinate_space == "resized" and resized_hw is not None:
            # Qwen2.5-VL emits coordinates in resized-image pixel space.
            resized_h, resized_w = resized_hw
            sx = VIEWPORT_WIDTH / resized_w if resized_w else 1.0
            sy = VIEWPORT_HEIGHT / resized_h if resized_h else 1.0
            action = self._rescale(action, sx, sy)
        return {"action": action, "rawText": raw_text}


def materialize_screenshot(observation: dict[str, Any]) -> tuple[str, str | None]:
    b64 = observation.get("screenshotBase64")
    if isinstance(b64, str) and b64:
        suffix = ".png"
        mime = str(observation.get("screenshotMimeType") or "")
        if "jpeg" in mime or "jpg" in mime:
            suffix = ".jpg"
        fd, path = tempfile.mkstemp(prefix="igg-agent-shot-", suffix=suffix)
        with os.fdopen(fd, "wb") as f:
            f.write(base64.b64decode(b64))
        return path, path

    path = observation.get("screenshotPath")
    if isinstance(path, str) and Path(path).exists():
        return path, None
    raise ValueError("Request must include screenshotBase64 or a readable screenshotPath")


def _json_response(handler: BaseHTTPRequestHandler, status: int, payload: dict[str, Any]) -> None:
    body = json.dumps(payload).encode("utf-8")
    handler.send_response(status)
    handler.send_header("Content-Type", "application/json")
    handler.send_header("Content-Length", str(len(body)))
    handler.end_headers()
    handler.wfile.write(body)


def make_handler(agent: QwenVLAgent) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        server_version = "IGGQwenVLServer/1.0"

        def log_message(self, fmt: str, *args: Any) -> None:
            print(f"[http] {self.address_string()} {fmt % args}", file=sys.stderr)

        def do_GET(self) -> None:  # noqa: N802
            if self.path.rstrip("/") == "/health":
                _json_response(self, 200, {
                    "ok": True,
                    "modelId": agent.model_id,
                    "family": agent.family,
                    "promptVersion": agent.prompt_version,
                    "adapterPath": agent.adapter_path,
                    "coordinateSpace": agent.coordinate_space,
                })
                return
            _json_response(self, 404, {"ok": False, "error": "not_found"})

        def do_POST(self) -> None:  # noqa: N802
            path = self.path.rstrip("/")
            if path == "/act":
                self._handle_act()
            elif path == "/probe":
                self._handle_probe()
            else:
                _json_response(self, 404, {"ok": False, "error": "not_found"})

        def _handle_act(self) -> None:
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
                print(f"[{agent.family}] /act failed: {type(e).__name__}: {e}", file=sys.stderr)
                _json_response(self, 500, {
                    "ok": False,
                    "error": f"{type(e).__name__}: {e}",
                })

        def _handle_probe(self) -> None:
            """Free-form visual perception probe — returns raw model text, no action parsing."""
            try:
                length = int(self.headers.get("Content-Length") or "0")
                payload = json.loads(self.rfile.read(length).decode("utf-8"))
                question = str(payload.get("question") or "")
                if not question:
                    _json_response(self, 400, {"ok": False, "error": "missing 'question' field"})
                    return
                screenshot_path, cleanup_path = materialize_screenshot(payload)
                system_prompt = payload.get("systemPrompt") or "You are a visual perception assistant."
                try:
                    messages = [
                        {"role": "system", "content": [{"type": "text", "text": system_prompt}]},
                        {
                            "role": "user",
                            "content": [
                                {
                                    "type": "image",
                                    "image": screenshot_path,
                                    "min_pixels": agent.min_pixels,
                                    "max_pixels": agent.max_pixels,
                                },
                                {"type": "text", "text": question},
                            ],
                        },
                    ]
                    started = time.time()
                    raw_text, _ = agent._run_inference(messages)
                finally:
                    if cleanup_path:
                        try:
                            Path(cleanup_path).unlink(missing_ok=True)
                        except OSError:
                            pass
                _json_response(self, 200, {
                    "ok": True,
                    "response": raw_text,
                    "elapsedMs": int(round((time.time() - started) * 1000)),
                    "modelId": agent.model_id,
                })
            except Exception as e:  # noqa: BLE001
                print(f"[{agent.family}] /probe failed: {type(e).__name__}: {e}", file=sys.stderr)
                _json_response(self, 500, {
                    "ok": False,
                    "error": f"{type(e).__name__}: {e}",
                })

    return Handler


def write_synthetic_screenshot(path: Path) -> None:
    from PIL import Image, ImageDraw

    img = Image.new("RGB", (VIEWPORT_WIDTH, VIEWPORT_HEIGHT), (240, 240, 240))
    draw = ImageDraw.Draw(img)
    draw.rectangle([(0, 0), (VIEWPORT_WIDTH, 80)], fill=(20, 20, 20))
    draw.text((24, 24), "Synthetic UI (smoke-test)", fill=(255, 255, 255))
    draw.rectangle([(80, 160), (260, 220)], fill=(50, 90, 200))
    draw.text((110, 178), "Music", fill=(255, 255, 255))
    draw.rectangle([(300, 160), (520, 220)], fill=(80, 80, 80))
    draw.text((330, 178), "Recently uploaded", fill=(255, 255, 255))
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path)


def add_common_args(parser: argparse.ArgumentParser, *, default_model_id: str, default_port: int) -> None:
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=default_port)
    parser.add_argument("--model-id", default=default_model_id)
    parser.add_argument("--prompt-version", default=PROMPT_VERSION)
    parser.add_argument("--max-new-tokens", type=int, default=DEFAULT_MAX_NEW_TOKENS)
    parser.add_argument("--max-pixels", type=int, default=DEFAULT_MAX_PIXELS)
    parser.add_argument("--min-pixels", type=int, default=DEFAULT_MIN_PIXELS)
    parser.add_argument("--dtype", choices=["bfloat16", "float16", "float32", "auto"], default="bfloat16")
    parser.add_argument("--device-map", default="auto")
    parser.add_argument("--attn-impl", default=None)
    parser.add_argument("--adapter", "--adapter-path", dest="adapter_path", default=None)
    parser.add_argument(
        "--coordinate-space",
        choices=["auto", "viewport", "normalized1000", "resized"],
        default="auto",
        help=(
            "Coordinate space emitted by the model before postprocessing. "
            "Use viewport for SFT adapters trained to emit 1440x900 pixel coordinates."
        ),
    )
    parser.add_argument("--smoke-test", action="store_true")
    parser.add_argument("--smoke-screenshot", default=None)
    parser.add_argument("--smoke-instruction", default="Find the 'Music' button.")


def run_cli(family: str, default_model_id: str, default_port: int, argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=f"Start a {family} IGG /act server.")
    add_common_args(parser, default_model_id=default_model_id, default_port=default_port)
    args = parser.parse_args(argv)

    agent = QwenVLAgent(
        family=family,
        model_id=args.model_id,
        prompt_version=args.prompt_version,
        max_new_tokens=args.max_new_tokens,
        max_pixels=args.max_pixels,
        min_pixels=args.min_pixels,
        dtype=args.dtype,
        device_map=args.device_map,
        attn_impl=args.attn_impl,
        adapter_path=args.adapter_path,
        coordinate_space=args.coordinate_space,
    )

    if args.smoke_test:
        screenshot = Path(args.smoke_screenshot or (REPO_ROOT / ".tmp-smoke" / f"{family}.png"))
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
            "adapter_path": args.adapter_path,
            "coordinate_space": agent.coordinate_space,
        }, indent=2))
        return 0

    server = ThreadingHTTPServer((args.host, args.port), make_handler(agent))
    print(f"[{family}] listening on http://{args.host}:{args.port}", file=sys.stderr)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print(f"\n[{family}] shutting down", file=sys.stderr)
    finally:
        server.server_close()
    return 0
