import { createDomApi } from '../../js/index.js';
import createWasmModule from '../../js/secure_engine.generated.js';

async function bootstrap() {
  const root = document.getElementById('app');
  root.textContent = 'Loading WebAssembly engine…';

  const dom = await createDomApi({ wasmFactory: createWasmModule });
  const userInput = new URLSearchParams(location.search).get('q') ?? '<img src=x onerror=alert(1) />';

  const content = dom.createElement('div', {
    children: [dom.createText(`Results for: ${userInput}`)],
  });

  dom.mount(root, content);
}

bootstrap().catch((err) => {
  const root = document.getElementById('app');
  root.textContent = `Covian failed to start: ${err.message}. Use a real browser (not curl) over http://localhost:4173`;
  root.style.color = '#b91c1c';
  console.error(err);
});
