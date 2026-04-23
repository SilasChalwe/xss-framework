const VIOLATION = 'Covian Security Violation: Unsafe DOM sink blocked';

function throwViolation() {
  throw new Error(VIOLATION);
}

function patchSetter(proto, property) {
  const descriptor = Object.getOwnPropertyDescriptor(proto, property);
  if (!descriptor || typeof descriptor.set !== 'function') {
    return;
  }

  Object.defineProperty(proto, property, {
    configurable: false,
    enumerable: descriptor.enumerable,
    get: descriptor.get,
    set: throwViolation,
  });
}

export function hardenDomSinks() {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    throw new Error('Covian Security Violation: Browser DOM is required.');
  }

  patchSetter(Element.prototype, 'innerHTML');
  patchSetter(Element.prototype, 'outerHTML');

  Element.prototype.insertAdjacentHTML = throwViolation;
  Document.prototype.write = throwViolation;

  return Object.freeze({ violation: VIOLATION });
}
