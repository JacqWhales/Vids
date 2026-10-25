#!/usr/bin/env bash
# Downloads the Piper TTS voices the cast uses into voices/.
set -euo pipefail
mkdir -p "$(dirname "$0")/../voices"
cd "$(dirname "$0")/../voices"
base=https://huggingface.co/rhasspy/piper-voices/resolve/main
for v in en/en_US/ryan/high/en_US-ryan-high \
         en/en_US/joe/medium/en_US-joe-medium \
         en/en_GB/alan/medium/en_GB-alan-medium \
         en/en_US/lessac/medium/en_US-lessac-medium \
         en/en_US/kusal/medium/en_US-kusal-medium \
         en/en_GB/northern_english_male/medium/en_GB-northern_english_male-medium; do
  n=$(basename "$v")
  [ -f "$n.onnx" ] || curl -fsSL -o "$n.onnx" "$base/$v.onnx"
  [ -f "$n.onnx.json" ] || curl -fsSL -o "$n.onnx.json" "$base/$v.onnx.json"
done
