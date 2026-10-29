// "Close keymap": confirm, optionally reset preferences, then return to a fresh welcome screen.
import { h, toast } from './dom.js';
import { dialog } from './modal.js';
import { isDirty } from '../core/state.js';

export function openClose(store, actions) {
  const dirty = isDirty(store.get());
  const resetPrefs = h('input', { type: 'checkbox', name: 'reset-prefs' });
  const body = h(
    'div.close-body',
    {},
    h('p', {}, 'This clears the layout, keymap, autosaved copy and undo history, and returns to the welcome screen.'),
    dirty
      ? h('p.warn-text', {}, 'You have changes that were not exported or saved as a project. They will be lost.')
      : null,
    h('label.check', {}, resetPrefs, ' Also reset preferences (auto-advance, layer diagrams)'),
  );
  const close = () => {
    actions.closeKeymap({ resetPrefs: resetPrefs.checked });
    dlg.close();
    toast(resetPrefs.checked ? 'Closed. Everything was reset.' : 'Keymap closed');
  };
  const dlg = dialog(
    'Close keymap?',
    body,
    [
      h('button', { onclick: () => dlg.close() }, 'Cancel'),
      h(dirty ? 'button.danger.solid' : 'button.primary', { onclick: close }, 'Close Keymap'),
    ],
    'close-keymap',
  );
}
