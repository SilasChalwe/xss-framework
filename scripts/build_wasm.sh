#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUT_DIR="$ROOT_DIR/js"

if ! command -v emcc >/dev/null 2>&1; then
  echo "ERROR: emcc is not installed or not in PATH." >&2
  echo "Run with Docker instead: ./scripts/build_wasm_docker.sh" >&2
  exit 127
fi

mkdir -p "$OUT_DIR"

emcc "$ROOT_DIR/cpp/secure_core.cpp" \
  -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT='web,worker' \
  -s EXPORTED_FUNCTIONS='["_encodeText","_encodeAttr","_encodeURL","_validateUTF8","_encode_text","_encode_attr","_encode_url","_validate_utf8","_normalize_input","_detect_control_chars"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString"]' \
  -o "$OUT_DIR/secure_engine.generated.js"

echo "Built: $OUT_DIR/secure_engine.generated.js and $OUT_DIR/secure_engine.wasm"
