import { createDomApi } from '../../js/index.js';
import createWasmModule from '../../js/secure_engine.generated.js';

async function bootstrap() {
  const dom = await createDomApi({ wasmFactory: createWasmModule });
  const userInput = new URLSearchParams(location.search).get('q') ?? '<img src=x onerror=alert(1) />';

  const content = dom.createElement('div', {
    children: [dom.createText(`Results for: ${userInput}`)],
  });

  dom.mount(document.getElementById('app'), content);
}

bootstrap().catch((err) => {
  const root = document.getElementById('app');
  root.textContent = `Covian failed to start: ${err.message}`;
  root.style.color = '#b91c1c';
  console.error(err);
});
