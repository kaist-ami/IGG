#!/usr/bin/env bash
# Serve OpenCUA-72B with vLLM (tensor parallel over 4 GPUs) and start the /act adapter.
# Usage: CUDA_VISIBLE_DEVICES=0,1,2,3 bash servers/launch_opencua.sh [port]
set -euo pipefail
cd "$(dirname "$0")"

vllm serve xlangai/OpenCUA-72B --trust-remote-code --served-model-name opencua-72b \
  --tensor-parallel-size 4 --host 127.0.0.1 --port 18100 --max-model-len 16384 \
  --gpu-memory-utilization 0.90 --limit-mm-per-prompt '{"image":1}' --max-num-seqs 8 &
vllm_pid=$!
trap 'kill $vllm_pid' EXIT

until curl -sf http://127.0.0.1:18100/v1/models >/dev/null; do sleep 10; done
python opencua_vllm_server.py --host 0.0.0.0 --port "${1:-18029}" --vllm-url http://127.0.0.1:18100/v1
