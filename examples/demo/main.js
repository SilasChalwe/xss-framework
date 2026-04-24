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

async function bootstrap() {
  // Create the full safe DOM API (this also initializes Wasm, calls
  // hardenDomSinks and requireTrustedTypes internally).
  const dom = await createDomApi({ wasmFactory: createWasmModule });
  clearTimeout(slowLoadTimer);

  // Reveal the UI.
  document.getElementById('loading').remove();
  document.getElementById('app').style.display = 'block';

  // Encoding playground — update output fields on every keystroke.
  function updateEncoding(value) {
    document.getElementById('out-text').textContent = dom.encodeText(value);
    document.getElementById('out-attr').textContent = dom.encodeAttr(value);
    document.getElementById('out-url').textContent  = dom.encodeURL(value);
    document.getElementById('out-utf8').textContent = dom.validateUTF8(value)
      ? 'valid UTF-8'
      : 'invalid UTF-8';
  }

  const inputEl = document.getElementById('user-input');
  updateEncoding(inputEl.value);
  inputEl.addEventListener('input', (e) => updateEncoding(e.target.value));

  // Build a card element using only typed DOM primitives — no innerHTML, no
  // template strings for HTML.
  const userQuery = new URLSearchParams(location.search).get('q')
    ?? '<img src=x onerror=alert(1) />';

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

  dom.mount(document.getElementById('dom-output'), card);

  // Unsafe sink hardening — attempt each blocked sink and display the result.
  const sinkResults = document.getElementById('sink-results');

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

  trySink('element.innerHTML', () => { probe.innerHTML = '<b>injected</b>'; });
  trySink('element.outerHTML', () => { probe.outerHTML = '<b>injected</b>'; });
  trySink('element.insertAdjacentHTML', () => {
    probe.insertAdjacentHTML('beforeend', '<b>injected</b>');
  });
  trySink('document.write', () => { document.write('<b>injected</b>'); });

  // URL encoding table — shows which schemes are blocked and which are allowed.
  const BLOCKED = 'about:invalid#covian-blocked-url';

  const urlSamples = [
    { label: 'javascript:alert(1)',                                         input: 'javascript:alert(1)' },
    { label: 'data:text/html,<h1>hi</h1>',                                  input: 'data:text/html,<h1>hi</h1>' },
    { label: 'vbscript:MsgBox(1)',                                          input: 'vbscript:MsgBox(1)' },
    { label: 'https://github.com/SilasChalwe/xss-framework search (space in URL)',   input: 'https://github.com/SilasChalwe/xss-framework search' },
    { label: 'https://owasp.org/?q=<script>xss</script>',                  input: 'https://owasp.org/?q=<script>xss</script>' },
    { label: '/relative/path?q=hello world',                                input: '/relative/path?q=hello world' },
    { label: '#anchor',                                                     input: '#anchor' },
    { label: '  javascript:alert(1)  (trimmed)',                            input: '  javascript:alert(1)  ' },
  ];

  const tbody = document.getElementById('url-tbody');

  for (const { label, input } of urlSamples) {
    const encoded = dom.encodeURL(input);
    const isBlocked = encoded === BLOCKED;

    const tr = document.createElement('tr');

    const tdInput = document.createElement('td');
    tdInput.textContent = label;

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
