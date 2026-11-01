// Non-blocking warnings about the current document: [{ text, fix? }].
// `fix` names an action the UI can offer (e.g. 'trim').
import { activeLayout, keyCount } from './state.js';

// A bare macro call (e.g. `HRML(A, S, D, F)`) can stand for several keys, so the layer may not
// line up. Plain names (`U_NA`) are taken as one key each.
const macroCalls = (layer) => [
  ...new Set(layer.bindings.filter((b) => !b.startsWith('&') && b.includes('(')).map((b) => b.split('(')[0] + '(…)')),
];

function layerWarnings(km, keys, hasLayout) {
  const out = [];
  km.layers.forEach((layer, i) => {
    const n = layer.bindings.length;
    const calls = macroCalls(layer);
    if (calls.length)
      out.push({
        text: `Layer "${layer.name}" uses macro calls (${calls.join(', ')}) that can stand for several keys, so its keys may not line up. Edit this layer in your file instead.`,
      });
    if (hasLayout && n < keys)
      out.push({
        text: `Layer "${layer.name}" has ${n} bindings for ${keys} keys; the rest export as ${i === 0 ? '&none' : '&trans'}.`,
      });
    if (hasLayout && n > keys)
      out.push({
        text: `Layer "${layer.name}" has ${n - keys} binding(s) beyond the ${keys} physical keys.`,
        fix: 'trim',
      });
  });
  return out;
}

function comboWarnings(km, keys) {
  const out = [];
  km.combos.forEach((c) => {
    const numeric = c.keyPositions.filter((p) => typeof p === 'number');
    const symbolic = c.keyPositions.filter((p) => typeof p !== 'number');
    if (c.keyPositions.length < 2) out.push({ text: `Combo "${c.name}" needs at least 2 keys.` });
    const bad = numeric.filter((p) => p >= keys);
    if (bad.length) out.push({ text: `Combo "${c.name}" uses key position(s) ${bad.join(', ')} outside the layout.` });
    if (symbolic.length)
      out.push({
        text: `Combo "${c.name}" uses named position(s) ${symbolic.join(', ')} that can't be shown on the keyboard.`,
      });
    const badLayers = c.layers.filter((l) => l >= km.layers.length);
    if (badLayers.length) out.push({ text: `Combo "${c.name}" refers to missing layer(s) ${badLayers.join(', ')}.` });
  });
  return out;
}

export function validate(state) {
  const km = state.keymap;
  if (!km) return [];
  const keys = keyCount(state);
  return [...layerWarnings(km, keys, !!activeLayout(state)), ...comboWarnings(km, keys)];
}
