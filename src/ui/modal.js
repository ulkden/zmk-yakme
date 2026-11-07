// Modal dialog helpers built on <dialog>.
import { h } from './dom.js';

let dialogCount = 0;

// Every dialog closes the same ways: its own buttons, Esc, the ✕ in the corner, or a click on
// the backdrop. Closing that way counts as Cancel. The ✕ comes last in the DOM so that showModal()
// still focuses the first field or button.
// Screen readers name the dialog by its title. With `describe`, they also read a message when it
// opens: the body (true) or one element in it. For short messages (confirmations, errors), never
// for form fields, whose labels would be read twice.
export function dialog(title, body, buttons, className = '', { describe = false } = {}) {
  const id = `dialog-${++dialogCount}`;
  const x = h(
    'button.icon.dialog-x',
    { type: 'button', title: 'Close (Esc)', 'aria-label': 'Close dialog', onclick: () => dlg.close() },
    '✕',
  );
  // The page behind a modal dialog is inert, so its messages need a live region inside it (announce()).
  const live = h('div.sr-only.dialog-announcer', { 'aria-live': 'polite', 'aria-atomic': 'true' });
  const described = describe === true ? body : describe || null;
  if (described) described.id = `${id}-desc`;
  const dlg = h(
    'dialog.modal',
    { class: className, 'aria-labelledby': `${id}-title`, 'aria-describedby': described?.id ?? null },
    h('div.dialog-inner', {}, h('h2', { id: `${id}-title` }, title), body, h('div.dialog-buttons', {}, buttons), x),
    live,
  );
  closeOnBackdrop(dlg);
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal();
  return dlg;
}

// Backdrop clicks land on the <dialog> itself, as do clicks on its scrollbar, so the pointer must
// also be outside its box. Both the press and the release must be outside, so a text selection
// dragged out of the dialog does not close it.
function closeOnBackdrop(dlg) {
  const outside = (e) => {
    const r = dlg.getBoundingClientRect();
    const away = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    return e.target === dlg && away;
  };
  let pressedOutside = false;
  dlg.addEventListener('pointerdown', (e) => (pressedOutside = outside(e)));
  dlg.addEventListener('click', (e) => {
    if (pressedOutside && outside(e)) dlg.close();
    pressedOutside = false;
  });
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
      { describe: true },
    );
    dlg.addEventListener('close', () => resolve(result));
  });
}
