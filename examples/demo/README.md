# Covian Demo App

A full-featured demonstration of the [Covian](../../README.md) XSS-prevention framework, showcasing every public API:

| Feature | API |
|---|---|
| Wasm encoding engine | `initSecureEngine` |
| HTML text encoding | `engine.encodeText()` |
| HTML attribute encoding | `engine.encodeAttr()` |
| URL encoding / blocking | `engine.encodeURL()` |
| UTF-8 validation | `engine.validateUTF8()` |
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

This generates `js/secure_engine.generated.js` and `js/secure_engine.wasm`.

## Running the demo

Serve the repository root with any static server (import maps and ES modules require HTTP — `file://` will not work):

```bash
# from the repository root
npx serve .
```

Then open **http://localhost:3000/examples/demo/**.

> The CSP in `index.html` enforces `require-trusted-types-for 'script'`, so
> the demo must be opened over HTTP/HTTPS.
