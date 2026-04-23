# Covian Security Architecture

## Layer 1: C++ Trusted Core
`cpp/secure_core.cpp` is the only trusted security boundary.

It provides deterministic, side-effect free functions:
- `encode_text`, `encode_attr`, `encode_url`
- `validate_utf8`, `normalize_input`, `detect_control_chars`
- Wasm exports: `encodeText`, `encodeAttr`, `encodeURL`, `validateUTF8`

No DOM logic, HTML generation, or templating exists in this layer.

## Layer 2: Wasm Isolation
The C++ core is compiled with Emscripten. The runtime exposes encoding-only calls through `js/secure_engine.js` and no rendering primitives.

## Layer 3: Safe DOM Runtime
`js/dom_api.js` provides the only rendering primitives:
- `createElement(tag, options)`
- `createText(value)`
- `setText(element, value)`
- `setAttr(element, name, value)`
- `mount(root, element)`

Rules:
- Children must be DOM nodes.
- Text and attributes are encoded at boundary crossing.
- URL-bearing attributes are scheme-validated and encoded.

## Layer 4: Sink Hardening
`js/safe-dom.js` blocks:
- `innerHTML`
- `outerHTML`
- `insertAdjacentHTML`
- `document.write`

Violation message:
`Covian Security Violation: Unsafe DOM sink blocked`

## Layer 5: Trusted Types
`js/policy.js` requires Trusted Types support and fails closed otherwise.

## Test Strategy
`cpp/test_secure_core.cpp` validates:
- Real payload handling (`<script>`, event-handler injections, URL schemes)
- URL scheme blocking (`javascript:`, `data:`)
- UTF-8 and control character validation
- Adversarial fuzzing for HTML meta-character safety
