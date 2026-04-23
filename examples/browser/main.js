import { createDomApi } from '../../js/index.js';
import createWasmModule from '../../js/secure_engine.generated.js';

const dom = await createDomApi({ wasmFactory: createWasmModule });
const userInput = new URLSearchParams(location.search).get('q') ?? '<img src=x onerror=alert(1) />';

const content = dom.createElement('div', {
  children: [dom.createText(`Results for: ${userInput}`)],
});

dom.mount(document.getElementById('app'), content);
