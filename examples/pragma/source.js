// Blog comment renderer — source file before pragma transform.
// Run: node tools/pragma_compiler.js examples/pragma/source.js examples/pragma/compiled.js

function renderComment(author, message) {
  // #pragma covian secure
  const html = `<div class="comment"><strong>${author}</strong><p>${message}</p></div>`;
  return html;
}

function renderProfileCard(username, bio) {
  // #pragma covian secure
  const card = `<section class="profile"><h2>${username}</h2><p>${bio}</p></section>`;
  return card;
}
