#!/usr/bin/env python
"""Start a Qwen3-VL /act server for the JS interaction runner."""

from __future__ import annotations

from qwen_vl_server_common import run_cli, scrub_user_site_packages


DEFAULT_MODEL_ID = "Qwen/Qwen3-VL-8B-Instruct"


if __name__ == "__main__":
    scrub_user_site_packages()
    raise SystemExit(run_cli("qwen3vl", DEFAULT_MODEL_ID, 8011))
