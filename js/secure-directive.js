import createEngine from './secure_engine.js';

let enginePromise;

async function getEngine() {
  if (!enginePromise) {
    enginePromise = createEngine();
  }
  return enginePromise;
}

export async function createSecureDirective() {
  const engine = await getEngine();

  /**
   * OpenMP-style security directive:
   * secure`<div>${userInput}</div>`
   */
  function secure(strings, ...values) {
    let out = '';

    for (let i = 0; i < strings.length; i += 1) {
      out += strings[i];
      if (i < values.length) {
        const raw = String(values[i] ?? '');
        const safe = engine.ccall('secure_transform', 'string', ['string'], [raw]);
        out += safe;
      }
    }

    return out;
  }

  return secure;
}
