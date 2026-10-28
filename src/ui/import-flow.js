// Applying imports with a guard against silently replacing unexported work.
import { toast } from './dom.js';
import { askConfirm } from './modal.js';
import { importText } from '../core/import.js';
import { isDirty } from '../core/state.js';

// Ask before replacing a keymap that has changes not yet exported or saved.
export async function confirmReplace(store) {
  if (!isDirty(store.get())) return true;
  return askConfirm('Replace current keymap?', 'Your keymap has changes that have not been exported or saved as a project. Replacing it can be undone with Ctrl+Z until you reload.', 'Replace');
}

const replacesKeymap = (result) => !!(result.keymap || result.project);

// Returns true when the result was applied.
export async function applyResult(result, name, store, actions) {
  if (replacesKeymap(result) && !(await confirmReplace(store))) return false;
  actions.importResult(result, name);
  const parts = [result.layouts.length && 'layout', result.keymap && 'keymap', result.project && 'project'].filter(Boolean);
  toast(`Imported ${parts.join(' + ')}${name ? ` from ${name}` : ''}`);
  return true;
}

export async function importFiles(files, store, actions) {
  let ok = 0;
  for (const file of files) {
    const result = importText(await file.text());
    if (result.errors.length) {
      toast(`${file.name}: ${result.errors[0]}`, 'error');
      continue;
    }
    if (await applyResult(result, file.name, store, actions)) ok++;
  }
  return ok;
}
