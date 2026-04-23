# Covian Secure Rendering System

Covian is a **security-first rendering architecture** with deterministic C++ encoding in WebAssembly and a strict JavaScript DOM API that blocks unsafe sinks by design.

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
