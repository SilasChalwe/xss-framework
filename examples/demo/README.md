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

## What you should see

When healthy, the page should:
- replace **"Loading WebAssembly engine…"** with the full demo panels
- fill `encodeText`, `encodeAttr`, `encodeURL`, and `validateUTF8` outputs
- populate sink-hardening and URL verdict sections

## How to actually use the API from the demo

1. Type anything in the input field (for example: `<img src=x onerror=alert(1)>`).
2. Watch live API outputs:
   - `encodeText` (HTML text context)
   - `encodeAttr` (attribute context)
   - `encodeURL` (URL allowlist + encoding)
   - `validateUTF8`
3. Use **Run API method** to execute any selected API against your current input and inspect JSON output.
4. Scroll to **Safe DOM API** to see a rendered widget built using typed DOM primitives.
5. In **Unsafe DOM sink hardening**, choose a sink + payload and run your own test.
6. In **URL encoding**, enter any URL and test it; each run appends a row so you can compare outcomes.

If your browser does not support Trusted Types, the demo now enters compatibility mode:
- encoding APIs still work
- Safe DOM / sink-hardening sections explain that those features are unavailable

If loading never completes, open DevTools → Network and confirm
`/js/secure_engine.generated.wasm` returns **HTTP 200**.

In Network, you should usually see requests like:
- `/examples/demo/main.js`
- `/js/dom_api.js`, `/js/secure_engine.js`, and related JS modules
- `/js/secure_engine.generated.wasm`

If you only test with `curl`, you will only see HTML and no JS/Wasm execution.

> The CSP in `index.html` enforces `require-trusted-types-for 'script'`, so
> the demo must be opened over HTTP/HTTPS.
