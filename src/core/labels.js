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
  return /^\d+$/.test(param ?? '') && layers[Number(param)] ? layers[Number(param)].name : param ?? '?';
}

// Returns { tap, hold, kind } where kind is a CSS-friendly category.
export function bindingLabel(binding, layers = []) {
  const { behavior, params } = parseBinding(binding);
  const [a, b] = params;
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
