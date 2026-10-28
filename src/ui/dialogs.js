// Import, New and Preview dialogs.
import { h, replace, download, toast } from './dom.js';
import { importText } from '../core/import.js';
import { exportKeymap, exportFileName, toRawUrl } from '../core/export.js';

export async function importFiles(files, actions) {
  let ok = 0;
  for (const file of files) {
    const result = importText(await file.text());
    if (result.errors.length) {
      toast(`${file.name}: ${result.errors[0]}`, 'error');
      continue;
    }
    actions.importResult(result, file.name);
    ok++;
    const parts = [result.layouts.length && 'layout', result.keymap && 'keymap', result.project && 'project'].filter(Boolean);
    toast(`Imported ${parts.join(' + ')} from ${file.name}`);
  }
  return ok;
}

function dialog(title, body, buttons) {
  const dlg = h('dialog.modal', {}, h('h2', {}, title), body, h('div.dialog-buttons', {}, buttons));
  document.body.append(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.showModal();
  return dlg;
}

function openImport(actions) {
  const msg = h('p.dialog-msg');
  const text = h('textarea', { placeholder: '…or paste a .keymap, .dtsi/.overlay, QMK info.json or KLE JSON here', spellcheck: false });
  const url = h('input', { type: 'url', placeholder: '…or a URL (GitHub links work)' });
  const fileInput = h('input', {
    type: 'file',
    multiple: true,
    accept: '.keymap,.dtsi,.overlay,.dts,.json,.txt',
    style: { display: 'none' },
    onchange: async (e) => {
      if (await importFiles([...e.target.files], actions)) dlg.close();
    },
  });
  const run = async () => {
    let src = text.value;
    let name = '';
    if (!src.trim() && url.value.trim()) {
      try {
        const res = await fetch(toRawUrl(url.value));
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        src = await res.text();
        name = url.value.split('/').pop();
      } catch (err) {
        return replace(msg, `Could not fetch: ${err.message}`);
      }
    }
    const result = importText(src);
    if (result.errors.length) return replace(msg, result.errors[0]);
    actions.importResult(result, name);
    dlg.close();
  };
  const body = h(
    'div.import-body',
    {},
    h('p.muted', {}, 'Physical layouts: ZMK .dtsi/.overlay (e.g. from zmk-layout-helper), QMK info.json, KLE JSON. Keymaps: ZMK .keymap. The type is detected automatically; files can also be dropped anywhere.'),
    h('button.primary.big', { onclick: () => fileInput.click() }, 'Choose files…'),
    fileInput,
    text,
    url,
    msg,
  );
  const dlg = dialog('Import', body, [h('button', { onclick: () => dlg.close() }, 'Cancel'), h('button.primary', { onclick: run }, 'Import')]);
}

function openNew(store, actions) {
  const hasLayout = store.get().layouts.length > 0;
  const rows = h('input', { type: 'text', value: '12, 12, 12, 6', spellcheck: false });
  const layers = h('input', { type: 'number', value: 3, min: 1, max: 32 });
  const parseRows = () => rows.value.split(/[,\s]+/).map(Number).filter((n) => Number.isInteger(n) && n > 0);
  const create = (keep) => {
    const r = parseRows();
    if (!keep && !r.length) return toast('Enter keys per row, e.g. 10, 10, 10', 'warn');
    actions.newKeymap(r, Math.max(1, Number(layers.value) || 1), keep);
    dlg.close();
  };
  const body = h(
    'div.new-body',
    {},
    h('label.field', {}, h('span', {}, 'Keys per row'), rows),
    h('label.field', {}, h('span', {}, 'Layers'), layers),
    h('p.muted', {}, 'Creates an empty keymap on a simple grid. Import a physical layout later to replace the grid.'),
  );
  const dlg = dialog('New keymap', body, [
    h('button', { onclick: () => (actions.loadExample(), dlg.close()) }, 'Load example'),
    h('span.grow'),
    hasLayout ? h('button', { onclick: () => create(true) }, 'Blank on current layout') : null,
    h('button.primary', { onclick: () => create(false) }, 'Create grid'),
  ]);
}

function openPreview(store) {
  const s = store.get();
  const text = exportKeymap(s);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast('Copied');
    } catch {
      toast('Clipboard unavailable — select the text and copy manually', 'warn');
    }
  };
  const dlg = dialog('Preview', h('pre.preview', {}, text), [
    h('button', { onclick: () => dlg.close() }, 'Close'),
    h('span.grow'),
    h('button', { onclick: copy }, 'Copy'),
    h('button.primary', { onclick: () => download(exportFileName(s), text) }, 'Download'),
  ]);
}

export function createDialogs(store, actions) {
  return {
    openImport: () => openImport(actions),
    openNew: () => openNew(store, actions),
    openPreview: () => openPreview(store),
  };
}
