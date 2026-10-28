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
      {
        name: 'combo_esc',
        keyPositions: [0, 1],
        binding: '&kp ESC',
        timeout: 50,
        layers: [],
        requirePriorIdle: null,
        slowRelease: false,
        extra: [],
      },
      {
        name: 'combo_tab',
        keyPositions: [2, 3],
        binding: '&kp TAB',
        timeout: null,
        layers: [0, 1],
        requirePriorIdle: 150,
        slowRelease: false,
        extra: [],
      },
    ]);
  });

  test('reads slow-release, symbolic positions and keeps unknown combo props', () => {
    const src = `/ { combos { compatible = "zmk,combos";
      c { key-positions = <LT0 (1 + 1) RT0>; bindings = <&kp A>; slow-release; hold-trigger = <1>; }; };
      keymap { compatible = "zmk,keymap"; l { bindings = <&kp A>; }; }; };`;
    const [c] = parseKeymap(src).combos;
    assert.deepEqual(c.keyPositions, ['LT0', 2, 'RT0']);
    assert.equal(c.slowRelease, true);
    assert.deepEqual(c.extra, ['hold-trigger = <1>;']);
  });

  test('reads editable behaviors and macros', () => {
    const km = parseKeymap(FULL_KEYMAP);
    assert.deepEqual(
      km.behaviors.map((b) => [b.kind, b.label]),
      [
        ['hold-tap', 'hm'],
        ['macro', 'hello'],
      ],
    );
  });

  test('stores the source text', () => {
    assert.equal(parseKeymap(ELVN_KEYMAP).source, ELVN_KEYMAP);
  });
});
