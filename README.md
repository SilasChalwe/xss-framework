# Covian XSS Framework

Covian is a **C++ + WebAssembly XSS framework** with an OpenMP-style developer experience using a pragma-based source directive.

## The `#pragma` workflow (what you requested)
Write normal JavaScript, add this one line before the template assignment:

```js
#pragma covian secure
const view = `<div>Results for: ${userInput}</div>`;
```

Then compile with Covian's pragma compiler. It rewrites the line to:

```js
const view = secure`<div>Results for: ${userInput}</div>`;
```

Every interpolation is routed through the Wasm C++ sanitizer.

## Architecture
- **Core (C++):** `cpp/secure_core.cpp`
- **Binary runtime (Wasm bridge):** `js/secure-directive.js`
- **Pragma compiler:** `tools/pragma_compiler.js`

## Build Wasm
```bash
./scripts/build_wasm.sh
```

If local `emcc` is unavailable:
```bash
./scripts/build_wasm_docker.sh
```

## Compile pragma source
```bash
node tools/pragma_compiler.js examples/pragma/source.js examples/pragma/compiled.js
```

## Run native C++ test
```bash
./scripts/test_native.sh
```

## Security scope
Current core performs deterministic HTML text-context escaping (`<`, `>`, `&`, `"`, `'`) in C++ and exposes it through Wasm.
