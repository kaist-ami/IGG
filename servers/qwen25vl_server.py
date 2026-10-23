#!/usr/bin/env python
"""Start a Qwen2.5-VL /act server for the JS interaction runner."""

from __future__ import annotations

from qwen_vl_server_common import run_cli


DEFAULT_MODEL_ID = "Qwen/Qwen2.5-VL-7B-Instruct"


if __name__ == "__main__":
    raise SystemExit(run_cli("qwen25vl", DEFAULT_MODEL_ID, 8010))
