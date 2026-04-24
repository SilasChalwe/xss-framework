import { initSecureEngine } from './secure_engine.js';
import { hardenDomSinks } from './safe-dom.js';
import { requireTrustedTypes } from './policy.js';

const URL_ATTRS = new Set(['href', 'src', 'action', 'formaction', 'poster']);

function ensureNode(value) {
  if (!(value instanceof Node)) {
    throw new Error('Covian Security Violation: children must be DOM nodes only.');
  }
}

export async function createDomApi(options = {}) {
  const engine = await initSecureEngine({
    wasmFactory: options.wasmFactory,
    wasmModuleOptions: options.wasmModuleOptions,
  });
  hardenDomSinks();
  const ttPolicy = requireTrustedTypes();

  function createText(value) {
    const encoded = engine.encodeText(value);
    return document.createTextNode(encoded);
  }

  function setText(element, value) {
    const encoded = engine.encodeText(value);
    element.textContent = encoded;
    return element;
  }

  function setAttr(element, name, value) {
    const normalized = String(name ?? '').toLowerCase();
    const encoded = URL_ATTRS.has(normalized)
      ? engine.encodeURL(value)
      : engine.encodeAttr(value);

    if (URL_ATTRS.has(normalized)) {
      ttPolicy.createURL(encoded);
    }

    element.setAttribute(normalized, encoded);
    return element;
  }

  function createElement(tag, optionsArg = {}) {
    const el = document.createElement(String(tag));
    const attrs = optionsArg.attrs || {};
    const children = optionsArg.children || [];

    for (const [name, value] of Object.entries(attrs)) {
      setAttr(el, name, value);
    }

    for (const child of children) {
      ensureNode(child);
      el.appendChild(child);
    }

    return el;
  }

  function mount(root, element) {
    ensureNode(element);
    root.replaceChildren(element);
    return root;
  }

  return Object.freeze({
    createElement,
    createText,
    setText,
    setAttr,
    mount,
    encodeText: engine.encodeText,
    encodeAttr: engine.encodeAttr,
    encodeURL: engine.encodeURL,
    validateUTF8: engine.validateUTF8,
  });
}
