# Covian XSS Framework

Covian is a **C++ + WebAssembly security framework** that provides one-line XSS-safe rendering with an OpenMP-style directive experience.

```js
const secure = await createSecureDirective();
const html = secure`<div>Results for: ${userInput}</div>`;
```

## Core Idea
Instead of implementing sanitization in mutable JavaScript logic, Covian compiles a deterministic C++ sanitizer to WebAssembly and executes sanitization in isolated Wasm memory.

## Repository Structure
```text
cpp/
  secure_core.cpp          # C++ sanitization engine exported to Wasm

js/
  secure-directive.js      # `secure` directive factory
  index.js                 # package entry points

scripts/
  build_wasm.sh            # local emcc build
  build_wasm_docker.sh     # dockerized emcc build (no local emcc needed)
  test_native.sh           # native C++ test

docs/
  ARCHITECTURE.md          # architecture and standards mapping

examples/browser/
  index.html
  main.js
```

## Build Wasm
### Option A: Local emcc
Prerequisite: Emscripten SDK with `emcc` in PATH.

```bash
./scripts/build_wasm.sh
```

### Option B: Docker (fastest if you don't want local setup)
Prerequisite: Docker.

```bash
./scripts/build_wasm_docker.sh
```

Both commands generate:
- `js/secure_engine.js`
- `js/secure_engine.wasm`

## Run native C++ test
```bash
./scripts/test_native.sh
```

## Runtime Usage
```js
import { createSecureDirective } from './js/secure-directive.js';

const secure = await createSecureDirective();
const userInput = getUntrustedInput();

const view = secure`<div>Results for: ${userInput}</div>`;
document.body.innerHTML = view;
```

## Exported C++ Functions
- `secure_transform(const char*) -> const char*`
- `secure_transform_alloc(const char*) -> char*`
- `secure_free(char*)`

## Security Notes
- Current core is for **HTML text-context escaping**.
- For full application security, pair with CSP + Trusted Types and context-specific rendering controls.
- Do not render untrusted data into script/style/URL contexts without dedicated handling.

## License
MIT.
