# Covian XSS Framework (Binary-Level Directive Architecture)

## Abstract
Covian XSS is a **zero-trust output encoding framework** that moves sanitization logic from mutable JavaScript code into a compiled WebAssembly module built from C++. Developers use a single directive-style API (`secure`) to encode dynamic values before rendering.

## Architecture Layers
1. **Unsafe Layer (JavaScript App Layer)**
   - Untrusted data enters from URL params, API responses, forms, and third-party sources.
2. **Isolation Layer (C++ → WebAssembly Core)**
   - Deterministic single-pass lexical encoding runs in Wasm linear memory.
   - No DOM or `window` access from the core.
3. **Directive Layer (JavaScript Tag Function)**
   - Developer-facing one-line usage: `secure` tagged template literals.

## Security Model
- Primary control: output encoding for HTML text context.
- Secondary controls (recommended in production):
  - CSP (`script-src`, `require-trusted-types-for 'script'`)
  - Trusted Types policies for dangerous sinks
  - Input validation and server-side encoding where appropriate

## Standards Alignment
- OWASP XSS Prevention Cheat Sheet (contextual output encoding)
- OWASP ASVS (V5, V8 controls relevant to output handling)
- W3C WebAssembly security model

## Build Pipeline
- `cpp/secure_core.cpp` compiled by Emscripten.
- Output artifacts:
  - `js/secure_engine.js`
  - `js/secure_engine.wasm`
- Runtime directive in `js/secure-directive.js` calls exported C++ symbols via `ccall`.

## API Contract
- `createSecureDirective(): Promise<(strings, ...values) => string>`
- `secure_transform(const char*): const char*`
- `secure_transform_alloc(const char*): char*`
- `secure_free(char*)`
