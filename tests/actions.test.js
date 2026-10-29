import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/core/store.js';
import { initialState, normalizeUi } from '../src/core/state.js';
import { createActions } from '../src/ui/actions.js';
import { importText } from '../src/core/import.js';
import { exportKeymap } from '../src/core/export.js';
import { parseKeymap } from '../src/core/keymap-parse.js';
import { ELVN_KEYMAP, ELVN_LAYOUT } from './fixtures/elvn.js';

function setup() {
  const store = createStore(initialState(), { normalize: normalizeUi });
  const prefs = {};
  const notes = [];
  const cleared = [];
  const actions = createActions(store, {
    savePref: (k, v) => (prefs[k] = v),
    notify: (m) => notes.push(m),
    clearStorage: (opts) => cleared.push(opts),
  });
  return { store, actions, prefs, notes, cleared };
}

describe('actions (UI flows without DOM)', () => {
  test('import layout + keymap, edit a key via palette, export', () => {
    const { store, actions } = setup();
    actions.importResult(importText(ELVN_KEYMAP), 'elvn.keymap');
    actions.importResult(importText(ELVN_LAYOUT), 'elvn-layouts.dtsi');
    assert.equal(store.get().layouts[0].name, 'Default Layout');
    actions.keyClick(1);
    assert.equal(store.get().ui.key, 1);
    actions.pickKeycode('ESC');
    assert.equal(store.get().keymap.layers[0].bindings[1], '&kp ESC');
    const out = exportKeymap(store.get());
    assert.equal(parseKeymap(out).layers[0].bindings[1], '&kp ESC');
    assert.equal(store.get().fileName, 'elvn.keymap');
  });

  test('clicking the selected key deselects it; advance moves selection', () => {
    const { store, actions } = setup();
    actions.loadExample();
    actions.keyClick(3);
    actions.keyClick(3);
    assert.equal(store.get().ui.key, null);
    actions.setAdvance(true);
    actions.keyClick(0);
    actions.pickKeycode('Z');
    assert.equal(store.get().ui.key, 1);
  });

  test('finishing a combo deselects it; finishing a behavior returns to the last key', () => {
    const { store, actions } = setup();
    actions.loadExample();
    actions.keyClick(7);
    actions.selectCombo(0);
    actions.finishCombo();
    assert.deepEqual([store.get().ui.mode, store.get().ui.combo], ['combos', null]);
    actions.addBehavior('hold-tap');
    assert.equal(store.get().ui.mode, 'behaviors');
    const undoable = store.canUndo();
    actions.finishBehavior();
    assert.deepEqual([store.get().ui.mode, store.get().ui.key], ['layers', 7]);
    assert.equal(store.canUndo(), undoable);
  });

  test('a key click in the Behaviors tab switches to editing that key', () => {
    const { store, actions } = setup();
    actions.loadExample();
    actions.setMode('behaviors');
    actions.keyClick(4);
    assert.deepEqual([store.get().ui.mode, store.get().ui.key], ['layers', 4]);
  });

  test('palette fills the tap key of mod-tap', () => {
    const { store, actions } = setup();
    actions.loadExample();
    actions.keyClick(12);
    actions.pickKeycode('A');
    assert.equal(store.get().keymap.layers[0].bindings[12], '&mt LCTRL A');
  });

  test('layer add / move / remove keep selection valid', () => {
    const { store, actions } = setup();
    actions.loadExample();
    actions.addLayer();
    assert.equal(store.get().ui.layer, 3);
    assert.equal(store.get().keymap.layers[3].bindings.length, 42);
    actions.moveLayer(3, -1);
    assert.equal(store.get().ui.layer, 2);
    assert.equal(store.get().keymap.layers[3].name, 'Raise');
    assert.equal(store.get().keymap.layers[0].bindings[40], '&mo 3');
    actions.removeLayer(2);
    assert.equal(store.get().keymap.layers.length, 3);
    assert.equal(store.get().ui.layer, 1);
    assert.equal(store.get().keymap.layers[0].bindings[40], '&mo 2');
  });

  test('combos mode: keys only toggle after "+ New combo"', () => {
    const { store, actions } = setup();
    actions.loadExample();
    actions.setMode('combos');
    actions.keyClick(5);
    assert.equal(store.get().ui.combo, null);
    assert.equal(store.get().keymap.combos.length, 1);
    actions.addCombo();
    assert.equal(store.get().ui.combo, 1);
    actions.keyClick(5);
    actions.keyClick(6);
    actions.pickKeycode('TAB');
    const combo = store.get().keymap.combos[1];
    assert.deepEqual(combo.keyPositions, [5, 6]);
    assert.equal(combo.binding, '&kp TAB');
    actions.removeCombo();
    assert.equal(store.get().keymap.combos.length, 1);
    assert.equal(store.get().ui.combo, null);
  });

  test('undo/redo restores edits and clamps UI', () => {
    const { store, actions } = setup();
    actions.loadExample();
    actions.addLayer();
    assert.equal(store.get().ui.layer, 3);
    actions.undo();
    assert.equal(store.get().keymap.layers.length, 3);
    assert.equal(store.get().ui.layer, 2);
    actions.redo();
    assert.equal(store.get().keymap.layers.length, 4);
  });

  test('newKeymap builds a grid or reuses the current layout', () => {
    const { store, actions } = setup();
    actions.newKeymap([3, 2], 2, false);
    assert.equal(store.get().layouts[0].keys.length, 5);
    assert.equal(store.get().keymap.layers.length, 2);
    actions.importResult(importText(ELVN_LAYOUT));
    actions.newKeymap([], 1, true);
    assert.equal(store.get().layouts[0].name, 'Default Layout');
    assert.deepEqual(store.get().keymap.layers[0].bindings, ['&none', '&none', '&none', '&none']);
  });

  test('auto-advance preference is saved', () => {
    const { store, actions, prefs } = setup();
    actions.setAdvance(true);
    assert.equal(store.get().ui.advance, true);
    assert.deepEqual(prefs, { advance: true });
  });

  test('trimExtraBindings drops bindings beyond the layout', () => {
    const { store, actions } = setup();
    actions.importResult(importText(ELVN_KEYMAP));
    actions.importResult(importText(ELVN_LAYOUT));
    actions.trimExtraBindings();
    assert.equal(store.get().keymap.layers[0].bindings.length, 4);
    actions.undo();
    assert.equal(store.get().keymap.layers[0].bindings.length, 11);
  });

  test('moving layers warns when named layer references exist', () => {
    const { actions, notes } = setup();
    actions.loadExample();
    actions.moveLayer(1, 1);
    assert.equal(notes.length, 0);
    actions.selectKey(0);
    actions.setKeyBinding('&mo NAV');
    actions.moveLayer(2, -1);
    assert.match(notes[0], /NAV/);
  });

  test('imports and exports track unexported changes', () => {
    const { store, actions } = setup();
    actions.loadExample();
    assert.equal(store.get().keymap, store.get().cleanKeymap);
    actions.selectKey(0);
    actions.pickKeycode('Q');
    assert.notEqual(store.get().keymap, store.get().cleanKeymap);
    actions.markClean();
    assert.equal(store.get().keymap, store.get().cleanKeymap);
  });

  test('file name can be set', () => {
    const { store, actions } = setup();
    actions.setFileName('mine.keymap');
    assert.equal(store.get().fileName, 'mine.keymap');
  });

  test('closeKeymap returns to a fresh state without undo history', () => {
    const { store, actions, cleared } = setup();
    actions.loadExample();
    actions.setAdvance(true);
    actions.selectKey(0);
    actions.pickKeycode('Q');
    actions.setFileName('mine.keymap');
    actions.closeKeymap();
    const s = store.get();
    assert.equal(s.keymap, null);
    assert.deepEqual(s.layouts, []);
    assert.equal(s.fileName, undefined);
    assert.equal(s.ui.advance, true);
    assert.ok(!store.canUndo());
    assert.deepEqual(cleared, [{ resetPrefs: false }]);
  });

  test('closeKeymap can also reset preferences', () => {
    const { store, actions, cleared } = setup();
    actions.loadExample();
    actions.setAdvance(true);
    actions.setDiagrams(false);
    actions.closeKeymap({ resetPrefs: true });
    assert.equal(store.get().ui.advance, undefined);
    assert.equal(store.get().ui.diagrams, true);
    assert.deepEqual(cleared, [{ resetPrefs: true }]);
  });
});
