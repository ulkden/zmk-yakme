// Words for screen readers: what a key does, then where it is ("Esc, hold Ctrl, key 12";
// ASSUMPTIONS.md #41). Symbols on the keycaps (⇥, ⇧, ⏯) are read as words.
import { SPOKEN, LABELS, ALIASES } from '../data/keycodes.js';
import { behaviorDef } from '../data/behaviors.js';
import { parseBinding } from './bindings.js';

const MOD_WORDS = {
  LS: 'Shift',
  LC: 'Ctrl',
  LA: 'Alt',
  LG: 'Gui',
  RS: 'Right Shift',
  RC: 'Right Ctrl',
  RA: 'Right Alt',
  RG: 'Right Gui',
};

// Underscores are spelled out by screen readers ("B T underscore S E L"), so they become spaces.
const words = (text) => String(text).replace(/_/g, ' ');

export function spokenKey(code = '') {
  const m = /^([LR][SCAG])\((.+)\)$/.exec(code);
  if (m && MOD_WORDS[m[1]]) return `${MOD_WORDS[m[1]]}+${spokenKey(m[2])}`;
  const canonical = ALIASES[code] ?? code;
  return SPOKEN[canonical] ?? LABELS[canonical] ?? words(canonical);
}

function layerName(param, layers) {
  const layer = /^\d+$/.test(param ?? '') ? layers[Number(param)] : null;
  return layer ? layer.name : words(param ?? '?');
}

// Hold-taps (built-in or custom) read as "tap, hold modifier" or "tap, layer while held".
function holdTap(holdIsLayer, hold, tap, layers) {
  return holdIsLayer
    ? `${spokenKey(tap)}, ${layerName(hold, layers)} layer while held`
    : `${spokenKey(tap)}, hold ${spokenKey(hold)}`;
}

// customBehaviors: as from allCustomBehaviors(), so custom hold-taps read like &mt / &lt.
export function bindingWords(binding, layers = [], customBehaviors = []) {
  const { behavior, params } = parseBinding(binding);
  const [a, b] = params;
  const custom = customBehaviors.find((c) => c.label === behavior);
  if (custom?.kind === 'hold-tap' && params.length >= 2) return holdTap(custom.params?.[0] === 'layer', a, b, layers);
  switch (behavior) {
    case 'kp':
      return spokenKey(a);
    case 'kt':
      return `${spokenKey(a)}, toggle`;
    case 'sk':
      return `Sticky ${spokenKey(a)}`;
    case 'mt':
      return holdTap(false, a, b, layers);
    case 'lt':
      return holdTap(true, a, b, layers);
    case 'mo':
      return `${layerName(a, layers)} layer while held`;
    case 'to':
      return `To ${layerName(a, layers)} layer`;
    case 'tog':
      return `Toggle ${layerName(a, layers)} layer`;
    case 'sl':
      return `Sticky ${layerName(a, layers)} layer`;
    case 'trans':
      return 'Transparent';
    case 'none':
    case '':
      return 'None';
    default: {
      const label = behaviorDef(behavior, customBehaviors)?.label.replace(/ \(custom\)$/, '') ?? behavior;
      return words([label, ...params].join(' '));
    }
  }
}

export const keyName = (binding, layers, customBehaviors, index) =>
  `${bindingWords(binding, layers, customBehaviors)}, key ${index}`;
