#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if ! command -v docker >/dev/null 2>&1; then
  echo "ERROR: docker is required for this script." >&2
  exit 127
fi

mkdir -p "$ROOT_DIR/js"

docker run --rm \
  -v "$ROOT_DIR:/src" \
  -w /src \
  emscripten/emsdk:4.0.12 \
  emcc /src/cpp/secure_core.cpp \
  -O3 \
  -s WASM=1 \
  -s MODULARIZE=1 \
  -s EXPORT_ES6=1 \
  -s ENVIRONMENT='web,worker' \
  -s EXPORTED_FUNCTIONS='["_encodeText","_encodeAttr","_encodeURL","_validateUTF8","_encode_text","_encode_attr","_encode_url","_validate_utf8","_normalize_input","_detect_control_chars"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString"]' \
  -o /src/js/secure_engine.generated.js

echo "Built with Docker: js/secure_engine.generated.js and js/secure_engine.generated.wasm"
