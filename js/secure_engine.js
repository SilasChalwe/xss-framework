/**
 * Covian Secure Engine — runtime binding wrapper.
 *
 * This module wraps the Emscripten-generated WebAssembly module
 * (secure_engine.generated.js / secure_engine.wasm) and exposes a clean,
 * typed JavaScript API for context-aware output encoding.
 *
 * Usage:
 *   import createWasmModule from './secure_engine.generated.js';
 *   import { initSecureEngine } from './secure_engine.js';
 *
 *   const engine = await initSecureEngine({ wasmFactory: createWasmModule });
 *   engine.encodeText('<script>alert(1)</script>');
 */

/**
 * @param {{ wasmFactory: function, wasmModuleOptions?: object }=} options
 * @returns {Promise<{ encodeText: function, encodeAttr: function, encodeURL: function, validateUTF8: function }>}
 */
export async function initSecureEngine({ wasmFactory, wasmModuleOptions = {} }) {
  if (typeof wasmFactory !== 'function') {
    throw new Error(
      'Covian: wasmFactory must be the default export of secure_engine.generated.js'
    );
  }

  const defaultLocateFile = (path) => new URL(path, import.meta.url).toString();
  const wasm = await wasmFactory({
    ...wasmModuleOptions,
    locateFile: wasmModuleOptions.locateFile ?? defaultLocateFile,
  });

  const encodeText = wasm.cwrap('encodeText', 'string', ['string']);
  const encodeAttr = wasm.cwrap('encodeAttr', 'string', ['string']);
  const encodeURL = wasm.cwrap('encodeURL', 'string', ['string']);
  const validateUTF8Raw = wasm.cwrap('validateUTF8', 'number', ['string']);

  function validateUTF8(input) {
    return validateUTF8Raw(input) === 1;
  }

  return Object.freeze({ encodeText, encodeAttr, encodeURL, validateUTF8 });
}
