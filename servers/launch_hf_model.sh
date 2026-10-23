#!/usr/bin/env bash
# Start an /act server for one of the HF models evaluated in the paper.
# Usage: CUDA_VISIBLE_DEVICES=0 bash servers/launch_hf_model.sh <name> [port]
# Settings below are the ones used for the reported results (greedy decoding,
# prompt v1.0). Indeed-UI-8B is distributed on ModelScope; pass a local path
# via INDEED_UI_PATH after downloading it.
set -euo pipefail
cd "$(dirname "$0")"

name=${1:?usage: launch_hf_model.sh <name> [port]}
case "$name" in
  qwen25vl)       exec python qwen25vl_server.py --host 0.0.0.0 --port "${2:-8010}" ;;
  qwen3vl)        exec python qwen3vl_server.py  --host 0.0.0.0 --port "${2:-8011}" ;;
  gui-owl15-8b)   model=mPLUG/GUI-Owl-1.5-8B-Instruct;          scale=1000; tokens=256  ;;
  gui-owl15-32b)  model=mPLUG/GUI-Owl-1.5-32B-Instruct;         scale=1000; tokens=256  ;;
  kv-ground-8b)   model=vocaela/KV-Ground-8B-BaseGuiOwl1.5-0315; scale=1000; tokens=256 ;;
  indeed-ui-8b)   model=${INDEED_UI_PATH:?set INDEED_UI_PATH to the downloaded IntellgenceIndeed/Indeed-UI-8B}; scale=1000; tokens=256 ;;
  ui-venus15-8b)  model=inclusionAI/UI-Venus-1.5-8B;            scale=1000; tokens=256  ;;
  mai-ui-8b)      model=Tongyi-MAI/MAI-UI-8B;                   scale=999;  tokens=256  ;;
  holo2-8b)       model=Hcompany/Holo2-8B;                      scale=1000; tokens=256  ;;
  holo3-35b)      model=Hcompany/Holo3-35B-A3B;                 scale=1000; tokens=256  ;;
  evocua-8b)      model=meituan/EvoCUA-8B-20260105;             scale=999;  tokens=1024 ;;
  evocua-32b)     model=meituan/EvoCUA-32B-20260105;            scale=999;  tokens=1024 ;;
  *) echo "unknown model: $name" >&2; exit 2 ;;
esac

PYTHONNOUSERSITE=1 exec python gui_owl15_server.py --host 0.0.0.0 --port "${2:-8012}" \
  --model-id "$model" --coord-scale "$scale" --max-new-tokens "$tokens" --family "$name"
