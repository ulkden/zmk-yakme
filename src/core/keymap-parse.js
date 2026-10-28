// Parse a ZMK .keymap file into the editor's keymap model.
import { parseDts, findNodes, getProp, propCells, propString, hasCompatible } from '../dts/parse.js';
import { evalExpr } from '../dts/expr.js';
import { splitBindings, bindingsPerLine, splitParams } from './bindings.js';

const LAYER_PROPS = new Set(['bindings', 'display-name', 'label']);
const COMBO_PROPS = new Set(['bindings', 'key-positions', 'timeout-ms', 'layers']);

function extraProps(node, handled, text) {
  return node.props.filter((p) => !handled.has(p.name)).map((p) => text.slice(p.start, p.end).trim());
}

function intList(cells) {
  return splitParams(cells ?? '')
    .map(evalExpr)
    .filter((n) => !Number.isNaN(n));
}

function parseLayer(node, text) {
  return {
    id: node.name,
    name: propString(node, 'display-name') ?? propString(node, 'label') ?? node.name,
    bindings: splitBindings(propCells(node, 'bindings')),
    extra: extraProps(node, LAYER_PROPS, text),
  };
}

function parseCombo(node, text) {
  const timeout = getProp(node, 'timeout-ms') ? intList(propCells(node, 'timeout-ms'))[0] ?? null : null;
  return {
    name: node.name,
    keyPositions: intList(propCells(node, 'key-positions')),
    binding: splitBindings(propCells(node, 'bindings'))[0] ?? '&none',
    timeout,
    layers: intList(propCells(node, 'layers')),
    extra: extraProps(node, COMBO_PROPS, text),
  };
}

function isBehavior(node) {
  const compat = propString(node, 'compatible') ?? '';
  return compat.startsWith('zmk,behavior') && node.labels.length > 0;
}

export function parseKeymap(text) {
  const root = parseDts(text);
  const keymapNode = findNodes(root, (n) => hasCompatible(n, 'zmk,keymap'))[0];
  if (!keymapNode) return null;
  const comboNode = findNodes(root, (n) => hasCompatible(n, 'zmk,combos'))[0];
  const layers = keymapNode.children.map((n) => parseLayer(n, text));
  const firstCells = keymapNode.children[0] ? propCells(keymapNode.children[0], 'bindings') : '';
  return {
    layers,
    combos: comboNode ? comboNode.children.map((n) => parseCombo(n, text)) : [],
    customBehaviors: findNodes(root, isBehavior).map((n) => ({
      label: n.labels[0],
      cells: intList(propCells(n, '#binding-cells'))[0] ?? 0,
    })),
    rowHints: bindingsPerLine(firstCells),
    source: text,
  };
}
