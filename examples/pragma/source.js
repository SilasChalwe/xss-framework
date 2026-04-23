import { createSecureDirective } from '../../js/secure-directive.js';

const secure = await createSecureDirective();
const userInput = new URLSearchParams(location.search).get('q') ?? '<svg/onload=alert(1)>';

#pragma covian secure
const view = `<div>Results for: ${userInput}</div>`;

document.getElementById('app').innerHTML = view;
