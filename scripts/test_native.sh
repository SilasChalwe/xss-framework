#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="$ROOT_DIR/.build"

mkdir -p "$BUILD_DIR"
g++ -std=c++17 -O2 "$ROOT_DIR/cpp/secure_core.cpp" "$ROOT_DIR/cpp/test_secure_core.cpp" -o "$BUILD_DIR/secure_core_test"
"$BUILD_DIR/secure_core_test"
