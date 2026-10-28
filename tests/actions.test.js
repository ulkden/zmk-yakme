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
  return { store, actions: createActions(store) };
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

  test('combos mode: first key click creates a combo, later clicks toggle', () => {
    const { store, actions } = setup();
    actions.loadExample();
    actions.setMode('combos');
    assert.equal(store.get().ui.combo, null);
    actions.keyClick(5);
    assert.equal(store.get().ui.combo, 1);
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
});
