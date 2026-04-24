// Output of: node tools/pragma_compiler.js examples/pragma/source.js examples/pragma/compiled.js
// The '#pragma covian secure' directive rewrites template-literal assignments
// to use the secure tagged template, preventing XSS at string interpolation sites.

function renderComment(author, message) {
  const html = secure`<div class="comment"><strong>${author}</strong><p>${message}</p></div>`;
  return html;
}

function renderProfileCard(username, bio) {
  const card = secure`<section class="profile"><h2>${username}</h2><p>${bio}</p></section>`;
  return card;
}
