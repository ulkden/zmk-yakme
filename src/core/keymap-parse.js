// Parse a ZMK .keymap file into the editor's keymap model.
import { parseDts, findNodes, getProp, propCells, propString, hasCompatible } from '../dts/parse.js';
import { evalExpr } from '../dts/expr.js';
import { splitBindings, bindingsPerLine, splitParams } from './bindings.js';
import { parseBehaviors, behaviorKind } from './behaviors-parse.js';

const LAYER_PROPS = new Set(['bindings', 'display-name', 'label']);
const COMBO_PROPS = new Set([
  'bindings',
  'key-positions',
  'timeout-ms',
  'layers',
  'require-prior-idle-ms',
  'slow-release',
]);

function extraProps(node, handled, text) {
  return node.props.filter((p) => !handled.has(p.name)).map((p) => text.slice(p.start, p.end).trim());
}

function intList(cells) {
  return splitParams(cells ?? '')
    .map(evalExpr)
    .filter((n) => !Number.isNaN(n));
}

// Key positions and combo layers may be numbers or names (e.g. #defines); names are kept as strings.
function valueList(cells) {
  return splitParams(cells ?? '').map((t) => {
    const n = evalExpr(t);
    return Number.isNaN(n) ? t : n;
  });
}

const optionalInt = (node, name) => (getProp(node, name) ? (intList(propCells(node, name))[0] ?? null) : null);

function parseLayer(node, text) {
  return {
    id: node.name,
    name: propString(node, 'display-name') ?? propString(node, 'label') ?? node.name,
    bindings: splitBindings(propCells(node, 'bindings')),
    extra: extraProps(node, LAYER_PROPS, text),
  };
}

function parseCombo(node, text) {
  return {
    name: node.name,
    keyPositions: valueList(propCells(node, 'key-positions')),
    binding: splitBindings(propCells(node, 'bindings'))[0] ?? '&none',
    timeout: optionalInt(node, 'timeout-ms'),
    layers: valueList(propCells(node, 'layers')),
    requirePriorIdle: optionalInt(node, 'require-prior-idle-ms'),
    slowRelease: !!getProp(node, 'slow-release'),
    extra: extraProps(node, COMBO_PROPS, text),
  };
}

// Behaviors that are not editable here (tap-dance, sticky variants, …): listed by label only.
function isOtherBehavior(node) {
  const compat = propString(node, 'compatible') ?? '';
  return compat.startsWith('zmk,behavior') && node.labels.length > 0 && !behaviorKind(node);
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
    behaviors: parseBehaviors(root, text),
    customBehaviors: findNodes(root, isOtherBehavior).map((n) => ({
      label: n.labels[0],
      cells: intList(propCells(n, '#binding-cells'))[0] ?? 0,
    })),
    rowHints: bindingsPerLine(firstCells),
    source: text,
  };
}
