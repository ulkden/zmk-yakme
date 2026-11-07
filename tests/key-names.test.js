import { test } from 'node:test';
import assert from 'node:assert/strict';
import { speak, bindingWords, keyName } from '../src/core/key-names.js';
import { bindingLabel } from '../src/core/labels.js';

const layers = [{ name: 'Base' }, { name: 'Lower' }, { name: 'Raise' }];

test('legends are spoken as words, keeping their visible letters', () => {
  assert.equal(speak('A'), 'A');
  assert.equal(speak('Esc'), 'Esc');
  assert.equal(speak('⇥'), 'Tab');
  assert.equal(speak('⏎'), 'Enter');
  assert.equal(speak('⇧'), 'Shift');
  assert.equal(speak('R⇧'), 'R Shift');
  assert.equal(speak('⇧A'), 'Shift+A');
  assert.equal(speak('R⇧A'), 'R Shift+A');
  assert.equal(speak('⌃⌥Del'), 'Ctrl+Alt+Del');
  assert.equal(speak('⏯'), 'Play/pause');
  assert.equal(speak('UNKNOWN_CODE'), 'UNKNOWN_CODE');
});

test('bindings read legend first (the agreed examples)', () => {
  assert.equal(bindingWords('&kp A', layers), 'A');
  assert.equal(bindingWords('&kp TAB', layers), 'Tab');
  assert.equal(bindingWords('&mt LCTRL ESC', layers), 'Esc, hold Ctrl');
  assert.equal(bindingWords('&mo 1', layers), 'Lower layer while held');
  assert.equal(bindingWords('&lt 2 SPACE', layers), 'Space, Raise layer while held');
  assert.equal(bindingWords('&tog 2', layers), 'Raise layer, toggle');
  assert.equal(bindingWords('&to 0', layers), 'Base layer, switch to');
  assert.equal(bindingWords('&sl 1', layers), 'Lower layer, sticky');
  assert.equal(bindingWords('&sk LSHIFT', layers), 'Shift, sticky');
  assert.equal(bindingWords('&trans', layers), 'Transparent');
  assert.equal(bindingWords('&none', layers), 'None');
  assert.equal(bindingWords('', layers), 'None');
});

test('other behaviors read their legend, then what they are', () => {
  assert.equal(bindingWords('&bt BT_SEL 0', layers), 'SEL 0, Bluetooth');
  assert.equal(bindingWords('&out OUT_USB', layers), 'USB, Output select');
  assert.equal(bindingWords('&caps_word', layers), 'caps_word');
  assert.equal(bindingWords('&rgb_ug RGB_TOG', layers), 'RGB_TOG, RGB underglow');
  assert.equal(bindingWords('&my_macro', layers), 'my_macro');
});

test('custom hold-taps read like mod-tap and layer-tap', () => {
  const custom = [
    { label: 'hm', kind: 'hold-tap', params: ['keycode', 'keycode'] },
    { label: 'ltq', kind: 'hold-tap', params: ['layer', 'keycode'] },
  ];
  assert.equal(bindingWords('&hm LGUI A', layers, custom), 'A, hold Gui');
  assert.equal(bindingWords('&ltq 1 Q', layers, custom), 'Q, Lower layer while held');
});

test('missing parameters never leave a bare comma', () => {
  assert.equal(bindingWords('&mt LCTRL', layers), 'hold Ctrl');
  assert.equal(bindingWords('&kp', layers), 'Key press');
});

test('every name starts with its visible legend when the legend is text', () => {
  const samples = ['&kp A', '&mt LCTRL ESC', '&mo 1', '&to 0', '&tog 2', '&sl 1', '&sk A', '&bt BT_SEL 0'];
  for (const b of [...samples, '&out OUT_BLE', '&caps_word', '&kp UNKNOWN_CODE', '&lt 1 RET']) {
    const { tap } = bindingLabel(b, layers);
    if (/^[\p{L}\p{N}]/u.test(tap)) assert.ok(bindingWords(b, layers).startsWith(tap), `${b}: ${tap}`);
  }
});

test('a key is read as its action, then its position', () => {
  assert.equal(keyName('&kp A', layers, [], 13), 'A, key 13');
  assert.equal(keyName('&mt LCTRL ESC', layers, [], 12), 'Esc, hold Ctrl, key 12');
});
