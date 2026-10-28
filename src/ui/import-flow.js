// Applying imports with a guard against silently replacing unexported work.
import { h, toast } from './dom.js';
import { askConfirm, dialog } from './modal.js';
import { ISSUES_URL } from '../data/project.js';
import { importText, combineResults } from '../core/import.js';
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
  const n = result.layouts.length;
  const parts = [n && (n > 1 ? `${n} layouts` : 'layout'), result.keymap && 'keymap', result.project && 'project'].filter(Boolean);
  toast(`Imported ${parts.join(' + ')}${name ? ` from ${name}` : ''}`);
  return true;
}

// Message (and, for unsupported helper macros, a link to request the feature).
export function errorContent(result) {
  if (result.errorKind !== 'helper-macros') return [result.errors[0]];
  return [
    h('span', {}, result.errors[0]),
    h('span.small.muted.issue-hint', {}, 'Want this supported? ', h('a', { href: ISSUES_URL, target: '_blank', rel: 'noopener' }, 'Open an issue on GitHub'), '.'),
  ];
}

export function reportImportError(result, name) {
  if (result.errorKind !== 'helper-macros') return toast(`${name ? `${name}: ` : ''}${result.errors[0]}`, 'error');
  const dlg = dialog(`Can't import ${name || 'this file'}`, h('div.error-body', {}, errorContent(result)), [
    h('button.primary', { onclick: () => dlg.close() }, 'OK'),
  ]);
}

// Parse texts ([{ name, text }]), report failures, and apply the rest as one import.
// Returns how many results were applied.
export async function importTexts(entries, store, actions) {
  const parsed = [];
  for (const { name, text } of entries) {
    const result = importText(text);
    if (result.errors.length) reportImportError(result, name);
    else parsed.push({ name, result });
  }
  let ok = 0;
  for (const { name, result } of combineResults(parsed)) {
    if (await applyResult(result, name, store, actions)) ok++;
  }
  return ok;
}

export async function importFiles(files, store, actions) {
  const entries = await Promise.all(files.map(async (file) => ({ name: file.name, text: await file.text() })));
  return importTexts(entries, store, actions);
}
