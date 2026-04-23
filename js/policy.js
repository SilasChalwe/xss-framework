const POLICY_NAME = 'covian-policy';

export function requireTrustedTypes() {
  if (typeof window === 'undefined' || !window.trustedTypes) {
    throw new Error('Covian Security Violation: Trusted Types required; rendering blocked.');
  }

  return window.trustedTypes.createPolicy(POLICY_NAME, {
    createHTML() {
      throw new Error('Covian Security Violation: HTML creation is blocked.');
    },
    createScriptURL() {
      throw new Error('Covian Security Violation: Script URL creation is blocked.');
    },
    createURL(value) {
      return value;
    },
  });
}
