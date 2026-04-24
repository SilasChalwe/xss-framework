# Covian Demo App

A full-featured demonstration of the [Covian](../../README.md) XSS-prevention framework, showcasing every public API:

| Feature | API |
|---|---|
| Wasm encoding engine | `createDomApi()` (internally initializes engine) |
| HTML text encoding | `dom.encodeText()` |
| HTML attribute encoding | `dom.encodeAttr()` |
| URL encoding / blocking | `dom.encodeURL()` |
| UTF-8 validation | `dom.validateUTF8()` |
| Safe DOM builder | `createDomApi()` → `createElement`, `createText`, `setAttr`, `mount` |
| Unsafe sink hardening | `hardenDomSinks()` |
| Trusted Types policy | `requireTrustedTypes()` |

## Prerequisites

Build the WebAssembly engine from the repository root first:

```bash
# requires Docker
./scripts/build_wasm_docker.sh
# or, if emcc is installed locally:
./scripts/build_wasm.sh
```

This generates `js/secure_engine.generated.js` and `js/secure_engine.generated.wasm`.

## Running the demo

Serve the repository root with any static server (`file://` is not supported for this demo):

```bash
# from the repository root (Node/npm)
npx serve .

# alternatively (Python)
python3 -m http.server 4173
```

Then open:
- **http://localhost:3000/examples/demo/** (with `npx serve`)
- **http://localhost:4173/examples/demo/** (with Python server)

Why you should run a server:
- the demo uses ES module scripts (`type="module"`)
- WebAssembly is loaded as a separate asset
- CSP + Trusted Types checks are designed for normal HTTP/HTTPS origins

> The CSP in `index.html` enforces Trusted Types and allows Emscripten Wasm
> compilation via `script-src 'unsafe-eval' 'wasm-unsafe-eval'`, so the demo
> must be opened over HTTP/HTTPS.
