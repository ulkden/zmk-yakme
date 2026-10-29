// Dialog entry points used by the toolbar and welcome screen.
import { h } from './dom.js';
import { importFiles } from './import-flow.js';
import { openImport } from './import-dialog.js';
import { openNew } from './new-dialog.js';
import { openExport } from './export-dialog.js';
import { openClose } from './close-dialog.js';

// One hidden file input for "Open project", shared by the toolbar and the welcome screen.
function projectPicker(store, actions) {
  const input = h('input', {
    type: 'file',
    accept: '.json',
    style: { display: 'none' },
    onchange: (e) => importFiles([...e.target.files], store, actions).finally(() => (e.target.value = '')),
  });
  document.body.append(input);
  return () => input.click();
}

export function createDialogs(store, actions) {
  return {
    openProject: projectPicker(store, actions),
    openImport: () => openImport(store, actions),
    openNew: () => openNew(store, actions),
    openExport: () => openExport(store, actions),
    openClose: () => openClose(store, actions),
  };
}
