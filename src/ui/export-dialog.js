// Export dialog: editable file name, notices about generated content, preview, copy and download.
import { h, download, toast } from './dom.js';
import { dialog } from './modal.js';
import { exportKeymapDetailed, exportFileName } from '../core/export.js';

function exportNotices(addedIncludes) {
  const items = [];
  if (addedIncludes.length) {
    items.push(h('li', {}, 'These includes will be added: ', addedIncludes.map((i) => h('code', {}, `<${i}>`, ' '))));
  }
  return items.length ? h('ul.notices', {}, items) : null;
}

export function openExport(store, actions) {
  const s = store.get();
  const { text, addedIncludes } = exportKeymapDetailed(s);
  const name = h('input.filename', {
    type: 'text',
    value: exportFileName(s),
    spellcheck: false,
    onchange: (e) => actions.setFileName(e.target.value.trim() || null),
  });
  const currentName = () => exportFileName({ fileName: name.value.trim() });
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      actions.markClean();
      toast('Keymap copied to clipboard');
    } catch {
      toast('Clipboard unavailable — select the text and copy manually', 'warn');
    }
  };
  const save = () => {
    actions.setFileName(name.value.trim() || null);
    download(currentName(), text);
    actions.markClean();
    dlg.close();
  };
  const body = h(
    'div.export-body',
    {},
    h('label.field', {}, h('span', {}, 'File name'), name),
    exportNotices(addedIncludes),
    h('pre.preview', {}, text),
  );
  const dlg = dialog('Export keymap', body, [
    h('button', { onclick: () => dlg.close() }, 'Close'),
    h('span.grow'),
    h('button', { onclick: copy }, 'Copy'),
    h('button.primary', { onclick: save }, 'Download'),
  ]);
}
