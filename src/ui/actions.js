// User intents mapped to store updates. Components call these instead of the store.
import * as ops from '../core/keymap-ops.js';
import { applyKeycode } from '../core/binding-edit.js';
import { applyImport } from '../core/import.js';
import { gridLayout } from '../core/layout-ops.js';
import { keyCount, initialState } from '../core/state.js';
import { exampleState } from '../data/example.js';

export function createActions(store) {
  const get = store.get;
  const setUi = (patch) =>
    store.update((s) => (Object.keys(patch).every((k) => s.ui[k] === patch[k]) ? s : { ...s, ui: { ...s.ui, ...patch } }), {
      history: false,
    });
  const editKeymap = (fn) => store.update((s) => (s.keymap ? { ...s, keymap: fn(s.keymap, s) } : s));

  const actions = {
    undo: () => store.undo(),
    redo: () => store.redo(),
    setMode: (mode) => setUi({ mode }),
    selectLayer: (layer) => setUi({ layer, mode: 'layers' }),
    selectKey: (key) => setUi({ key }),
    selectCombo: (combo) => setUi({ combo, mode: 'combos' }),
    setAdvance: (advance) => setUi({ advance }),
    selectLayout: (layoutIndex) => store.update((s) => ({ ...s, layoutIndex })),

    keyClick(pos) {
      const { ui } = get();
      if (ui.mode !== 'combos') return actions.selectKey(ui.key === pos ? null : pos);
      if (ui.combo === null) {
        editKeymap((km) => ops.addCombo(km, [pos]));
        return setUi({ combo: get().keymap.combos.length - 1 });
      }
      editKeymap((km) => ops.toggleComboKey(km, ui.combo, pos));
    },

    setKeyBinding(binding) {
      const { ui } = get();
      if (ui.key === null) return;
      editKeymap((km) => ops.setBinding(km, ui.layer, ui.key, binding));
    },

    // Palette click: fill the keycode of the selected key or combo.
    pickKeycode(code) {
      const s = get();
      const custom = s.keymap?.customBehaviors ?? [];
      if (s.ui.mode === 'combos' && s.ui.combo !== null) {
        const combo = s.keymap.combos[s.ui.combo];
        return actions.updateCombo({ binding: applyKeycode(combo.binding, code, custom) });
      }
      if (s.ui.key === null) return;
      const current = s.keymap.layers[s.ui.layer]?.bindings[s.ui.key] ?? '&none';
      actions.setKeyBinding(applyKeycode(current, code, custom));
      if (s.ui.advance) actions.selectKey(Math.min(s.ui.key + 1, keyCount(get()) - 1));
    },

    addLayer() {
      editKeymap((km, s) => ops.addLayer(km, keyCount(s)));
      actions.selectLayer(get().keymap.layers.length - 1);
    },
    renameLayer: (idx, name) => editKeymap((km) => ops.renameLayer(km, idx, name)),
    removeLayer(idx) {
      editKeymap((km) => ops.removeLayer(km, idx));
      setUi({ layer: Math.max(0, idx - 1) });
    },
    moveLayer(idx, delta) {
      const to = idx + delta;
      if (to < 0 || to >= get().keymap.layers.length) return;
      editKeymap((km) => ops.moveLayer(km, idx, to));
      setUi({ layer: to });
    },

    addCombo() {
      editKeymap((km) => ops.addCombo(km));
      actions.selectCombo(get().keymap.combos.length - 1);
    },
    updateCombo(patch) {
      const idx = get().ui.combo;
      if (idx !== null) editKeymap((km) => ops.updateCombo(km, idx, patch));
    },
    removeCombo() {
      const idx = get().ui.combo;
      if (idx === null) return;
      editKeymap((km) => ops.removeCombo(km, idx));
      setUi({ combo: null });
    },

    importResult(result, fileName) {
      store.update((s) => {
        const next = applyImport(s, result);
        return result.keymap && fileName ? { ...next, fileName } : next;
      });
    },
    newKeymap(rows, layerCount, keepLayout) {
      store.update((s) => {
        const layouts = keepLayout && s.layouts.length ? s.layouts : [gridLayout(rows)];
        const base = { ...initialState(), ui: { ...initialState().ui, advance: s.ui.advance }, layouts };
        let km = ops.emptyKeymap(keyCount(base));
        for (let i = 1; i < layerCount; i++) km = ops.addLayer(km, keyCount(base));
        return { ...base, keymap: km };
      });
    },
    loadExample: () => store.update(() => exampleState()),
  };
  return actions;
}
