/**
 * Covian Demo — main.js
 *
 * Demonstrates all public features of the Covian XSS-prevention framework:
 *   - encodeText / encodeAttr / encodeURL / validateUTF8
 *   - createDomApi      (safe typed DOM builder)
 *   - hardenDomSinks    (unsafe sink hardening)
 *   - requireTrustedTypes (Trusted Types enforcement)
 *
 * Run locally with any static file server, e.g.:
 *   npx serve .
 * from the repository root (after building the Wasm — see README.md).
 */

// The Emscripten-generated factory (built by scripts/build_wasm_docker.sh or
// scripts/build_wasm.sh).  The path is relative to this file.
import createWasmModule from '../../js/secure_engine.generated.js';

// Source-controlled JS modules — no build step required for these.
import { createDomApi } from '../../js/dom_api.js';
import { initSecureEngine } from '../../js/secure_engine.js';

async function bootstrap() {
  let dom = null;
  let engine = null;
  let compatibilityMessage = '';

  // Try full Covian mode first (safe DOM + sink hardening + Trusted Types).
  try {
    dom = await createDomApi({ wasmFactory: createWasmModule });
    engine = dom;
  } catch (err) {
    // Fallback mode for browsers missing Trusted Types support:
    // keep encoding APIs interactive so the demo is still useful.
    compatibilityMessage = err.message;
    engine = await initSecureEngine({ wasmFactory: createWasmModule });
  }

  clearTimeout(slowLoadTimer);

  // Reveal the UI.
  document.getElementById('loading').remove();
  document.getElementById('app').hidden = false;
  if (!dom) {
    document.getElementById('compat-note').hidden = false;
  }

  // Encoding playground — update output fields on every keystroke.
  function updateEncoding(value) {
    document.getElementById('out-text').textContent = engine.encodeText(value);
    document.getElementById('out-attr').textContent = engine.encodeAttr(value);
    document.getElementById('out-url').textContent  = engine.encodeURL(value);
    document.getElementById('out-utf8').textContent = engine.validateUTF8(value)
      ? 'valid UTF-8'
      : 'invalid UTF-8';
  }

  const inputEl = document.getElementById('user-input');
  const runApiBtn = document.getElementById('run-api-btn');
  const apiMethodEl = document.getElementById('api-method');
  const apiOutputEl = document.getElementById('run-api-output');
  updateEncoding(inputEl.value);
  inputEl.addEventListener('input', (e) => updateEncoding(e.target.value));

  function runSelectedApi() {
    const value = inputEl.value;
    const method = apiMethodEl.value;
    const result = method === 'validateUTF8'
      ? engine.validateUTF8(value)
      : engine[method](value);
    apiOutputEl.textContent = JSON.stringify({ method, input: value, result }, null, 2);
  }
  runSelectedApi();
  runApiBtn.addEventListener('click', runSelectedApi);

  // Build a card element using only typed DOM primitives — no innerHTML, no
  // template strings for HTML.
  const userQuery = new URLSearchParams(location.search).get('q')
    ?? '<img src=x onerror=alert(1) />';

  const sinkResults = document.getElementById('sink-results');
  const domOutput = document.getElementById('dom-output');

  if (dom) {
    const heading = dom.createElement('strong', {
      children: [dom.createText('Covian safe DOM output')],
    });

    const queryText = dom.createText(`Input: ${userQuery}`);

    const link = dom.createElement('a', {
      attrs: { href: 'https://github.com/SilasChalwe/xss-framework', target: '_blank' },
      children: [dom.createText('View source on GitHub')],
    });

    const card = dom.createElement('div', {
      attrs: { class: 'covian-card' },
      children: [
        heading,
        dom.createElement('br'),
        queryText,
        dom.createElement('br'),
        link,
      ],
    });

    dom.mount(domOutput, card);
  } else {
    domOutput.textContent = `Safe DOM API disabled in this browser: ${compatibilityMessage}`;
    domOutput.style.color = '#991b1b';
  }

  // Unsafe sink hardening playground.
  if (!dom) {
    const row = document.createElement('div');
    row.className = 'sink-result error';
    row.textContent = 'Sink hardening unavailable because Trusted Types is not supported in this browser.';
    sinkResults.appendChild(row);
  } else {
    const sinkSelect = document.getElementById('sink-select');
    const sinkPayload = document.getElementById('sink-payload');
    const runSinkBtn = document.getElementById('run-sink-btn');

    function trySink(label, fn) {
      const row = document.createElement('div');
      try {
        fn();
        // If we reach here, the sink was NOT blocked (unexpected after hardenDomSinks).
        row.className = 'sink-result error';
        row.textContent = `FAIL: ${label} - not blocked (unexpected)`;
      } catch (err) {
        row.className = 'sink-result ok';
        row.textContent = `BLOCKED: ${label} - ${err.message}`;
      }
      sinkResults.appendChild(row);
    }

    const probe = document.createElement('div');
    runSinkBtn.addEventListener('click', () => {
      const payload = sinkPayload.value;
      const mode = sinkSelect.value;
      if (mode === 'innerHTML') {
        trySink('element.innerHTML', () => { probe.innerHTML = payload; });
      } else if (mode === 'outerHTML') {
        trySink('element.outerHTML', () => { probe.outerHTML = payload; });
      } else if (mode === 'insertAdjacentHTML') {
        trySink('element.insertAdjacentHTML', () => { probe.insertAdjacentHTML('beforeend', payload); });
      } else {
        trySink('document.write', () => { document.write(payload); });
      }
    });
  }

  // URL encoding playground — test any URL value and append result rows.
  const BLOCKED = 'about:invalid#covian-blocked-url';
  const urlInput = document.getElementById('url-input');
  const runUrlBtn = document.getElementById('run-url-btn');
  const clearUrlBtn = document.getElementById('clear-url-btn');
  const tbody = document.getElementById('url-tbody');

  function appendUrlRow(input) {
    const encoded = engine.encodeURL(input);
    const isBlocked = encoded === BLOCKED;

    const tr = document.createElement('tr');

    const tdInput = document.createElement('td');
    tdInput.textContent = input;

    const tdEncoded = document.createElement('td');
    tdEncoded.textContent = encoded;

    const tdVerdict = document.createElement('td');
    tdVerdict.textContent = isBlocked ? 'blocked' : 'allowed';
    tdVerdict.className = isBlocked ? 'verdict-blocked' : 'verdict-safe';

    tr.appendChild(tdInput);
    tr.appendChild(tdEncoded);
    tr.appendChild(tdVerdict);
    tbody.appendChild(tr);
  }

  runUrlBtn.addEventListener('click', () => {
    appendUrlRow(urlInput.value);
  });
  clearUrlBtn.addEventListener('click', () => {
    tbody.textContent = '';
  });
  appendUrlRow(urlInput.value);
}

const slowLoadTimer = setTimeout(() => {
  const loading = document.getElementById('loading');
  loading.textContent = 'Still loading WebAssembly… check DevTools Network for secure_engine.generated.wasm (should be HTTP 200).';
}, 4000);

bootstrap().catch((err) => {
  clearTimeout(slowLoadTimer);
  const loading = document.getElementById('loading');
  loading.textContent = `Covian failed to start: ${err.message}`;
  loading.style.color = '#991b1b';
  console.error(err);
});
