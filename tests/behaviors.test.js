import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseKeymap } from '../src/core/keymap-parse.js';
import { writeKeymap } from '../src/core/keymap-write.js';
import * as bops from '../src/core/behavior-ops.js';
import { behaviorDef } from '../src/data/behaviors.js';
import { FULL_KEYMAP } from './fixtures/full-keymap.js';
import { ELVN_KEYMAP } from './fixtures/elvn.js';

const MORPH = `#include <behaviors.dtsi>
/ {
    behaviors {
        cs: comma_semi {
            compatible = "zmk,behavior-mod-morph";
            #binding-cells = <0>;
            bindings = <&kp COMMA>, <&kp SEMI>;
            mods = <(MOD_LSFT|MOD_RSFT)>;
        };
        td: tap_dance {
            compatible = "zmk,behavior-tap-dance";
            #binding-cells = <0>;
            bindings = <&kp A>, <&kp B>;
        };
    };
    keymap { compatible = "zmk,keymap"; base { bindings = <&cs &td &kp A>; }; };
};
`;

const fields = (b) => {
  const { orig, origLabel, ...rest } = b;
  return rest;
};

describe('behavior parsing', () => {
  test('reads hold-taps and macros as editable behaviors', () => {
    const km = parseKeymap(FULL_KEYMAP);
    assert.deepEqual(fields(km.behaviors[0]), {
      kind: 'hold-tap',
      label: 'hm',
      name: 'homerow_mods',
      displayName: null,
      bindings: ['&kp', '&kp'],
      flavor: null,
      tappingTerm: 200,
      quickTap: null,
      priorIdle: null,
      extra: [],
    });
    assert.deepEqual(fields(km.behaviors[1]), {
      kind: 'macro',
      label: 'hello',
      name: 'hello',
      displayName: null,
      bindings: ['&kp H', '&kp I'],
      waitMs: null,
      tapMs: null,
      extra: [],
    });
    assert.deepEqual(km.customBehaviors, []);
  });

  test('reads mod-morphs and lists other behaviors by label', () => {
    const km = parseKeymap(MORPH);
    assert.deepEqual(km.behaviors[0].mods, ['MOD_LSFT', 'MOD_RSFT']);
    assert.deepEqual(km.behaviors[0].bindings, ['&kp COMMA', '&kp SEMI']);
    assert.deepEqual(km.customBehaviors, [{ label: 'td', cells: 0 }]);
  });
});

describe('behavior writing', () => {
  test('unchanged behaviors are left byte-for-byte', () => {
    const km = parseKeymap(FULL_KEYMAP);
    const out = writeKeymap(km);
    const block = FULL_KEYMAP.slice(FULL_KEYMAP.indexOf('    behaviors {'), FULL_KEYMAP.indexOf('    combos {'));
    assert.ok(out.includes(block));
  });

  test('edited behaviors are regenerated in place', () => {
    const km = bops.updateBehavior(parseKeymap(FULL_KEYMAP), 0, { tappingTerm: 175, flavor: 'balanced' });
    const out = writeKeymap(km);
    assert.match(
      out,
      /hm: homerow_mods \{\n {12}compatible = "zmk,behavior-hold-tap";\n {12}#binding-cells = <2>;\n {12}flavor = "balanced";\n {12}tapping-term-ms = <175>;\n {12}bindings = <&kp>, <&kp>;\n {8}\};/,
    );
    assert.deepEqual(fields(parseKeymap(out).behaviors[0]), fields(km.behaviors[0]));
  });

  test('new behaviors go into existing containers', () => {
    let km = parseKeymap(FULL_KEYMAP);
    km = bops.addBehavior(km, 'mod-morph');
    km = bops.addBehavior(km, 'macro');
    const re = parseKeymap(writeKeymap(km));
    assert.deepEqual(
      re.behaviors.map((b) => b.label),
      ['hm', 'mm', 'hello', 'macro'],
    );
    assert.equal((writeKeymap(km).match(/behaviors \{/g) ?? []).length, 1);
  });

  test('new behaviors create containers when the source has none', () => {
    const km = bops.addBehavior(bops.addBehavior(parseKeymap(ELVN_KEYMAP), 'hold-tap'), 'macro');
    const out = writeKeymap(km);
    assert.match(out, /behaviors \{\n\s+ht: ht \{/);
    assert.match(out, /macros \{\n\s+macro: macro \{/);
    assert.ok(out.indexOf('behaviors {') < out.indexOf('keymap {'));
    assert.deepEqual(
      parseKeymap(out).behaviors.map((b) => b.kind),
      ['hold-tap', 'macro'],
    );
  });

  test('deleted behaviors are removed and references become &none', () => {
    const km = bops.removeBehavior(parseKeymap(FULL_KEYMAP), 1);
    const out = writeKeymap(km);
    assert.doesNotMatch(out, /hello: hello/);
    assert.deepEqual(parseKeymap(out).layers[1].bindings, ['&bt BT_SEL 0', '&trans', '&trans', '&none']);
    assert.match(out, /macros \{\n {4}\};/);
  });

  test('a generated file includes behaviors', () => {
    const km = bops.addBehavior(
      {
        layers: [{ name: 'Base', bindings: ['&ht LSHIFT A'], extra: [] }],
        combos: [],
        customBehaviors: [],
        source: null,
      },
      'hold-tap',
    );
    const re = parseKeymap(writeKeymap(km));
    assert.equal(re.behaviors[0].label, 'ht');
  });
});

describe('behavior ops', () => {
  test('renaming a behavior label updates references', () => {
    const km = bops.updateBehavior(parseKeymap(FULL_KEYMAP), 0, { label: 'Home Mods' });
    assert.equal(km.behaviors[0].label, 'home_mods');
    assert.equal(km.layers[0].bindings[1], '&home_mods LSHIFT A');
  });

  test('labels stay unique', () => {
    let km = bops.addBehavior(parseKeymap(FULL_KEYMAP), 'hold-tap');
    km = bops.addBehavior(km, 'hold-tap');
    assert.deepEqual(
      km.behaviors.slice(2).map((b) => b.label),
      ['ht', 'ht_2'],
    );
    km = bops.updateBehavior(km, 2, { label: 'hm' });
    assert.equal(km.behaviors[2].label, 'hm_2');
  });

  test('countBehaviorUses and allCustomBehaviors', () => {
    const km = parseKeymap(FULL_KEYMAP);
    assert.equal(bops.countBehaviorUses(km, 'hm'), 1);
    const custom = bops.allCustomBehaviors(km);
    assert.deepEqual(
      custom.map((c) => [c.label, c.cells]),
      [
        ['hm', 2],
        ['hello', 0],
      ],
    );
    assert.deepEqual(behaviorDef('hm', custom).params, ['keycode', 'keycode']);
  });
});
