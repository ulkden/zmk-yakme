import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spokenKey, bindingWords, keyName } from '../src/core/key-names.js';

const layers = [{ name: 'Base' }, { name: 'Lower' }, { name: 'Raise' }];

test('keycodes are spoken as words, symbols included', () => {
  assert.equal(spokenKey('A'), 'A');
  assert.equal(spokenKey('ESC'), 'Esc');
  assert.equal(spokenKey('TAB'), 'Tab');
  assert.equal(spokenKey('RET'), 'Enter');
  assert.equal(spokenKey('RETURN'), 'Enter');
  assert.equal(spokenKey('LSHIFT'), 'Shift');
  assert.equal(spokenKey('LS(A)'), 'Shift+A');
  assert.equal(spokenKey('LC(LA(DEL))'), 'Ctrl+Alt+Del');
  assert.equal(spokenKey('C_PP'), 'Play/pause');
  assert.equal(spokenKey('UNKNOWN_CODE'), 'UNKNOWN CODE');
});

test('bindings read as what they do (the agreed examples)', () => {
  assert.equal(bindingWords('&kp A', layers), 'A');
  assert.equal(bindingWords('&mt LCTRL ESC', layers), 'Esc, hold Ctrl');
  assert.equal(bindingWords('&mo 1', layers), 'Lower layer while held');
  assert.equal(bindingWords('&lt 2 SPACE', layers), 'Space, Raise layer while held');
  assert.equal(bindingWords('&tog 2', layers), 'Toggle Raise layer');
  assert.equal(bindingWords('&to 0', layers), 'To Base layer');
  assert.equal(bindingWords('&sl 1', layers), 'Sticky Lower layer');
  assert.equal(bindingWords('&sk LSHIFT', layers), 'Sticky Shift');
  assert.equal(bindingWords('&trans', layers), 'Transparent');
  assert.equal(bindingWords('&none', layers), 'None');
  assert.equal(bindingWords('', layers), 'None');
});

test('other behaviors read their name and parameters without symbols', () => {
  assert.equal(bindingWords('&bt BT_SEL 0', layers), 'Bluetooth BT SEL 0');
  assert.equal(bindingWords('&caps_word', layers), 'Caps word');
  assert.equal(bindingWords('&my_macro', layers), 'my macro');
});

test('custom hold-taps read like mod-tap and layer-tap', () => {
  const custom = [
    { label: 'hm', kind: 'hold-tap', params: ['keycode', 'keycode'] },
    { label: 'ltq', kind: 'hold-tap', params: ['layer', 'keycode'] },
  ];
  assert.equal(bindingWords('&hm LGUI A', layers, custom), 'A, hold Gui');
  assert.equal(bindingWords('&ltq 1 Q', layers, custom), 'Q, Lower layer while held');
});

test('a key is read as its action, then its position', () => {
  assert.equal(keyName('&kp A', layers, [], 13), 'A, key 13');
  assert.equal(keyName('&mt LCTRL ESC', layers, [], 12), 'Esc, hold Ctrl, key 12');
});
