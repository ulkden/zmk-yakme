import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseKeymap } from '../src/core/keymap-parse.js';
import { writeKeymap, formatRows, layerIds } from '../src/core/keymap-write.js';
import { requiredIncludes, ensureIncludes, addIncludes } from '../src/core/includes.js';
import { writeKeymapDetailed } from '../src/core/keymap-write.js';
import { FULL_KEYMAP } from './fixtures/full-keymap.js';
import { ELVN_KEYMAP } from './fixtures/elvn.js';
import { NAMED_COMBOS_KEYMAP } from './fixtures/named-combos.js';

const strip = (km) => ({
  layers: km.layers.map(({ name, bindings, extra }) => ({ name, bindings, extra })),
  combos: km.combos,
});

describe('formatRows', () => {
  test('aligns columns and splits by row lengths', () => {
    assert.deepEqual(formatRows(['&kp A', '&mt LSHIFT B', '&kp CCC', '&kp D'], [2, 2]), [
      '&kp A    &mt LSHIFT B',
      '&kp CCC  &kp D',
    ]);
  });

  test('puts leftovers on a final row', () => {
    assert.deepEqual(formatRows(['&a', '&b', '&c'], [2]), ['&a  &b', '&c']);
  });
});

describe('layerIds', () => {
  test('keeps existing ids and sanitizes new ones uniquely', () => {
    const ids = layerIds([{ id: 'base', name: 'Base' }, { name: 'My Layer!' }, { name: 'my layer' }, { name: '2nd' }]);
    assert.deepEqual(ids, ['base', 'my_layer', 'my_layer_2', 'layer_2nd']);
  });
});

