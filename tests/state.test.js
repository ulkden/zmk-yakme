import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { createStore } from '../src/core/store.js';
import { initialState, serialize, deserialize, normalizeUi, keyCount, isDirty } from '../src/core/state.js';
import { importText, applyImport, looseJson } from '../src/core/import.js';
import { validate } from '../src/core/validate.js';
import { ELVN_KEYMAP, ELVN_LAYOUT } from './fixtures/elvn.js';

describe('store', () => {
  test('undo/redo document changes only', () => {
    const store = createStore({ ...initialState(), keymap: { v: 1 } });
    let calls = 0;
    store.subscribe(() => calls++);
    store.update((s) => ({ ...s, keymap: { v: 2 } }));
    store.update((s) => ({ ...s, ui: { ...s.ui, layer: 3 } }));
    assert.equal(calls, 2);
    store.undo();
    assert.deepEqual(store.get().keymap, { v: 1 });
    assert.equal(store.get().ui.layer, 3);
    assert.ok(!store.canUndo());
    store.redo();
    assert.deepEqual(store.get().keymap, { v: 2 });
  });

  test('history: false skips the undo stack', () => {
    const store = createStore(initialState());
    store.update((s) => ({ ...s, keymap: {} }), { history: false });
    assert.ok(!store.canUndo());
  });
});

describe('state helpers', () => {
  test('serialize / deserialize round trip', () => {
    const s = { ...initialState(), layouts: [{ name: 'x', keys: [] }], keymap: { layers: [] } };
    const back = deserialize(serialize(s));
    assert.deepEqual(back.layouts, s.layouts);
    assert.equal(deserialize('{"nope":1}'), null);
    assert.equal(deserialize('garbage'), null);
  });

  test('isDirty compares against the last clean keymap', () => {
    const km = { layers: [] };
    assert.equal(isDirty({ keymap: null }), false);
    assert.equal(isDirty({ keymap: km, cleanKeymap: km }), false);
    assert.equal(isDirty({ keymap: km, cleanKeymap: null }), true);
  });

  test('serialize keeps the file name', () => {
    assert.equal(deserialize(serialize({ ...initialState(), fileName: 'x.keymap' })).fileName, 'x.keymap');
  });

  test('normalizeUi clamps selections', () => {
    const s = { ...initialState(), keymap: { layers: [{ bindings: ['&a'] }], combos: [] }, ui: { mode: 'layers', layer: 5, key: 9, combo: 2 } };
    assert.deepEqual(normalizeUi(s).ui, { mode: 'layers', layer: 0, key: null, combo: null });
    assert.equal(keyCount(s), 1);
  });
});

describe('import', () => {
  test('detects a keymap and infers a grid layout', () => {
    const next = applyImport(initialState(), importText(ELVN_KEYMAP));
    assert.equal(next.keymap.layers.length, 1);
    assert.equal(next.layouts[0].name, 'Inferred grid');
    assert.equal(next.layouts[0].keys.length, 11);
  });

  test('a real layout replaces the inferred one and keeps the keymap', () => {
    let s = applyImport(initialState(), importText(ELVN_KEYMAP));
    s = applyImport(s, importText(ELVN_LAYOUT));
    assert.equal(s.layouts[0].name, 'Default Layout');
    assert.equal(s.keymap.layers[0].bindings.length, 11);
  });

  test('a keymap import keeps a real layout', () => {
    let s = applyImport(initialState(), importText(ELVN_LAYOUT));
    assert.deepEqual(s.keymap.layers[0].bindings, ['&none', '&none', '&none', '&none']);
    s = applyImport(s, importText(ELVN_KEYMAP));
    assert.equal(s.layouts[0].name, 'Default Layout');
  });

  test('picks the layout whose key count matches the keymap', () => {
    const two = { layouts: [{ name: 'small', keys: [{}, {}] }, { name: 'big', keys: Array(11).fill({}) }], keymap: null, project: null, errors: [] };
    const s = applyImport(applyImport(initialState(), importText(ELVN_KEYMAP)), two);
    assert.equal(s.layoutIndex, 1);
  });

  test('reads QMK, KLE (incl. raw data) and project JSON', () => {
    assert.equal(importText('{"layouts":{"L":{"layout":[{"x":0,"y":0}]}}}').layouts[0].keys.length, 1);
    assert.equal(importText('[["Q","W"],["A"]]').layouts[0].keys.length, 3);
    assert.equal(importText('{name:"x"},\n["Q",{w:2},"W"],\n["A"]').layouts[0].keys.length, 3);
    assert.ok(importText(serialize(initialState())).project);
  });

  test('looseJson quotes bare keys', () => {
    assert.deepEqual(looseJson('[{w:1.5},"A"]'), [{ w: 1.5 }, 'A']);
  });

  test('reports unrecognized input', () => {
    assert.equal(importText('hello').errors.length, 1);
    assert.equal(importText('{bad json').errors.length, 1);
  });
});

describe('validate', () => {
  test('warns about count mismatches and bad combos', () => {
    const s = {
      ...initialState(),
      layouts: [{ name: 'g', keys: [{}, {}] }],
      keymap: {
        layers: [{ name: 'Base', bindings: ['&a'] }],
        combos: [{ name: 'c', keyPositions: [5], layers: [3] }],
      },
    };
    const w = validate(s);
    assert.equal(w.length, 4);
    s.keymap.combos[0].keyPositions = [0, 'NAMED'];
    assert.match(validate(s).at(-2).text, /named position\(s\) NAMED/);
    assert.match(w[0].text, /1 bindings for 2 keys/);
  });
});
