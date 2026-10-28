// Dialog entry points used by the toolbar and welcome screen.
import { openImport } from './import-dialog.js';
import { openNew } from './new-dialog.js';
import { openExport } from './export-dialog.js';

export function createDialogs(store, actions) {
  return {
    openImport: () => openImport(store, actions),
    openNew: () => openNew(store, actions),
    openExport: () => openExport(store, actions),
  };
}
