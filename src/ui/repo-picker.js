// "Import from a GitHub repository": list importable files and import the checked ones.
import { h, replace } from './dom.js';
import { listRepo, rawUrl, importOrder } from '../core/github.js';
import { importTexts } from './import-flow.js';

async function fetchFiles(info, ref, paths) {
  return Promise.all(
    importOrder(paths).map(async (path) => {
      const res = await fetch(rawUrl({ ...info, ref, path }));
      if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
      return { name: path.split('/').pop(), text: await res.text() };
    }),
  );
}

function fileRow(file) {
  const box = h('input', { type: 'checkbox', checked: file.selected, value: file.path });
  return h('label.repo-file', {}, box, h('span.mono', {}, file.path), h('span.badge', {}, file.kind));
}

// Fills `panel` with the repository's files; calls done() after a successful import.
export async function showRepoPicker(panel, info, store, actions, done) {
  replace(panel, h('p.muted', {}, `Listing ${info.owner}/${info.repo}…`));
  let listing;
  try {
    listing = await listRepo(info);
  } catch (err) {
    return replace(panel, h('p.dialog-msg', {}, err.message));
  }
  if (!listing.files.length) return replace(panel, h('p.dialog-msg', {}, 'No .keymap, .dtsi, .overlay or .json files found here.'));
  const list = h('div.repo-list', {}, listing.files.map(fileRow));
  const msg = h('p.dialog-msg');
  const run = async () => {
    const paths = [...list.querySelectorAll('input:checked')].map((i) => i.value);
    if (!paths.length) return replace(msg, 'Select at least one file.');
    replace(msg, 'Importing…');
    try {
      const entries = await fetchFiles(info, listing.ref, paths);
      if (await importTexts(entries, store, actions)) done();
      else replace(msg);
    } catch (err) {
      replace(msg, `Could not fetch ${err.message}`);
    }
  };
  replace(
    panel,
    h('p.muted.small', {}, `${info.owner}/${info.repo} @ ${listing.ref}${listing.truncated ? ' (listing truncated by GitHub)' : ''}. Likely files are preselected.`),
    list,
    h('div.repo-actions', {}, h('button.primary', { onclick: run }, 'Import selected'), msg),
  );
}
