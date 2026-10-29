// Operations on editable custom behaviors. Every function returns a new keymap.
import { parseBinding, formatBinding } from './bindings.js';
import { sanitizeId } from './keymap-write.js';
import { countRefs, rewriteRefs } from './source-refs.js';

const DEFAULTS = {
  'hold-tap': {
    label: 'ht',
    bindings: ['&kp', '&kp'],
    flavor: 'balanced',
    tappingTerm: 200,
    quickTap: null,
    priorIdle: null,
  },
  'mod-morph': { label: 'mm', bindings: ['&kp COMMA', '&kp SEMI'], mods: ['MOD_LSFT', 'MOD_RSFT'], keepMods: [] },
  macro: { label: 'macro', bindings: ['&macro_tap', '&kp A'], waitMs: null, tapMs: null },
};

export const FLAVORS = ['balanced', 'hold-preferred', 'tap-preferred', 'tap-unless-interrupted'];
export const MOD_FLAGS = [
  'MOD_LSFT',
  'MOD_LCTL',
  'MOD_LALT',
  'MOD_LGUI',
  'MOD_RSFT',
  'MOD_RCTL',
  'MOD_RALT',
  'MOD_RGUI',
];

const behaviors = (km) => km.behaviors ?? [];

function takenLabels(km) {
  return new Set([...behaviors(km).map((b) => b.label), ...(km.customBehaviors ?? []).map((b) => b.label)]);
}

function uniqueLabel(km, base, except = null) {
  const taken = takenLabels(km);
  taken.delete(except);
  let label = base;
  for (let n = 2; taken.has(label); n++) label = `${base}_${n}`;
  return label;
}

const cellsOf = (km, label) => (behaviors(km).find((b) => b.label === label)?.kind === 'hold-tap' ? 2 : 0);

// Replace `&from` with `&to` (or the whole binding with `&none` when to is null) everywhere,
// including unknown properties (`extra`) and the parts of an imported file kept verbatim.
export function renameBehaviorRefs(km, from, to) {
  const fix = (b) => {
    const { behavior, params } = parseBinding(b);
    if (behavior !== from) return b;
    return to === null ? '&none' : formatBinding(to, params);
  };
  const cells = cellsOf(km, from);
  const fixExtra = (item) => ({ ...item, extra: (item.extra ?? []).map((e) => rewriteRefs(e, from, to, cells)) });
  return {
    ...km,
    layers: km.layers.map((l) => fixExtra({ ...l, bindings: l.bindings.map(fix) })),
    combos: km.combos.map((c) => fixExtra({ ...c, binding: fix(c.binding) })),
    behaviors: behaviors(km).map((b) => fixExtra({ ...b, bindings: b.bindings.map(fix) })),
    ...(km.source ? { source: rewriteRefs(km.source, from, to, cells, true) } : {}),
  };
}

export function countBehaviorUses(km, label) {
  const all = [
    ...km.layers.flatMap((l) => l.bindings),
    ...km.combos.map((c) => c.binding),
    ...behaviors(km).flatMap((b) => b.bindings),
  ];
  const extras = [...km.layers, ...km.combos, ...behaviors(km)].flatMap((x) => x.extra ?? []);
  return (
    all.filter((b) => parseBinding(b).behavior === label).length +
    extras.reduce((n, e) => n + countRefs(e, label), 0) +
    countRefs(km.source, label, true)
  );
}

export function addBehavior(km, kind) {
  const d = DEFAULTS[kind];
  const label = uniqueLabel(km, d.label);
  const b = { kind, displayName: null, extra: [], origLabel: null, orig: null, ...d, label, name: label };
  return { ...km, behaviors: [...behaviors(km), b] };
}

export function updateBehavior(km, idx, patch) {
  const current = behaviors(km)[idx];
  if (!current) return km;
  let next = { ...current, ...patch };
  let out = km;
  if (patch.label !== undefined && patch.label !== current.label) {
    const label = uniqueLabel(km, sanitizeId(patch.label, 'behavior'), current.label);
    next = { ...next, label, name: label };
    out = renameBehaviorRefs(km, current.label, label);
  }
  // Take bindings from `out` so a self-reference renamed above is kept.
  return {
    ...out,
    behaviors: behaviors(out).map((b, i) => (i === idx ? { ...next, bindings: patch.bindings ?? b.bindings } : b)),
  };
}

export function removeBehavior(km, idx) {
  const b = behaviors(km)[idx];
  if (!b) return km;
  const cleared = renameBehaviorRefs(km, b.label, null);
  return { ...cleared, behaviors: behaviors(cleared).filter((_, i) => i !== idx) };
}

// Parameter types for the binding editor, inferred from what the behavior wraps.
function paramTypes(b) {
  if (b.kind !== 'hold-tap') return [];
  return b.bindings
    .slice(0, 2)
    .map((x) => (['&mo', '&to', '&tog', '&sl'].includes(x.trim()) ? 'layer' : x.trim() === '&kp' ? 'keycode' : 'raw'));
}

// Custom behaviors for pickers: editable ones first, then any others found in the file.
export function allCustomBehaviors(km) {
  if (!km) return [];
  return [
    ...behaviors(km).map((b) => ({
      label: b.label,
      cells: b.kind === 'hold-tap' ? 2 : 0,
      params: paramTypes(b),
      kind: b.kind,
    })),
    ...(km.customBehaviors ?? []),
  ];
}
