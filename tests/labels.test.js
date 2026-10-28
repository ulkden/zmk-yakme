import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { keyLabel, bindingLabel } from '../src/core/labels.js';
import { behaviorDef } from '../src/data/behaviors.js';

describe('labels', () => {
  test('keyLabel handles codes, aliases and modifier functions', () => {
    assert.equal(keyLabel('A'), 'A');
    assert.equal(keyLabel('N1'), '1');
    assert.equal(keyLabel('ENTER'), '⏎');
    assert.equal(keyLabel('LC(LS(Z))'), '⌃⇧Z');
    assert.equal(keyLabel('WEIRD'), 'WEIRD');
  });

  test('bindingLabel describes common behaviors', () => {
    const layers = [{ name: 'Base' }, { name: 'Nav' }];
    assert.deepEqual(bindingLabel('&kp A'), { tap: 'A', hold: '', kind: 'key' });
    assert.deepEqual(bindingLabel('&mt LSHIFT A'), { tap: 'A', hold: '⇧', kind: 'hold' });
    assert.deepEqual(bindingLabel('&lt 1 SPACE', layers), { tap: '␣', hold: 'Nav', kind: 'layer' });
    assert.deepEqual(bindingLabel('&mo 1', layers), { tap: 'Nav', hold: 'mo', kind: 'layer' });
    assert.deepEqual(bindingLabel('&bt BT_SEL 0'), { tap: 'SEL 0', hold: 'bt', kind: 'system' });
    assert.equal(bindingLabel('&trans').kind, 'trans');
    assert.deepEqual(bindingLabel('&hello'), { tap: 'hello', hold: '', kind: 'other' });
  });
});

describe('custom hold-tap labels', () => {
  test('read like mod-tap / layer-tap', () => {
    const layers = [{ name: 'Base' }, { name: 'Nav' }];
    const custom = [
      { label: 'hm', kind: 'hold-tap', params: ['keycode', 'keycode'] },
      { label: 'lth', kind: 'hold-tap', params: ['layer', 'keycode'] },
    ];
    assert.deepEqual(bindingLabel('&hm LALT S', layers, custom), { tap: 'S', hold: 'Alt', kind: 'hold' });
    assert.deepEqual(bindingLabel('&lth 1 SPACE', layers, custom), { tap: '␣', hold: 'Nav', kind: 'layer' });
    assert.deepEqual(bindingLabel('&hm LALT S', layers), { tap: 'Alt S', hold: 'hm', kind: 'other' });
  });
});

describe('behaviorDef', () => {
  test('finds built-in and custom behaviors', () => {
    assert.equal(behaviorDef('mt').params.length, 2);
    assert.deepEqual(behaviorDef('hm', [{ label: 'hm', cells: 2 }]).params, ['raw', 'raw']);
    assert.equal(behaviorDef('nope'), null);
  });
});

import { exampleState } from '../src/data/example.js';
import { validate } from '../src/core/validate.js';

describe('example', () => {
  test('example keymap matches its layout', () => {
    const s = exampleState();
    assert.equal(s.layouts[0].keys.length, 42);
    s.keymap.layers.forEach((l) => assert.equal(l.bindings.length, 42, l.name));
    assert.deepEqual(validate(s), []);
    assert.equal(s.keymap.layers[0].bindings[12], '&mt LCTRL ESC');
  });
});
