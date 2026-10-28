// Non-blocking warnings about the current document.
import { activeLayout, keyCount } from './state.js';

export function validate(state) {
  const warnings = [];
  const km = state.keymap;
  if (!km) return warnings;
  const keys = keyCount(state);
  const hasLayout = !!activeLayout(state);
  km.layers.forEach((layer, i) => {
    const n = layer.bindings.length;
    if (hasLayout && n < keys) warnings.push(`Layer "${layer.name}" has ${n} bindings for ${keys} keys; the rest export as ${i === 0 ? '&none' : '&trans'}.`);
    if (hasLayout && n > keys) warnings.push(`Layer "${layer.name}" has ${n - keys} binding(s) beyond the ${keys} physical keys.`);
  });
  km.combos.forEach((c) => {
    if (c.keyPositions.length < 2) warnings.push(`Combo "${c.name}" needs at least 2 keys.`);
    const bad = c.keyPositions.filter((p) => p >= keys);
    if (bad.length) warnings.push(`Combo "${c.name}" uses key position(s) ${bad.join(', ')} outside the layout.`);
    const badLayers = c.layers.filter((l) => l >= km.layers.length);
    if (badLayers.length) warnings.push(`Combo "${c.name}" refers to missing layer(s) ${badLayers.join(', ')}.`);
  });
  return warnings;
}
