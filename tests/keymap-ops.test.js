import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import * as ops from '../src/core/keymap-ops.js';

const km = () => ({
  layers: [
    { id: 'a', name: 'A', bindings: ['&kp A', '&mo 1', '&lt 2 SPACE'], extra: [] },
    { id: 'b', name: 'B', bindings: ['&trans', '&to 0', '&mo NAV'], extra: [] },
    { id: 'c', name: 'C', bindings: ['&tog 1', '&trans', '&trans'], extra: [] },
  ],
  combos: [{ name: 'x', keyPositions: [0, 1], binding: '&mo 2', timeout: null, layers: [1, 2], extra: [] }],
  customBehaviors: [],
  rowHints: [],
  source: null,
});

describe('keymap ops', () => {
  test('emptyKeymap creates one base layer', () => {
    const e = ops.emptyKeymap(3);
    assert.deepEqual(e.layers[0].bindings, ['&none', '&none', '&none']);
  });

  test('setBinding replaces one binding immutably and pads', () => {
    const before = km();
    const after = ops.setBinding(before, 1, 4, '&kp Z');
    assert.deepEqual(after.layers[1].bindings, ['&trans', '&to 0', '&mo NAV', '&trans', '&kp Z']);
    assert.equal(before.layers[1].bindings.length, 3);
    assert.equal(after.layers[0], before.layers[0]);
  });

  test('addLayer and renameLayer', () => {
    const after = ops.renameLayer(ops.addLayer(km(), 2), 3, 'Fn');
    assert.deepEqual(after.layers[3], { name: 'Fn', bindings: ['&trans', '&trans'], extra: [] });
  });

  test('removeLayer remaps numeric references', () => {
    const after = ops.removeLayer(km(), 1);
    assert.deepEqual(after.layers.map((l) => l.id), ['a', 'c']);
    assert.deepEqual(after.layers[0].bindings, ['&kp A', '&trans', '&lt 1 SPACE']);
    assert.deepEqual(after.layers[1].bindings, ['&trans', '&trans', '&trans']);
    assert.equal(after.combos[0].binding, '&mo 1');
    assert.deepEqual(after.combos[0].layers, [1]);
  });

  test('removeLayer keeps the last layer', () => {
    const one = ops.emptyKeymap(1);
    assert.equal(ops.removeLayer(one, 0), one);
  });

  test('moveLayer reorders and remaps', () => {
    const after = ops.moveLayer(km(), 2, 0);
    assert.deepEqual(after.layers.map((l) => l.id), ['c', 'a', 'b']);
    assert.deepEqual(after.layers[1].bindings, ['&kp A', '&mo 2', '&lt 0 SPACE']);
    assert.deepEqual(after.layers[2].bindings, ['&trans', '&to 1', '&mo NAV']);
    assert.deepEqual(after.layers[0].bindings, ['&tog 2', '&trans', '&trans']);
    assert.deepEqual(after.combos[0].layers, [2, 0]);
  });

  test('combo add / toggle / update / remove', () => {
    let k = ops.addCombo(km(), [3]);
    assert.equal(k.combos[1].name, 'combo_2');
    k = ops.toggleComboKey(k, 1, 1);
    assert.deepEqual(k.combos[1].keyPositions, [1, 3]);
    k = ops.toggleComboKey(k, 1, 3);
    assert.deepEqual(k.combos[1].keyPositions, [1]);
    k = ops.updateCombo(k, 1, { binding: '&kp ESC', timeout: 30 });
    assert.equal(k.combos[1].binding, '&kp ESC');
    k = ops.removeCombo(k, 0);
    assert.deepEqual(k.combos.map((c) => c.name), ['combo_2']);
  });

  test('trimLayers and symbolicLayerRefs', () => {
    const t = ops.trimLayers(km(), 2);
    assert.deepEqual(t.layers.map((l) => l.bindings.length), [2, 2, 2]);
    assert.deepEqual(ops.symbolicLayerRefs(km()), ['NAV']);
  });
});
