// User intents mapped to store updates. Components call these instead of the store.
import * as ops from '../core/keymap-ops.js';
import * as bops from '../core/behavior-ops.js';
import { applyKeycode } from '../core/binding-edit.js';
import { applyImport } from '../core/import.js';
import { gridLayout } from '../core/layout-ops.js';
import { keyCount, initialState } from '../core/state.js';
import { exampleState } from '../data/example.js';
import { layerIds } from '../core/keymap-write.js';

// options: { savePref(name, value), notify(message, kind) } for browser-only side effects.
export function createActions(store, { savePref = () => {}, notify = () => {} } = {}) {
  const get = store.get;
  const setUi = (patch) =>
    store.update((s) => (Object.keys(patch).every((k) => s.ui[k] === patch[k]) ? s : { ...s, ui: { ...s.ui, ...patch } }), {
      history: false,
    });
  const editKeymap = (fn) => store.update((s) => (s.keymap ? { ...s, keymap: fn(s.keymap, s) } : s));

  const warnSymbolicRefs = () => {
    const refs = ops.symbolicLayerRefs(get().keymap);
    if (refs.length) notify(`Layer numbers changed. Check the #defines for ${refs.join(', ')}; named references aren't renumbered.`, 'warn');
  };

  const actions = {
    undo: () => store.undo(),
    redo: () => store.redo(),
    setMode: (mode) => setUi({ mode, layerMenu: false }),
    selectLayer: (layer) => setUi({ layer, mode: 'layers', ...(get().ui.layer !== layer ? { layerMenu: false } : {}) }),
    openLayerMenu: () => setUi({ layerMenu: true }),
    closeLayerMenu: () => setUi({ layerMenu: false }),
    toggleLayerMenu: () => setUi({ layerMenu: !get().ui.layerMenu }),
    // Returns the node name actually stored (sanitized and unique).
    setLayerId(idx, id) {
      editKeymap((km) => ops.setLayerId(km, idx, id));
      return layerIds(get().keymap.layers)[idx];
    },
    selectKey: (key) => setUi({ key }),
    selectCombo: (combo) => setUi({ combo, mode: 'combos' }),
    setAdvance(advance) {
      setUi({ advance });
      savePref('advance', advance);
    },
    setDiagrams(diagrams) {
      setUi({ diagrams });
      savePref('diagrams', diagrams);
    },
    setFileName: (fileName) => store.update((s) => ({ ...s, fileName }), { history: false }),
    markClean: () => store.update((s) => ({ ...s, cleanKeymap: s.keymap }), { history: false }),
    selectLayout: (layoutIndex) => store.update((s) => ({ ...s, layoutIndex })),

    keyClick(pos) {
      const { ui } = get();
      if (ui.mode === 'layers') return actions.selectKey(ui.key === pos ? null : pos);
      if (ui.mode === 'combos' && ui.combo !== null) editKeymap((km) => ops.toggleComboKey(km, ui.combo, pos));
    },

    setKeyBinding(binding) {
      const { ui } = get();
      if (ui.key === null) return;
      editKeymap((km) => ops.setBinding(km, ui.layer, ui.key, binding));
    },

    // Palette click: fill the keycode of the selected key or combo.
    pickKeycode(code) {
      const s = get();
      const custom = bops.allCustomBehaviors(s.keymap);
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
      warnSymbolicRefs();
    },
    moveLayer(idx, delta) {
      const to = idx + delta;
      if (to < 0 || to >= get().keymap.layers.length) return;
      editKeymap((km) => ops.moveLayer(km, idx, to));
      setUi({ layer: to });
      warnSymbolicRefs();
    },
    trimExtraBindings: () => editKeymap((km, s) => ops.trimLayers(km, keyCount(s))),

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

    selectBehavior: (behavior) => setUi({ behavior, mode: 'behaviors' }),
    addBehavior(kind) {
      editKeymap((km) => bops.addBehavior(km, kind));
      actions.selectBehavior(get().keymap.behaviors.length - 1);
    },
    updateBehavior(patch) {
      const idx = get().ui.behavior;
      if (idx != null) editKeymap((km) => bops.updateBehavior(km, idx, patch));
    },
    removeBehavior() {
      const idx = get().ui.behavior;
      if (idx == null) return;
      editKeymap((km) => bops.removeBehavior(km, idx));
      setUi({ behavior: null });
    },

    importResult(result, fileName) {
      store.update((s) => {
        const next = applyImport(s, result);
        const named = result.keymap && fileName ? { ...next, fileName } : next;
        return next.keymap !== s.keymap ? { ...named, cleanKeymap: named.keymap } : named;
      });
    },
    newKeymap(rows, layerCount, keepLayout) {
      store.update((s) => {
        const layouts = keepLayout && s.layouts.length ? s.layouts : [gridLayout(rows)];
        const base = { ...initialState(), ui: { ...initialState().ui, advance: s.ui.advance, diagrams: s.ui.diagrams }, layouts };
        let km = ops.emptyKeymap(keyCount(base));
        for (let i = 1; i < layerCount; i++) km = ops.addLayer(km, keyCount(base));
        return { ...base, keymap: km, cleanKeymap: km };
      });
    },
    loadExample: () =>
      store.update((s) => {
        const ex = exampleState();
        return { ...ex, ui: { ...ex.ui, advance: s.ui.advance, diagrams: s.ui.diagrams }, cleanKeymap: ex.keymap };
      }),
  };
  return actions;
}
