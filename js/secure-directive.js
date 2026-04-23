export async function createSecureDirective() {
  throw new Error('Covian Security Violation: string-based HTML directives are removed. Use createDomApi().');
}
