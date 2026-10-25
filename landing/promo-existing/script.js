'use strict';
document.querySelectorAll('button[data-faq]').forEach(function (button) {
  button.addEventListener('click', function () {
    var answer = document.getElementById(button.getAttribute('aria-controls'));
    if (!answer) return;
    var open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    answer.hidden = !open;
    var sign = button.querySelector('span');
    if (sign) sign.textContent = open ? '−' : '+';
  });
});
