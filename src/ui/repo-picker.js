// "Import from a GitHub repository": list importable files and import the checked ones.
import { h, replace, showMessage, announce } from './dom.js';
import { listRepo, rawUrl, importOrder, groupRepoFiles } from '../core/github.js';
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

// Long paths shorten in the middle: the head (leading folders) ends in "…" while the tail
// (parent folder and file name) always stays visible. The full path is in the tooltip.
function pathParts(path) {
  const parts = path.split('/');
  const tail = parts.slice(-2).join('/');
  return { head: parts.length > 2 ? parts.slice(0, -2).join('/') + '/' : '', tail };
}

function fileRow(file) {
  const box = h('input', { type: 'checkbox', checked: file.selected, value: file.path });
  const { head, tail } = pathParts(file.label);
  return h(
    'label.repo-file',
    { title: file.path, 'data-kind': file.kind },
    box,
    h('span.repo-path', {}, h('span.path-head', {}, head), h('span.path-tail', {}, tail)),
    h('span.badge', {}, file.kind),
  );
}

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

// One keyboard's files under a foldable header, e.g. "ScottoFrog  1 keymap · 1 layout · 2 selected".
// The header counts the files listed and those ticked, so folding never hides what will be imported.
function groupBlock(folder, rows, open) {
  const counts = h('span.repo-group-counts');
  const ticked = h('span.repo-group-selected');
  const el = h(
    'details.repo-group',
    { open },
    h('summary', {}, h('span.repo-group-name', {}, folder), counts, ticked),
    rows,
  );
  const refresh = () => {
    const shown = rows.filter((r) => !r.hidden);
    const kinds = ['keymap', 'layout'].map((k) => [k, shown.filter((r) => r.dataset.kind === k).length]);
    replace(
      counts,
      kinds
        .filter(([, n]) => n)
        .map(([k, n]) => plural(n, k))
        .join(' · '),
    );
    const n = rows.filter((r) => r.querySelector('input').checked).length;
    replace(ticked, n ? ` · ${n} selected` : '');
    el.hidden = !shown.length;
  };
  return { el, refresh };
}

// The file list. Only keymaps and likely layouts show at first; "Show all files" reveals the rest.
// Visibility changes only when that box is toggled, and a ticked file is never hidden, so nothing
// hidden is imported by surprise. A repository with no likely file shows everything. A repository
// holding several keyboards is folded by keyboard; only the chosen keymap's keyboard starts open.
function fileList(files) {
  const rows = files.map(fileRow);
  const rowOf = new Map(files.map((f, i) => [f, rows[i]]));
  const groups = groupRepoFiles(files);
  const loose = (groups.find((g) => !g.folder)?.files ?? []).map((f) => rowOf.get(f));
  const blocks = groups
    .filter((g) => g.folder)
    .map((g) =>
      groupBlock(
        g.folder,
        g.files.map((f) => rowOf.get(f)),
        g.files.some((f) => f.selected),
      ),
    );
  const list = h(
    'div.repo-list',
    {},
    loose,
    blocks.map((b) => b.el),
  );
  const refresh = () => blocks.forEach((b) => b.refresh());
  const extra = files.filter((f) => !f.relevant).length;
  const showAll = h('input', { type: 'checkbox', checked: extra === files.length });
  const update = () => {
    rows.forEach((row, i) => {
      row.hidden = !showAll.checked && !files[i].relevant && !row.querySelector('input').checked;
    });
    refresh();
  };
  showAll.addEventListener('change', update);
  list.addEventListener('change', refresh);
  update();
  const deselect = () => {
    list.querySelectorAll('input:checked').forEach((box) => (box.checked = false));
    refresh();
  };
  const fold = (open) => () => blocks.forEach((b) => (b.el.open = open));
  const tools = h(
    'div.repo-tools',
    {},
    extra && extra < files.length ? h('label.check', {}, showAll, ` Show all files (${extra} more)`) : null,
    h(
      'span.repo-tool-links',
      {},
      blocks.length ? h('button.link', { type: 'button', onclick: fold(true) }, 'Expand All') : null,
      blocks.length ? h('button.link', { type: 'button', onclick: fold(false) }, 'Collapse All') : null,
      h('button.link', { type: 'button', onclick: deselect, title: 'Untick every file' }, 'Deselect All'),
    ),
  );
  return { list, tools };
}

// Fills `panel` with the repository's files; calls done() after a successful import.
export async function showRepoPicker(panel, info, store, actions, done) {
  showMessage(panel, h('p.muted', {}, `Listing ${info.owner}/${info.repo}…`));
  let listing;
  try {
    listing = await listRepo(info);
  } catch (err) {
    return showMessage(panel, h('p.dialog-msg', {}, err.message));
  }
  if (!listing.files.length)
    return showMessage(panel, h('p.dialog-msg', {}, 'No .keymap, .dtsi, .overlay or .json files found here.'));
  const { list, tools } = fileList(listing.files);
  const msg = h('p.dialog-msg');
  const run = async () => {
    const paths = [...list.querySelectorAll('input:checked')].map((i) => i.value);
    if (!paths.length) return showMessage(msg, 'Select at least one file.');
    showMessage(msg, 'Importing…');
    try {
      const entries = await fetchFiles(info, listing.ref, paths);
      if (await importTexts(entries, store, actions)) done();
      else replace(msg);
    } catch (err) {
      showMessage(msg, `Could not fetch ${err.message}`);
    }
  };
  replace(
    panel,
    h(
      'p.muted.small',
      {},
      `${info.owner}/${info.repo} @ ${listing.ref}${listing.truncated ? ' (listing truncated by GitHub)' : ''}. Likely files are preselected.`,
    ),
    list,
    tools,
    h('div.repo-actions', {}, h('button.primary', { onclick: run }, 'Import Selected'), msg),
  );
  const ticked = listing.files.filter((f) => f.selected).length;
  announce(`${plural(listing.files.length, 'file')} listed, ${ticked} selected. Import Selected imports them.`);
}
