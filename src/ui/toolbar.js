// Top bar buttons. Built once; only their enabled state follows the store, so a
// re-render can never swallow a click on them.
import { h, replace, download, toast } from './dom.js';
import { serialize } from '../core/state.js';
import { projectFileName } from '../core/export.js';
import { importFiles } from './import-flow.js';

function projectButtons(store, actions) {
  const input = h('input', {
    type: 'file',
    accept: '.json',
    style: { display: 'none' },
    onchange: (e) => importFiles([...e.target.files], store, actions).finally(() => (e.target.value = '')),
  });
  const open = h('button', { onclick: () => input.click(), title: 'Open a saved project (.json)' }, 'Open project');
  const save = h(
    'button',
    {
      title: 'Save layout + keymap as a project file to back up or move between browsers',
      onclick: () => {
        download(projectFileName(store.get()), serialize(store.get()));
        actions.markClean();
        toast('Project saved');
      },
    },
    'Save project',
  );
  return { open, save, input };
}

export function mountToolbar(el, store, actions, dialogs) {
  const undo = h('button.icon', { onclick: actions.undo, title: 'Undo (Ctrl+Z)' }, '↶');
  const redo = h('button.icon', { onclick: actions.redo, title: 'Redo (Ctrl+Shift+Z)' }, '↷');
  const exportBtn = h(
    'button.primary',
    { onclick: dialogs.openExport, title: 'Preview, copy or download the .keymap' },
    'Export…',
  );
  const project = projectButtons(store, actions);
  const close = h('button', { onclick: dialogs.openClose, title: 'Close the keymap and start fresh' }, 'Close keymap');
  replace(
    el,
    h('button', { onclick: dialogs.openImport, title: 'Import layout or keymap (or drop files anywhere)' }, 'Import'),
    h('button', { onclick: dialogs.openNew }, 'New'),
    close,
    h('span.sep'),
    project.open,
    project.save,
    project.input,
    h('span.sep'),
    undo,
    redo,
    h('span.grow'),
    exportBtn,
  );
  const sync = () => {
    undo.disabled = !store.canUndo();
    redo.disabled = !store.canRedo();
    exportBtn.disabled = project.save.disabled = close.disabled = !store.get().keymap;
  };
  store.subscribe(sync);
  sync();
}
