// Short human-readable labels for bindings, shown on the keyboard.
import { LABELS, ALIASES } from '../data/keycodes.js';
import { parseBinding } from './bindings.js';

const MOD_FN = { LS: '⇧', LC: '⌃', LA: '⌥', LG: '◆', RS: 'R⇧', RC: 'R⌃', RA: 'R⌥', RG: 'R◆' };

export function keyLabel(code = '') {
  const m = /^([LR][SCAG])\((.+)\)$/.exec(code);
  if (m && MOD_FN[m[1]]) return MOD_FN[m[1]] + keyLabel(m[2]);
  const canonical = ALIASES[code] ?? code;
  return LABELS[canonical] ?? canonical;
}

function layerLabel(param, layers) {
  return /^\d+$/.test(param ?? '') && layers[Number(param)] ? layers[Number(param)].name : (param ?? '?');
}

// Custom hold-taps read like &mt / &lt: tap on top of the hold (modifier or layer).
function customLabel(def, params, layers) {
  if (def?.kind !== 'hold-tap' || params.length < 2) return null;
  const [a, b] = params;
  const holdLabel = def.params?.[0] === 'layer' ? layerLabel(a, layers) : keyLabel(a);
  return { tap: keyLabel(b), hold: holdLabel, kind: def.params?.[0] === 'layer' ? 'layer' : 'hold' };
}

// Returns { tap, hold, kind } where kind is a CSS-friendly category.
// customBehaviors (optional) lets custom hold-taps be labelled like &mt.
export function bindingLabel(binding, layers = [], customBehaviors = []) {
  const { behavior, params } = parseBinding(binding);
  const [a, b] = params;
  const custom = customLabel(
    customBehaviors.find((c) => c.label === behavior),
    params,
    layers,
  );
  if (custom) return custom;
  switch (behavior) {
    case 'kp':
    case 'kt':
      return { tap: keyLabel(a), hold: '', kind: 'key' };
    case 'sk':
      return { tap: keyLabel(a), hold: 'sticky', kind: 'key' };
    case 'mt':
      return { tap: keyLabel(b), hold: keyLabel(a), kind: 'hold' };
    case 'lt':
      return { tap: keyLabel(b), hold: layerLabel(a, layers), kind: 'layer' };
    case 'mo':
    case 'to':
    case 'tog':
    case 'sl':
      return { tap: layerLabel(a, layers), hold: behavior, kind: 'layer' };
    case 'trans':
      return { tap: '▽', hold: '', kind: 'trans' };
    case 'none':
      return { tap: '', hold: '', kind: 'none' };
    case 'bt':
      return { tap: [a?.replace(/^BT_/, ''), b].filter(Boolean).join(' '), hold: 'bt', kind: 'system' };
    case 'out':
      return { tap: a?.replace(/^OUT_/, '') ?? '', hold: 'out', kind: 'system' };
    default:
      return { tap: params.map(keyLabel).join(' ') || behavior, hold: params.length ? behavior : '', kind: 'other' };
  }
}
