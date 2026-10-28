// Produce the final .keymap text for the current state.
import { activeLayout } from './state.js';
import { rowsFromLayout } from './layout-ops.js';
import { writeKeymap } from './keymap-write.js';

export function exportKeymap(state) {
  if (!state.keymap) return '';
  const layout = activeLayout(state);
  if (!layout) return writeKeymap(state.keymap);
  return writeKeymap(state.keymap, { rows: rowsFromLayout(layout.keys), keyCount: layout.keys.length });
}

export function exportFileName(state) {
  const base = (state.fileName ?? '').replace(/\.[^.]*$/, '');
  return `${base || 'keymap'}.keymap`;
}

// Turn a github.com "blob" link into a raw.githubusercontent.com link that allows CORS.
export function toRawUrl(url) {
  const m = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)\/blob\/(.+)$/.exec(url.trim());
  return m ? `https://raw.githubusercontent.com/${m[1]}/${m[2]}/${m[3]}` : url.trim();
}
