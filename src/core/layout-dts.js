// Read ZMK physical layouts (`&key_physical_attrs w h x y rot rx ry`) from devicetree.
// Units in the file are 1/100 key unit (and 1/100 degree); the model uses key units.
import { parseDts, findNodes, propCells, propString } from '../dts/parse.js';
import { evalExpr } from '../dts/expr.js';
import { splitBindings, splitParams } from './bindings.js';

export function parseDtsLayouts(textOrRoot) {
  const root = typeof textOrRoot === 'string' ? parseDts(textOrRoot) : textOrRoot;
  return findNodes(root, (n) => (propCells(n, 'keys') ?? '').includes('key_physical_attrs')).map((n) => ({
    name: propString(n, 'display-name') ?? n.labels[0] ?? n.name,
    keys: parseKeyAttrs(propCells(n, 'keys')),
  }));
}

export function parseKeyAttrs(cells) {
  const keys = [];
  for (const group of splitBindings(cells)) {
    const [, ...params] = splitParams(group);
    const v = params.map(evalExpr);
    if (v.length !== 7 || v.some(Number.isNaN)) continue;
    const [w, h, x, y, r, rx, ry] = v.map((n) => n / 100);
    keys.push({ x, y, w, h, r, rx, ry });
  }
  return keys;
}
