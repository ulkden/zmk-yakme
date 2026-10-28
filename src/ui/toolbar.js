// Top bar buttons.
import { h, replace } from './dom.js';

export function mountToolbar(el, store, actions, dialogs) {
  const render = () => {
    const hasKeymap = !!store.get().keymap;
    replace(
      el,
      h('button', { onclick: dialogs.openImport, title: 'Import layout or keymap (or drop files anywhere)' }, 'Import'),
      h('button', { onclick: dialogs.openNew }, 'New'),
      h('span.sep'),
      h('button.icon', { onclick: actions.undo, disabled: !store.canUndo(), title: 'Undo (Ctrl+Z)' }, '↶'),
      h('button.icon', { onclick: actions.redo, disabled: !store.canRedo(), title: 'Redo (Ctrl+Shift+Z)' }, '↷'),
      h('span.grow'),
      h('button.primary', { onclick: dialogs.openExport, disabled: !hasKeymap, title: 'Preview, copy or download the .keymap' }, 'Export…'),
    );
  };
  store.subscribe(render);
  render();
}
