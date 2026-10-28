// Empty state shown before anything is loaded.
import { h, replace } from './dom.js';
import { versionLine } from './version.js';

export function mountWelcome(el, store, actions, dialogs) {
  const render = () => {
    if (store.get().keymap) return replace(el);
    replace(
      el,
      h(
        'div.welcome',
        {},
        h('h1', {}, 'ZMK Keymap Editor'),
        h(
          'p.muted',
          {},
          'Import a physical layout and/or an existing keymap, edit layers and combos, then download a .keymap for your ZMK config.',
        ),
        h(
          'div.welcome-actions',
          {},
          h('button.primary.big', { onclick: dialogs.openImport }, 'Import files'),
          h('button.big', { onclick: dialogs.openNew }, 'Start blank'),
          h('button.big', { onclick: actions.loadExample }, 'Try the example'),
        ),
        h('p.muted.small', {}, 'Tip: drop .keymap, .dtsi, .overlay or .json files anywhere on this page.'),
        versionLine(),
      ),
    );
  };
  store.subscribe(render);
  render();
}
