# Covian Secure Rendering System

Covian is a **security-first rendering architecture** with deterministic C++ encoding in WebAssembly and a strict JavaScript DOM API that blocks unsafe sinks by design.

## Who developed Covian?
Covian is an open-source framework maintained by the repository contributors. If you are embedding Covian in your product, treat the C++ core + Wasm boundary as the trusted security component and keep all UI rendering on the safe DOM API.


## Security Guarantees
- No string-based HTML rendering API in default usage.
- Unsafe DOM sinks are patched and blocked (`innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`).
- Context-aware output encoding is enforced at the Wasm boundary:
  - `encodeText` for HTML text context
  - `encodeAttr` for HTML attribute context
  - `encodeURL` for URL attributes with allowlist scheme validation
- Trusted Types are mandatory; Covian fails closed when unsupported.

## Architecture
```text
cpp/secure_core.cpp        # deterministic trusted encoding + validation core
js/secure_engine.js        # Wasm bindings (encoding-only API)
js/safe-dom.js             # unsafe sink hardening
js/dom_api.js              # typed safe DOM primitives
js/policy.js               # Trusted Types enforcement policy
```

## How to use Covian in your code

## Running apps built with Covian (important)

Covian apps are still regular web apps, but they should be run over **HTTP/HTTPS** in development.

- ✅ **Recommended:** run a local static server (Node, npm, Python, etc.)
- ⚠️ **Not recommended:** opening `index.html` via `file://`

Why a server is required in practice:
- ES module loading is more reliable and standards-compliant over HTTP.
- The Wasm module (`secure_engine.generated.wasm`) is fetched by the generated loader and can fail on `file://` origins in many browsers.
- Covian examples use strict CSP + Trusted Types, which are intended to run in normal web origins.

Quick start (from repository root):

```bash
# Option A: Node/npm
npx serve .

# Option B: Python
python3 -m http.server 4173
```

Then open one of these:
- `http://localhost:3000/examples/browser/` (if using `npx serve`)
- `http://localhost:4173/examples/browser/` (if using Python)
- `http://localhost:3000/examples/demo/` or `http://localhost:4173/examples/demo/`

If the page appears blank, open DevTools Console/Network:
- verify `js/secure_engine.generated.wasm` is loading (not 404)
- verify you are using `http://...` and not `file://...`
- verify you are testing in a browser (not `curl`, which does not run JS/Wasm)
- if you see a CSP WebAssembly compile error, include `'unsafe-eval'` (and preferably `'wasm-unsafe-eval'`) in `script-src`

### 1) Plain HTML + JavaScript
Use a module script and build your UI from Covian DOM primitives.

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-eval' 'wasm-unsafe-eval'; require-trusted-types-for 'script'; trusted-types covian-policy" />
  </head>
  <body>
    <main id="app"></main>
    <script type="module" src="./main.js"></script>
  </body>
</html>
```

```js
// main.js
import { createDomApi } from './js/index.js';
import createWasmModule from './js/secure_engine.generated.js';

const dom = await createDomApi({ wasmFactory: createWasmModule });
const userInput = new URLSearchParams(location.search).get('q') ?? '<img src=x onerror=alert(1)>';

const card = dom.createElement('section', {
  attrs: { class: 'result' },
  children: [dom.createText(`Query: ${userInput}`)],
});

dom.mount(document.getElementById('app'), card);
```

If you installed Covian from npm in another project, use package imports instead:

```js
import { createDomApi } from 'covian';
import createWasmModule from 'covian/js/secure_engine.generated.js';
```

### 2) Existing JavaScript app (no framework)
Use Covian where untrusted data crosses into the DOM:
- `createText()` / `setText()` for text nodes
- `setAttr()` for attributes (including URL checks)
- `mount()` for replacing root content without raw HTML

Never use `innerHTML`, template strings for HTML, or `document.write`.

### 3) React integration pattern
React already escapes text, but you can still use Covian for high-risk boundaries (e.g., validating URLs before assignment or rendering isolated secure widgets).

```jsx
import { useEffect, useRef } from 'react';
import { createDomApi } from './js/index.js';
import createWasmModule from './js/secure_engine.generated.js';

export function SecureWidget({ userInput }) {
  const ref = useRef(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const dom = await createDomApi({ wasmFactory: createWasmModule });
      if (cancelled || !ref.current) return;

      const node = dom.createElement('div', {
        children: [dom.createText(userInput)],
      });

      dom.mount(ref.current, node);
    })();

    return () => {
      cancelled = true;
    };
  }, [userInput]);

  return <div ref={ref} />;
}
```

> In React, avoid `dangerouslySetInnerHTML`. Let React handle normal JSX escaping and use Covian for explicit secure-render boundaries.

## Safe API
```js
import { createDomApi } from './js/index.js';
import createWasmModule from './js/secure_engine.generated.js'; // Emscripten output

const dom = await createDomApi({ wasmFactory: createWasmModule });

const textNode = dom.createText('<script>alert(1)</script>');
const link = dom.createElement('a', { children: [textNode] });
dom.setAttr(link, 'href', 'https://github.com/SilasChalwe/xss-framework?q=a b');


const root = document.getElementById('app');
dom.mount(root, link);
```

## Build Wasm

The Wasm artifacts (`js/secure_engine.generated.js` and `js/secure_engine.generated.wasm`) are
**pre-built by the CI pipeline** and committed to the repository.  When you clone this repository or
install it as a dependency they are already present — **you do not need Emscripten installed**.

If you need to rebuild them locally (e.g. after changing `cpp/secure_core.cpp`) run either:

```bash
./scripts/build_wasm.sh          # requires emcc in PATH
./scripts/build_wasm_docker.sh   # requires Docker (recommended)
```

Released builds are also attached as assets to every [GitHub Release](../../releases).

## Native adversarial tests
```bash
./scripts/test_native.sh
```

## Notes
- `js/secure_engine.js` in source control is the runtime binding layer. The Emscripten-generated module should be supplied as `wasmFactory` at app startup.
- Blocked URLs resolve to `about:invalid#covian-blocked-url`.

## License
MIT
