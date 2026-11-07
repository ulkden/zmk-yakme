// Import dialog: choose files, paste text, or fetch a URL.
import { h, showMessage } from './dom.js';
import { dialog } from './modal.js';
import { importText } from '../core/import.js';
import { toRawUrl } from '../core/export.js';
import { parseGithubUrl, isAllowedUrl } from '../core/github.js';
import { importFiles, applyResult, errorContent } from './import-flow.js';
import { showRepoPicker } from './repo-picker.js';

async function fetchText(url) {
  if (!isAllowedUrl(url))
    throw new Error('only https links to GitHub (github.com, raw.githubusercontent.com, gists) can be imported');
  const res = await fetch(toRawUrl(url));
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

const code = (text) => h('code', {}, text);

function acceptedFiles() {
  return h(
    'div.accepts',
    {},
    h(
      'section.accept-box.layouts',
      {},
      h('h3', {}, 'Physical layouts'),
      h(
        'ul',
        {},
        h(
          'li',
          {},
          'ZMK ',
          code('.dtsi'),
          ' / ',
          code('.overlay'),
          h('span.muted', {}, ' (e.g. from zmk-layout-helper)'),
        ),
        h('li', {}, 'QMK ', code('info.json')),
        h('li', {}, 'KLE JSON'),
      ),
    ),
    h(
      'section.accept-box.keymaps',
      {},
      h('h3', {}, 'Keymaps & saved projects'),
      h('ul', {}, h('li', {}, 'ZMK ', code('.keymap')), h('li', {}, 'Saved project ', code('.zmk-project.json'))),
    ),
    h('p.info-box', {}, 'The type is detected automatically. You can also drop files anywhere on the page.'),
  );
}

export function openImport(store, actions) {
  const msg = h('p.dialog-msg');
  const text = h('textarea', {
    name: 'import-text',
    placeholder: 'A .keymap, .dtsi/.overlay, QMK info.json or KLE JSON',
    spellcheck: false,
  });
  const url = h('input', {
    type: 'url',
    name: 'import-url',
    placeholder: 'A file link, or a GitHub repository to browse its files',
  });
  const repoPanel = h('div.repo-panel');
  const fileInput = h('input', {
    type: 'file',
    multiple: true,
    accept: '.keymap,.dtsi,.overlay,.dts,.json,.txt',
    style: { display: 'none' },
    onchange: async (e) => {
      if (await importFiles([...e.target.files], store, actions)) dlg.close();
    },
  });
  const run = async () => {
    let src = text.value;
    let name = '';
    if (!src.trim() && url.value.trim()) {
      const info = parseGithubUrl(url.value);
      if (info?.kind === 'repo') return showRepoPicker(repoPanel, info, store, actions, () => dlg.close());
      try {
        src = await fetchText(url.value);
        name = url.value.split('/').pop();
      } catch (err) {
        return showMessage(msg, `Could not fetch: ${err.message}`);
      }
    }
    const result = importText(src);
    if (result.errors.length) return showMessage(msg, ...errorContent(result));
    if (await applyResult(result, name, store, actions)) dlg.close();
  };
  const body = h(
    'div.import-body',
    {},
    acceptedFiles(),
    h('button.primary.big', { onclick: () => fileInput.click() }, 'Choose Files…'),
    fileInput,
    // Visible labels: placeholders alone disappear while typing and aren't read reliably (WCAG 3.3.2).
    h('label.stacked', {}, h('span', {}, 'Or paste file contents'), text),
    h('label.stacked', {}, h('span', {}, 'Or load from a link'), url),
    repoPanel,
    msg,
  );
  // "Load" imports pasted text or a file link straight away, or lists a repository's files,
  // which are then imported with "Import Selected".
  const dlg = dialog('Import', body, [
    h('button', { onclick: () => dlg.close() }, 'Cancel'),
    h('button.primary', { onclick: run }, 'Load'),
  ]);
}
