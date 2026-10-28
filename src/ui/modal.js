// Modal dialog helpers built on <dialog>.
import { h } from './dom.js';

export function dialog(title, body, buttons, className = '') {
  const dlg = h('dialog.modal', { class: className }, h('h2', {}, title), body, h('div.dialog-buttons', {}, buttons));
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal();
  return dlg;
}

// Resolves true when the user confirms, false on cancel or Escape.
export function askConfirm(title, message, okLabel = 'Continue') {
  return new Promise((resolve) => {
    let result = false;
    const dlg = dialog(
      title,
      h('p', {}, message),
      [
        h('button', { onclick: () => dlg.close() }, 'Cancel'),
        h('button.primary', { onclick: () => ((result = true), dlg.close()) }, okLabel),
      ],
      'confirm',
    );
    dlg.addEventListener('close', () => resolve(result));
  });
}
