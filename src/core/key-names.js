// Words for screen readers: what a key does, then where it is ("Esc, hold Ctrl, key 12";
// ASSUMPTIONS.md #41). Names are built from the legend the key shows (bindingLabel), so every name
// starts with its visible legend and speech input ("click Esc") finds the key (#42, WCAG 2.5.3).
import { SPOKEN, LABELS } from '../data/keycodes.js';
import { behaviorDef } from '../data/behaviors.js';
import { bindingLabel, MOD_FN } from './labels.js';
import { parseBinding } from './bindings.js';

// Symbol legend → words, e.g. '⇥' → 'Tab'. SPOKEN names keep a legend's own letters ('R⇧' → 'R Shift').
const BY_LEGEND = Object.fromEntries(Object.entries(SPOKEN).map(([code, words]) => [LABELS[code], words]));
const MOD_WORDS = {
  LS: 'Shift',
  LC: 'Ctrl',
  LA: 'Alt',
  LG: 'Gui',
  RS: 'R Shift',
  RC: 'R Ctrl',
  RA: 'R Alt',
  RG: 'R Gui',
};
const BY_MOD_GLYPH = Object.entries(MOD_FN)
  .map(([fn, glyph]) => [glyph, MOD_WORDS[fn]])
  .sort((a, b) => b[0].length - a[0].length); // 'R⇧' before '⇧'

export function speak(legend = '') {
  if (BY_LEGEND[legend]) return BY_LEGEND[legend];
  const mod = BY_MOD_GLYPH.find(([glyph]) => legend.startsWith(glyph) && legend.length > glyph.length);
  return mod ? `${mod[1]}+${speak(legend.slice(mod[0].length))}` : legend;
}

const LAYER_ACTION = { to: 'switch to', tog: 'toggle', sl: 'sticky' };

// What the small hold legend means, after the main legend.
function holdWords(behavior, { hold, kind }) {
  if (kind === 'hold') return `hold ${speak(hold)}`;
  if (kind === 'layer') return `${hold} layer while held`;
  if (!hold) return '';
  if (hold === 'sticky') return 'sticky';
  return behaviorDef(behavior)?.label ?? hold;
}

// customBehaviors: as from allCustomBehaviors(), so custom hold-taps read like &mt / &lt.
export function bindingWords(binding, layers = [], customBehaviors = []) {
  const { behavior } = parseBinding(binding);
  const label = bindingLabel(binding, layers, customBehaviors);
  if (label.kind === 'trans') return 'Transparent';
  if (label.kind === 'none' || !behavior) return 'None';
  // mo/to/tog/sl show the layer as their legend: "Lower layer while held", "Raise layer, toggle".
  if (label.kind === 'layer' && label.hold === behavior)
    return behavior === 'mo' ? `${label.tap} layer while held` : `${label.tap} layer, ${LAYER_ACTION[behavior]}`;
  const parts = [speak(label.tap), holdWords(behavior, label)].filter(Boolean);
  return parts.length ? parts.join(', ') : (behaviorDef(behavior, customBehaviors)?.label ?? behavior);
}

export const keyName = (binding, layers, customBehaviors, index) =>
  `${bindingWords(binding, layers, customBehaviors)}, key ${index}`;
