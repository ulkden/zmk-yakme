// ASCII-art layer diagrams written as comments above each layer on export.
import { bindingLabel } from './labels.js';
import { parseBinding } from './bindings.js';
import { gridLayout, rowsFromLayout } from './layout-ops.js';

const MAX_LABEL = 9;

export function diagramLabel(binding, layers) {
  const { tap, hold, kind } = bindingLabel(binding, layers);
  const { behavior } = parseBinding(binding);
  let text = tap;
  if (kind === 'hold' || behavior === 'lt') text = `${tap}/${hold}`;
  else if (kind === 'layer') text = `${behavior} ${tap}`;
  else if (hold && kind !== 'key') text = `${hold} ${tap}`;
  return text.length > MAX_LABEL ? text.slice(0, MAX_LABEL - 1) + '…' : text;
}

function center(text, width) {
  const left = Math.floor((width - text.length) / 2);
  return ' '.repeat(Math.max(0, left)) + text + ' '.repeat(Math.max(0, width - text.length - left));
}

// One text line per physical row; key labels are placed by their x position.
export function layerDiagram(bindings, layers, keys) {
  const labels = keys.map((_, i) => diagramLabel(bindings[i] ?? '', layers));
  const cell = Math.max(5, ...labels.map((l) => l.length + 2));
  const stride = cell + 1;
  const minX = Math.min(...keys.map((k) => k.x));
  const lines = [];
  let i = 0;
  for (const n of rowsFromLayout(keys)) {
    let line = '';
    for (const key of keys.slice(i, i + n)) {
      const col = Math.max(Math.round((key.x - minX) * stride), line ? line.length + 1 : 0);
      line = line.padEnd(col) + center(labels[i], Math.round(key.w * stride) - 1);
      i++;
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

// Comment lines for a layer, or [] when there is nothing to draw.
export function diagramComment(layer, layers, keys, rows) {
  const geometry = keys?.length ? keys : gridLayout(rows?.length ? rows : [layer.bindings.length]).keys;
  if (!geometry.length) return [];
  return [`// ${layer.name}`, ...layerDiagram(layer.bindings, layers, geometry).map((l) => (l ? `// ${l}` : '//'))];
}
