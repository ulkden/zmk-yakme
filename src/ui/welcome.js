// Empty state shown before anything is loaded.
import { h, replace, renderKeepingFocus, announce, unusable } from './dom.js';
import { versionLine } from './version.js';
import { keyCount } from '../core/state.js';

// Opening a keymap removes the welcome screen, and closing it removes the editor, so the control
// that had focus is gone (or disabled, like Close Keymap). Focus then moves to where work
// continues: the first key, or Import Files. Runs a frame later, after any dialog has closed and
// handed focus back.
function handOffFocus(open) {
  requestAnimationFrame(() => {
    // Firefox keeps focus on a control that was just disabled, so that counts as lost too.
    const a = document.activeElement;
    const lost = !a || a === document.body || !a.isConnected || unusable(a);
    if (!lost || document.querySelector('dialog[open]')) return;
    const target = open ? document.querySelector('#keyboard .key') : document.querySelector('.welcome button');
    target?.focus();
  });
}

export const loadedMessage = (state) =>
  `${keyCount(state)} keys, ${state.keymap.layers.length} layer${state.keymap.layers.length === 1 ? '' : 's'}`;

export function mountWelcome(el, store, actions, dialogs) {
  const tryExample = () => {
    actions.loadExample();
    announce(`Example loaded: ${loadedMessage(store.get())}`);
  };
  const draw = () => {
    if (store.get().keymap) return replace(el);
    replace(
      el,
      h(
        'div.welcome',
        {},
        h('h2', {}, 'ZMK Keymap Editor'),
        h(
          'p.muted',
          {},
          'Import a physical layout and/or an existing keymap, edit layers and combos, then download a .keymap for your ZMK config.',
        ),
        h(
          'div.welcome-actions',
          {},
          h('button.primary.big', { onclick: dialogs.openImport }, 'Import Files'),
          h('button.big', { onclick: dialogs.openNew }, 'Start Blank'),
          h('button.big', { onclick: tryExample }, 'Try the Example'),
          h('button.big', { onclick: dialogs.openProject, title: 'Open a saved project (.json)' }, 'Open Project'),
        ),
        h('p.muted.small', {}, 'Tip: drop .keymap, .dtsi, .overlay or .json files anywhere on this page.'),
        versionLine(),
      ),
    );
  };
  let open = !!store.get().keymap;
  store.subscribe((s) => {
    renderKeepingFocus(el, draw);
    if (!!s.keymap !== open) handOffFocus((open = !!s.keymap));
  });
  draw();
}
