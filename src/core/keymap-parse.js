// Parse a ZMK .keymap file into the editor's keymap model.
import { parseDts, findNodes, getProp, propCells, propString, hasCompatible } from '../dts/parse.js';
import { evalExpr } from '../dts/expr.js';
import { splitBindings, bindingsPerLine, splitParams } from './bindings.js';
import { parseBehaviors, behaviorKind } from './behaviors-parse.js';
import { behaviorDef } from '../data/behaviors.js';

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

// Key positions may be numbers or names (e.g. #defines); names are kept as strings.
function positionList(cells) {
  return splitParams(cells ?? '').map((t) => {
    const n = evalExpr(t);
    return Number.isNaN(n) ? t : n;
  });
}

const optionalInt = (node, name) => (getProp(node, name) ? (intList(propCells(node, name))[0] ?? null) : null);

// Parameter counts used to split bindings: the file's own behaviors (`#binding-cells`), then the
// built-in ones. Unknown behaviors return null and take every following bare token, as before.
function arityOf(root) {
  const cells = new Map();
  for (const n of findNodes(root, (n) => n.labels.length > 0 && getProp(n, '#binding-cells')))
    n.labels.forEach((l) => cells.set(l, intList(propCells(n, '#binding-cells'))[0] ?? 0));
  return (name) => {
    if (cells.has(name)) return { min: cells.get(name), max: cells.get(name) };
    const params = behaviorDef(name)?.params;
    return params ? { min: params.filter((p) => !p.endsWith('?')).length, max: params.length } : null;
  };
}

function parseLayer(node, text, arity) {
  return {
    id: node.name,
    name: propString(node, 'display-name') ?? propString(node, 'label') ?? node.name,
    bindings: splitBindings(propCells(node, 'bindings'), arity),
    extra: extraProps(node, LAYER_PROPS, text),
  };
}

function parseCombo(node, text, arity) {
  return {
    name: node.name,
    keyPositions: positionList(propCells(node, 'key-positions')),
    binding: splitBindings(propCells(node, 'bindings'), arity)[0] ?? '&none',
    timeout: optionalInt(node, 'timeout-ms'),
    layers: intList(propCells(node, 'layers')),
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
  const arity = arityOf(root);
  const layers = keymapNode.children.map((n) => parseLayer(n, text, arity));
  const firstCells = keymapNode.children[0] ? propCells(keymapNode.children[0], 'bindings') : '';
  return {
    layers,
    combos: comboNode ? comboNode.children.map((n) => parseCombo(n, text, arity)) : [],
    behaviors: parseBehaviors(root, text),
    customBehaviors: findNodes(root, isOtherBehavior).map((n) => ({
      label: n.labels[0],
      cells: intList(propCells(n, '#binding-cells'))[0] ?? 0,
    })),
    rowHints: bindingsPerLine(firstCells, arity),
    source: text,
  };
}
