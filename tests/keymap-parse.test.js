import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseKeymap } from '../src/core/keymap-parse.js';
import { FULL_KEYMAP } from './fixtures/full-keymap.js';
import { ELVN_KEYMAP } from './fixtures/elvn.js';

describe('parseKeymap', () => {
  test('returns null when there is no keymap node', () => {
    assert.equal(parseKeymap('/ { foo { }; };'), null);
  });

  test('reads layers with names and bindings', () => {
    const km = parseKeymap(FULL_KEYMAP);
    assert.deepEqual(
      km.layers.map((l) => [l.id, l.name]),
      [
        ['default_layer', 'Base'],
        ['lower_layer', 'Lower'],
      ],
    );
    assert.deepEqual(km.layers[0].bindings, ['&kp Q', '&hm LSHIFT A', '&mo 1', '&kp LC(LS(Z))']);
    assert.deepEqual(km.layers[1].bindings, ['&bt BT_SEL 0', '&trans', '&trans', '&hello']);
  });

  test('keeps unknown layer properties verbatim', () => {
    const km = parseKeymap(FULL_KEYMAP);
    assert.deepEqual(km.layers[1].extra, ['sensor-bindings = <&inc_dec_kp C_VOL_UP C_VOL_DN>;']);
    assert.deepEqual(km.layers[0].extra, []);
  });

  test('falls back to the node name when no display name exists', () => {
    const km = parseKeymap(ELVN_KEYMAP);
    assert.equal(km.layers[0].name, 'default_layer');
    assert.deepEqual(km.rowHints, [2, 3, 3, 3]);
    assert.equal(km.layers[0].bindings.length, 11);
  });

  test('reads combos', () => {
    const km = parseKeymap(FULL_KEYMAP);
    assert.deepEqual(km.combos, [
      { name: 'combo_esc', keyPositions: [0, 1], binding: '&kp ESC', timeout: 50, layers: [], extra: [] },
      {
        name: 'combo_tab',
        keyPositions: [2, 3],
        binding: '&kp TAB',
        timeout: null,
        layers: [0, 1],
        extra: ['require-prior-idle-ms = <150>;'],
      },
    ]);
  });

  test('lists custom behaviors and macros by label', () => {
    const km = parseKeymap(FULL_KEYMAP);
    assert.deepEqual(km.customBehaviors, [
      { label: 'hm', cells: 2 },
      { label: 'hello', cells: 0 },
    ]);
  });

  test('stores the source text', () => {
    assert.equal(parseKeymap(ELVN_KEYMAP).source, ELVN_KEYMAP);
  });
});
