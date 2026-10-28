// Top bar buttons.
import { h, replace, download, toast } from './dom.js';
import { exportKeymap, exportFileName } from '../core/export.js';

export function mountToolbar(el, store, actions, dialogs) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(exportKeymap(store.get()));
      toast('Keymap copied to clipboard');
    } catch {
      toast('Clipboard unavailable — use Preview to copy', 'warn');
    }
  };
  const save = () => {
    const s = store.get();
    download(exportFileName(s), exportKeymap(s));
  };
  const render = () => {
    const s = store.get();
    const hasKeymap = !!s.keymap;
    replace(
      el,
      h('button', { onclick: dialogs.openImport, title: 'Import layout or keymap (or drop files anywhere)' }, 'Import'),
      h('button', { onclick: dialogs.openNew }, 'New'),
      h('span.sep'),
      h('button.icon', { onclick: actions.undo, disabled: !store.canUndo(), title: 'Undo (Ctrl+Z)' }, '↶'),
      h('button.icon', { onclick: actions.redo, disabled: !store.canRedo(), title: 'Redo (Ctrl+Shift+Z)' }, '↷'),
      h('span.grow'),
      h('button', { onclick: dialogs.openPreview, disabled: !hasKeymap }, 'Preview'),
      h('button', { onclick: copy, disabled: !hasKeymap }, 'Copy'),
      h('button.primary', { onclick: save, disabled: !hasKeymap, title: exportFileName(s) }, 'Download .keymap'),
    );
  };
  store.subscribe(render);
  render();
}
