// Top bar buttons. Built once; only their enabled state follows the store, so a
// re-render can never swallow a click on them.
import { h, replace } from './dom.js';

export function mountToolbar(el, store, actions, dialogs) {
  const undo = h('button.icon', { onclick: actions.undo, title: 'Undo (Ctrl+Z)' }, '↶');
  const redo = h('button.icon', { onclick: actions.redo, title: 'Redo (Ctrl+Shift+Z)' }, '↷');
  const exportBtn = h('button.primary', { onclick: dialogs.openExport, title: 'Preview, copy or download the .keymap' }, 'Export…');
  replace(
    el,
    h('button', { onclick: dialogs.openImport, title: 'Import layout or keymap (or drop files anywhere)' }, 'Import'),
    h('button', { onclick: dialogs.openNew }, 'New'),
    h('span.sep'),
    undo,
    redo,
    h('span.grow'),
    exportBtn,
  );
  const sync = () => {
    undo.disabled = !store.canUndo();
    redo.disabled = !store.canRedo();
    exportBtn.disabled = !store.get().keymap;
  };
  store.subscribe(sync);
  sync();
}
