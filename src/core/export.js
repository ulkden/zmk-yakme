// Produce the final .keymap text for the current state.
import { activeLayout } from './state.js';
import { rowsFromLayout } from './layout-ops.js';
import { writeKeymapDetailed } from './keymap-write.js';

// Returns { text, addedIncludes }. options: extra writer options (e.g. { diagrams }).
export function exportKeymapDetailed(state, options = {}) {
  if (!state.keymap) return { text: '', addedIncludes: [] };
  const layout = activeLayout(state);
  if (!layout) return writeKeymapDetailed(state.keymap, options);
  return writeKeymapDetailed(state.keymap, {
    ...options,
    rows: rowsFromLayout(layout.keys),
    keyCount: layout.keys.length,
    keys: layout.keys,
  });
}

export function exportKeymap(state, options = {}) {
  return exportKeymapDetailed(state, options).text;
}

export function exportFileName(state) {
  const base = (state.fileName ?? '').replace(/\.[^.]*$/, '');
  return `${base || 'keymap'}.keymap`;
}

export function projectFileName(state) {
  return exportFileName(state).replace(/\.keymap$/, '.zmk-project.json');
}

// Turn a github.com "blob" link into a raw.githubusercontent.com link that allows CORS.
export function toRawUrl(url) {
  const m = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/.exec(url.trim());
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}` : url.trim();
}