describe('writeKeymap', () => {
  test('round-trips an imported keymap and preserves other content', () => {
    const km = parseKeymap(FULL_KEYMAP);
    const out = writeKeymap(km);
    assert.deepEqual(strip(parseKeymap(out)), strip(km));
    assert.match(out, /#define LOWER 1/);
    assert.match(out, /hm: homerow_mods \{/);
    assert.match(out, /tapping-term-ms = <200>;/);
    assert.match(out, /Copyright \(c\) 2020/);
  });

  test('writes edits into the bindings', () => {
    const km = parseKeymap(ELVN_KEYMAP);
    km.layers[0].bindings[0] = '&kp ESC';
    const out = writeKeymap(km, { rows: [2, 3, 3, 3] });
    assert.match(out, /&kp ESC\s+&kp B\n/);
    assert.equal(parseKeymap(out).layers[0].bindings[0], '&kp ESC');
  });

  test('inserts a combos node when the source has none', () => {
    const km = parseKeymap(ELVN_KEYMAP);
    km.combos = [
      {
        name: 'c1',
        keyPositions: [0, 1],
        binding: '&kp TAB',
        timeout: 40,
        layers: [],
        requirePriorIdle: null,
        slowRelease: false,
        extra: [],
      },
      {
        name: 'c2',
        keyPositions: [2, 'POS_X'],
        binding: '&kp Q',
        timeout: null,
        layers: [1],
        requirePriorIdle: 120,
        slowRelease: true,
        extra: [],
      },
    ];
    const re = parseKeymap(writeKeymap(km));
    assert.deepEqual(re.combos, km.combos);
  });

  test('writes named combo layers, positions and node names back unchanged', () => {
    const out = writeKeymap(parseKeymap(NAMED_COMBOS_KEYMAP));
    assert.match(out, /combo_tpsl_BASE \{[^}]*key-positions = <COMBO_TPSL>;[^}]*layers = <BASE>;/);
    assert.match(out, /combo_tpsl_NUM \{[^}]*layers = <NUM 1>;/);
  });

  test('sanitizes combo names that are not node names, and keeps them unique', () => {
    const km = parseKeymap(ELVN_KEYMAP);
    const combo = { keyPositions: [0, 1], binding: '&kp TAB', timeout: null, layers: [], extra: [] };
    km.combos = ['Esc Tab', 'dup', 'dup'].map((name) => ({ ...combo, name }));
    assert.deepEqual(
      parseKeymap(writeKeymap(km)).combos.map((c) => c.name),
      ['esc_tab', 'dup', 'dup_2'],
    );
  });

  test('adds new layers with display names', () => {
    const km = parseKeymap(ELVN_KEYMAP);
    km.layers.push({ name: 'Nav Layer', bindings: ['&trans'], extra: [] });
    const out = writeKeymap(km, { keyCount: 2 });
    assert.match(out, /nav_layer \{\n\s+display-name = "Nav Layer";/);
    const re = parseKeymap(out);
    assert.deepEqual(re.layers[1].bindings, ['&trans', '&trans']);
  });

  test('pads layer 0 with &none and adds missing includes', () => {
    const km = parseKeymap(ELVN_KEYMAP);
    km.layers[0].bindings = ['&bt BT_CLR'];
    const out = writeKeymap(km, { keyCount: 2 });
    assert.deepEqual(parseKeymap(out).layers[0].bindings, ['&bt BT_CLR', '&none']);
    assert.match(out, /#include <dt-bindings\/zmk\/bt.h>/);
  });

  test('generates a complete file without a source', () => {
    const km = {
      layers: [{ name: 'Base', bindings: ['&kp A', '&out OUT_USB'], extra: [] }],
      combos: [],
      customBehaviors: [],
      source: null,
    };
    const out = writeKeymap(km);
    assert.match(out, /#include <behaviors.dtsi>/);
    assert.match(out, /#include <dt-bindings\/zmk\/keys.h>/);
    assert.match(out, /#include <dt-bindings\/zmk\/outputs.h>/);
    assert.deepEqual(strip(parseKeymap(out)), strip(km));
  });
});

describe('includes', () => {
  test('requiredIncludes maps behaviors to headers', () => {
    assert.deepEqual(requiredIncludes(['&kp A', '&rgb_ug RGB_TOG', '&bt BT_CLR', '&bt BT_NXT']), [
      'behaviors.dtsi',
      'dt-bindings/zmk/keys.h',
      'dt-bindings/zmk/rgb.h',
      'dt-bindings/zmk/bt.h',
    ]);
  });

  test('ensureIncludes inserts after the last include only when missing', () => {
    const src = '#include <behaviors.dtsi>\n#include <dt-bindings/zmk/keys.h>\n\n/ { };\n';
    const out = ensureIncludes(src, ['behaviors.dtsi', 'dt-bindings/zmk/bt.h']);
    assert.equal(
      out,
      '#include <behaviors.dtsi>\n#include <dt-bindings/zmk/keys.h>\n#include <dt-bindings/zmk/bt.h>\n\n/ { };\n',
    );
    assert.equal(ensureIncludes(out, ['dt-bindings/zmk/bt.h']), out);
  });

  test('addIncludes reports what was added', () => {
    const src = '#include <behaviors.dtsi>\n/ { };\n';
    assert.deepEqual(addIncludes(src, ['behaviors.dtsi', 'dt-bindings/zmk/bt.h']).added, ['dt-bindings/zmk/bt.h']);
  });

  test('mouse.h satisfies pointing.h', () => {
    const src = '#include <dt-bindings/zmk/mouse.h>\n/ { };\n';
    assert.deepEqual(addIncludes(src, ['dt-bindings/zmk/pointing.h']).added, []);
    assert.deepEqual(addIncludes('/ { };', ['dt-bindings/zmk/pointing.h']).added, ['dt-bindings/zmk/pointing.h']);
  });

  test('writeKeymapDetailed lists includes added to an imported file', () => {
    const km = parseKeymap(ELVN_KEYMAP);
    km.layers[0].bindings[0] = '&out OUT_USB';
    assert.deepEqual(writeKeymapDetailed(km).addedIncludes, ['dt-bindings/zmk/outputs.h']);
    assert.deepEqual(writeKeymapDetailed({ ...km, source: null }).addedIncludes, []);
  });
});
