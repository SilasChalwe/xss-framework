# Covian Binary-Level Directive Architecture

## 1. Directive Model
Covian uses a compiler-style directive in app source:

```js
#pragma covian secure
const view = `<div>Results for: ${userInput}</div>`;
```

A small Covian compiler pass converts that to a secure tagged-template call.

## 2. Layers
1. **Unsafe Layer:** application JavaScript data flow.
2. **Isolation Layer:** C++ sanitization engine compiled to WebAssembly.
3. **Directive Compiler Layer:** pragma rewrite pass (`tools/pragma_compiler.js`).

## 3. Core engine
`cpp/secure_core.cpp` exports:
- `secure_transform`
- `secure_transform_alloc`
- `secure_free`

## 4. Runtime bridge
`js/secure-directive.js` loads the generated Wasm module and applies `secure_transform` to every interpolation.
