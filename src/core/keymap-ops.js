// Pure operations on the keymap model. Every function returns a new keymap.
import { parseBinding, formatBinding } from './bindings.js';
import { sanitizeId, layerIds } from './keymap-write.js';

export const LAYER_BEHAVIORS = new Set(['mo', 'lt', 'to', 'tog', 'sl']);

export function emptyKeymap(keyCount, name = 'Base') {
  return {
    layers: [{ id: 'default_layer', name, bindings: Array(keyCount).fill('&none'), extra: [] }],
    combos: [],
    customBehaviors: [],
    rowHints: [],
    source: null,
  };
}

const withLayers = (km, layers) => ({ ...km, layers });
const withCombos = (km, combos) => ({ ...km, combos });

export function setBinding(km, layerIdx, pos, binding) {
  const layers = km.layers.map((layer, i) => {
    if (i !== layerIdx) return layer;
    const filler = i === 0 ? '&none' : '&trans';
    const bindings = [...layer.bindings];
    while (bindings.length <= pos) bindings.push(filler);
    bindings[pos] = binding;
    return { ...layer, bindings };
  });
  return withLayers(km, layers);
}

export function addLayer(km, keyCount, name) {
  const layer = { name: name ?? `Layer ${km.layers.length}`, bindings: Array(keyCount).fill('&trans'), extra: [] };
  return withLayers(km, [...km.layers, layer]);
}

export function renameLayer(km, idx, name) {
  return withLayers(km, km.layers.map((l, i) => (i === idx ? { ...l, name } : l)));
}

// Set a layer's devicetree node name: sanitized, and made unique among the other layers.
export function setLayerId(km, idx, raw) {
  const others = new Set(layerIds(km.layers).filter((_, i) => i !== idx));
  const base = sanitizeId(raw, 'layer');
  let id = base;
  for (let n = 2; others.has(id); n++) id = `${base}_${n}`;
  return withLayers(km, km.layers.map((l, i) => (i === idx ? { ...l, id } : l)));
}

// Rewrite numeric layer references; mapIdx(old) returns the new index or null (removed).
export function remapLayerRefs(km, mapIdx) {
  const remapBinding = (b) => {
    const { behavior, params } = parseBinding(b);
    if (!LAYER_BEHAVIORS.has(behavior) || !/^\d+$/.test(params[0] ?? '')) return b;
    const next = mapIdx(Number(params[0]));
    return next === null ? '&trans' : formatBinding(behavior, [String(next), ...params.slice(1)]);
  };
  return {
    ...km,
    layers: km.layers.map((l) => ({ ...l, bindings: l.bindings.map(remapBinding) })),
    combos: km.combos.map((c) => ({
      ...c,
      binding: remapBinding(c.binding),
      layers: c.layers.map(mapIdx).filter((n) => n !== null),
    })),
  };
}

// Drop bindings beyond the layout's key count.
export function trimLayers(km, keyCount) {
  return withLayers(km, km.layers.map((l) => (l.bindings.length > keyCount ? { ...l, bindings: l.bindings.slice(0, keyCount) } : l)));
}

// Non-numeric layer params (e.g. `&mo NAV`) that renumbering cannot update.
export function symbolicLayerRefs(km) {
  const found = new Set();
  const check = (b) => {
    const { behavior, params } = parseBinding(b);
    if (LAYER_BEHAVIORS.has(behavior) && params[0] && !/^\d+$/.test(params[0])) found.add(params[0]);
  };
  km.layers.forEach((l) => l.bindings.forEach(check));
  km.combos.forEach((c) => check(c.binding));
  return [...found];
}

export function removeLayer(km, idx) {
  if (km.layers.length <= 1) return km;
  const remapped = remapLayerRefs(km, (i) => (i === idx ? null : i > idx ? i - 1 : i));
  return withLayers(remapped, remapped.layers.filter((_, i) => i !== idx));
}

export function moveLayer(km, from, to) {
  if (to < 0 || to >= km.layers.length || from === to) return km;
  const order = km.layers.map((_, i) => i);
  order.splice(to, 0, order.splice(from, 1)[0]);
  const remapped = remapLayerRefs(km, (i) => order.indexOf(i));
  return withLayers(remapped, order.map((i) => remapped.layers[i]));
}

function uniqueComboName(km) {
  const names = new Set(km.combos.map((c) => c.name));
  let n = km.combos.length + 1;
  while (names.has(`combo_${n}`)) n++;
  return `combo_${n}`;
}

export function addCombo(km, keyPositions = []) {
  const combo = { name: uniqueComboName(km), keyPositions: [...keyPositions], binding: '&none', timeout: null, layers: [], extra: [] };
  return withCombos(km, [...km.combos, combo]);
}

export function updateCombo(km, idx, patch) {
  return withCombos(km, km.combos.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
}

export function removeCombo(km, idx) {
  return withCombos(km, km.combos.filter((_, i) => i !== idx));
}

export function toggleComboKey(km, idx, pos) {
  const combo = km.combos[idx];
  if (!combo) return km;
  const has = combo.keyPositions.includes(pos);
  const keyPositions = has ? combo.keyPositions.filter((p) => p !== pos) : [...combo.keyPositions, pos].sort((a, b) => a - b);
  return updateCombo(km, idx, { keyPositions });
}
