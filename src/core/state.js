// Application state shape, derived values and persistence helpers.

import { APP_ID, FORMAT_VERSION, upgrade } from './project-format.js';

export { APP_ID };

export function initialState() {
  return {
    layouts: [],
    layoutIndex: 0,
    keymap: null,
    ui: { mode: 'layers', layer: 0, key: null, combo: null, behavior: null, diagrams: true },
  };
}

export function activeLayout(state) {
  return state.layouts[state.layoutIndex] ?? state.layouts[0] ?? null;
}

// True when the keymap has changes that were not exported or saved as a project.
export function isDirty(state) {
  return !!state.keymap && state.keymap !== state.cleanKeymap;
}

export function keyCount(state) {
  const layout = activeLayout(state);
  if (layout) return layout.keys.length;
  return Math.max(0, ...(state.keymap?.layers ?? []).map((l) => l.bindings.length));
}

// Clamp UI selections after undo/import so they always point at something valid.
export function normalizeUi(state) {
  const layers = state.keymap?.layers.length ?? 0;
  const combos = state.keymap?.combos.length ?? 0;
  const behaviors = state.keymap?.behaviors?.length ?? 0;
  const keys = keyCount(state);
  const ui = { ...state.ui };
  ui.layer = Math.min(Math.max(0, ui.layer), Math.max(0, layers - 1));
  if (ui.key !== null && ui.key >= keys) ui.key = null;
  if (ui.combo !== null && ui.combo >= combos) ui.combo = null;
  if (ui.behavior != null && ui.behavior >= behaviors) ui.behavior = null;
  const same = Object.keys(ui).every((k) => ui[k] === state.ui[k]);
  return same ? state : { ...state, ui };
}

export function serialize(state) {
  return JSON.stringify({
    app: APP_ID,
    version: FORMAT_VERSION,
    layouts: state.layouts,
    layoutIndex: state.layoutIndex,
    keymap: state.keymap,
    fileName: state.fileName ?? null,
  });
}

// Parse and upgrade a saved document. Returns { state } or { kind, error } (see upgrade()).
export function readProject(json) {
  let data;
  try {
    data = typeof json === 'string' ? JSON.parse(json) : json;
  } catch {
    return { kind: 'not-project', error: 'Not valid JSON' };
  }
  const result = upgrade(data);
  if (!result.doc) return result;
  const { doc } = result;
  const layoutIndex = Number.isInteger(doc.layoutIndex) ? doc.layoutIndex : 0;
  return {
    state: {
      ...initialState(),
      layouts: doc.layouts,
      layoutIndex,
      keymap: doc.keymap ?? null,
      fileName: doc.fileName ?? null,
    },
  };
}

export function deserialize(json) {
  return readProject(json).state ?? null;
}
