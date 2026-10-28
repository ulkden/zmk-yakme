// Editable custom behaviors (hold-tap, mod-morph, macro) read from devicetree.
import { findNodes, getProp, propCells, propString } from '../dts/parse.js';
import { evalExpr } from '../dts/expr.js';
import { splitBindings, splitParams } from './bindings.js';

export const KINDS = {
  'zmk,behavior-hold-tap': 'hold-tap',
  'zmk,behavior-mod-morph': 'mod-morph',
  'zmk,behavior-macro': 'macro',
};

const HANDLED = {
  'hold-tap': ['flavor', 'tapping-term-ms', 'quick-tap-ms', 'require-prior-idle-ms'],
  'mod-morph': ['mods', 'keep-mods'],
  macro: ['wait-ms', 'tap-ms'],
};
const COMMON = ['compatible', '#binding-cells', 'bindings', 'display-name'];

const optionalInt = (node, name) => {
  if (!getProp(node, name)) return null;
  const n = evalExpr(splitParams(propCells(node, name))[0] ?? '');
  return Number.isNaN(n) ? null : n;
};

export const modList = (cells) => [...String(cells ?? '').matchAll(/MOD_[LR](SFT|CTL|ALT|GUI)/g)].map((m) => m[0]);

// Everything except bookkeeping fields; used to detect edits since import.
export function fingerprint(b) {
  const { orig, origLabel, ...rest } = b;
  return JSON.stringify(rest);
}

function kindFields(kind, node) {
  if (kind === 'hold-tap') {
    return {
      flavor: propString(node, 'flavor') ?? null,
      tappingTerm: optionalInt(node, 'tapping-term-ms'),
      quickTap: optionalInt(node, 'quick-tap-ms'),
      priorIdle: optionalInt(node, 'require-prior-idle-ms'),
    };
  }
  if (kind === 'mod-morph') return { mods: modList(propCells(node, 'mods')), keepMods: modList(propCells(node, 'keep-mods')) };
  return { waitMs: optionalInt(node, 'wait-ms'), tapMs: optionalInt(node, 'tap-ms') };
}

export function behaviorKind(node) {
  const compat = propString(node, 'compatible');
  return node.labels.length ? KINDS[compat] ?? null : null;
}

function parseBehavior(node, text) {
  const kind = behaviorKind(node);
  const handled = new Set([...COMMON, ...HANDLED[kind]]);
  const b = {
    kind,
    label: node.labels[0],
    name: node.name,
    displayName: propString(node, 'display-name') ?? null,
    bindings: splitBindings(propCells(node, 'bindings')),
    ...kindFields(kind, node),
    extra: node.props.filter((p) => !handled.has(p.name)).map((p) => text.slice(p.start, p.end).trim()),
  };
  return { ...b, origLabel: b.label, orig: fingerprint(b) };
}

export function parseBehaviors(root, text) {
  return findNodes(root, behaviorKind).map((n) => parseBehavior(n, text));
}
