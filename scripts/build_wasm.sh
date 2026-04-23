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
  -s EXPORTED_FUNCTIONS='["_secure_transform","_secure_transform_alloc","_secure_free","_malloc","_free"]' \
  -s EXPORTED_RUNTIME_METHODS='["ccall","cwrap","UTF8ToString"]' \
  -o "$OUT_DIR/secure_engine.js"

echo "Built: $OUT_DIR/secure_engine.js and $OUT_DIR/secure_engine.wasm"
