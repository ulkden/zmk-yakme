import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { switchBehavior, applyKeycode, setParam } from '../src/core/binding-edit.js';
import { exportKeymap, exportFileName, projectFileName, toRawUrl, exportRows } from '../src/core/export.js';
import { parseKeymap } from '../src/core/keymap-parse.js';
import { exampleState } from '../src/data/example.js';

describe('binding edits', () => {
  test('switchBehavior carries the keycode across', () => {
    assert.equal(switchBehavior('&kp A', 'mt'), '&mt LSHIFT A');
    assert.equal(switchBehavior('&mt LCTRL B', 'lt'), '&lt 0 B');
    assert.equal(switchBehavior('&lt 2 B', 'mo'), '&mo 2');
    assert.equal(switchBehavior('&kp A', 'trans'), '&trans');
    assert.equal(switchBehavior('&trans', 'bt'), '&bt BT_CLR');
    assert.equal(switchBehavior('&kp A', 'hm', [{ label: 'hm', cells: 2 }]), '&hm');
  });

  test('applyKeycode fills the last keycode slot', () => {
    assert.equal(applyKeycode('&kp A', 'B'), '&kp B');
    assert.equal(applyKeycode('&mt LSHIFT A', 'Z'), '&mt LSHIFT Z');
    assert.equal(applyKeycode('&lt 1 A', 'SPACE'), '&lt 1 SPACE');
    assert.equal(applyKeycode('&mo 1', 'Q'), '&kp Q');
    assert.equal(applyKeycode('&trans', 'Q'), '&kp Q');
  });

  test('setParam replaces one parameter', () => {
    assert.equal(setParam('&mt LSHIFT A', 0, 'LCTRL'), '&mt LCTRL A');
    assert.equal(setParam('&bt BT_SEL', 1, '2'), '&bt BT_SEL 2');
  });
});

describe('export', () => {
  test('exportKeymap formats rows from the layout', () => {
    const out = exportKeymap(exampleState());
    const km = parseKeymap(out);
    assert.equal(km.layers.length, 3);
    assert.deepEqual(km.rowHints, [12, 12, 12, 6]);
    assert.equal(km.combos[0].binding, '&kp ESC');
  });

  test('exportRows prefers the source line breaks when they fit the layout', () => {
    const keys = Array.from({ length: 4 }, (_, i) => ({ x: i, y: 0, w: 1, h: 1, r: 0, rx: 0, ry: 0 }));
    assert.deepEqual(exportRows({ rowHints: [1, 3] }, keys), [1, 3]);
    assert.deepEqual(exportRows({ rowHints: [2, 3] }, keys), [4]);
    assert.deepEqual(exportRows({}, keys), [4]);
  });

  test('exportFileName derives from the imported file', () => {
    assert.equal(exportFileName({ fileName: 'corne.keymap' }), 'corne.keymap');
    assert.equal(exportFileName({}), 'keymap.keymap');
    assert.equal(projectFileName({ fileName: 'corne.keymap' }), 'corne.zmk-project.json');
  });

  test('toRawUrl converts GitHub blob links', () => {
    assert.equal(
      toRawUrl('https://github.com/u/r/blob/main/config/x.keymap'),
      'https://raw.githubusercontent.com/u/r/main/config/x.keymap',
    );
    assert.equal(toRawUrl(' https://example.com/a '), 'https://example.com/a');
  });
});
