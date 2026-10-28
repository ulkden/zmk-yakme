// Export dialog: editable file name, notices about generated content, preview, copy and download.
import { h, replace, download, toast } from './dom.js';
import { dialog } from './modal.js';
import { exportKeymapDetailed, exportFileName } from '../core/export.js';

function notices(state, addedIncludes, actions, rerender) {
  const items = [];
  if (addedIncludes.length) {
    items.push(
      h(
        'li',
        {},
        'These includes will be added: ',
        addedIncludes.map((i) => h('code', {}, `<${i}>`, ' ')),
      ),
    );
  }
  const diagrams = state.ui.diagrams !== false;
  items.push(
    h(
      'li',
      {},
      h(
        'label.check',
        {},
        h('input', {
          type: 'checkbox',
          name: 'diagrams',
          checked: diagrams,
          onchange: (e) => (actions.setDiagrams(e.target.checked), rerender()),
        }),
        ' Generate a layer diagram comment above each layer',
      ),
      diagrams
        ? h(
            'span.small.notice-detail',
            {},
            'Comments inside the keymap and combos sections are replaced by the generated diagrams.',
          )
        : h('span.small.notice-detail', {}, 'No comments are written inside the keymap and combos sections.'),
    ),
  );
  return h('ul.notices', {}, items);
}

export function openExport(store, actions) {
  let text = '';
  const name = h('input.filename', {
    type: 'text',
    value: exportFileName(store.get()),
    spellcheck: false,
    onchange: (e) => actions.setFileName(e.target.value.trim() || null),
  });
  const content = h('div.export-content');
  const render = () => {
    const s = store.get();
    const result = exportKeymapDetailed(s, { diagrams: s.ui.diagrams !== false });
    text = result.text;
    replace(content, notices(s, result.addedIncludes, actions, render), h('pre.preview', {}, text));
  };
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
    download(exportFileName({ fileName: name.value.trim() }), text);
    actions.markClean();
    dlg.close();
  };
  render();
  const body = h('div.export-body', {}, h('label.field', {}, h('span', {}, 'File name'), name), content);
  const dlg = dialog('Export keymap', body, [
    h('button', { onclick: () => dlg.close() }, 'Close'),
    h('span.grow'),
    h('button', { onclick: copy }, 'Copy'),
    h('button.primary', { onclick: save }, 'Download'),
  ]);
}
