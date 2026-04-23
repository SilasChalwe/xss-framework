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

### 1) Plain HTML + JavaScript
Use a module script and build your UI from Covian DOM primitives.

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'; require-trusted-types-for 'script'; trusted-types covian-policy" />
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
import createWasmModule from './js/secure_engine.generated.js'; // emcc output

const dom = await createDomApi({ wasmFactory: createWasmModule });

const textNode = dom.createText('<script>alert(1)</script>');
const link = dom.createElement('a', { children: [textNode] });
dom.setAttr(link, 'href', 'https://example.com?q=a b');

const root = document.getElementById('app');
dom.mount(root, link);
```

## Build Wasm
```bash
./scripts/build_wasm.sh
# or
./scripts/build_wasm_docker.sh
```

## Native adversarial tests
```bash
./scripts/test_native.sh
```

## Notes
- `js/secure_engine.js` in source control is the runtime binding layer. The Emscripten-generated module should be supplied as `wasmFactory` at app startup.
- Blocked URLs resolve to `about:invalid#covian-blocked-url`.

## License
MIT
