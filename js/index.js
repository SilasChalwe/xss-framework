import { createSecureDirective } from './secure-directive.js';

export { createSecureDirective };

export async function renderSecure(target, templateBuilder) {
  const secure = await createSecureDirective();
  const html = templateBuilder(secure);
  target.innerHTML = html;
}
