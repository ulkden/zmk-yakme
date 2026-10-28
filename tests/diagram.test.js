import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { diagramLabel, layerDiagram, diagramComment } from '../src/core/diagram.js';
import { writeKeymap } from '../src/core/keymap-write.js';
import { parseKeymap } from '../src/core/keymap-parse.js';
import { exportKeymap } from '../src/core/export.js';
import { exampleState } from '../src/data/example.js';

const k = (x, y, w = 1) => ({ x, y, w, h: 1, r: 0, rx: 0, ry: 0 });
const layers = [{ name: 'Base' }, { name: 'Nav' }];

describe('layer diagrams', () => {
  test('diagramLabel summarizes behaviors', () => {
    assert.equal(diagramLabel('&kp A', layers), 'A');
    assert.equal(diagramLabel('&mt LCTRL ESC', layers), 'Esc/Ctrl');
    assert.equal(diagramLabel('&lt 1 SPACE', layers), '␣/Nav');
    assert.equal(diagramLabel('&mo 1', layers), 'mo Nav');
    assert.equal(diagramLabel('&bt BT_SEL 0', layers), 'bt SEL 0');
    assert.equal(diagramLabel('&none', layers), '');
    assert.equal(diagramLabel('&kp LC(LS(LA(LG(Z))))', layers), '⌃⇧⌥◆Z');
    assert.equal(diagramLabel('&my_very_long_macro', layers).length, 9);
  });

  test('layerDiagram places keys by x, keeping split gaps', () => {
    const keys = [k(0, 0), k(1, 0), k(4, 0), k(0, 1, 2)];
    const lines = layerDiagram(['&kp A', '&kp B', '&kp C', '&kp SPACE'], layers, keys);
    assert.deepEqual(lines, ['  A     B                 C', '     ␣']);
  });

  test('diagramComment falls back to rows when there is no layout', () => {
    const lines = diagramComment({ name: 'Base', bindings: ['&kp A', '&kp B'] }, layers, null, [1, 1]);
    assert.deepEqual(lines, ['// Base', '//   A', '//   B']);
  });

  test('writer adds diagrams only when asked, and they re-import cleanly', () => {
    const s = exampleState();
    const plain = exportKeymap(s);
    const withDiagrams = exportKeymap(s, { diagrams: true });
    assert.doesNotMatch(plain, /\/\/ Base/);
    assert.match(withDiagrams, /\/\/ Base\n\s+\/\/ +⇥ +Q +W/);
    assert.deepEqual(parseKeymap(withDiagrams).layers.map((l) => l.bindings), s.keymap.layers.map((l) => l.bindings));
    const again = parseKeymap(withDiagrams);
    assert.equal((writeKeymap(again, { diagrams: true, rows: [12, 12, 12, 6] }).match(/\/\/ Base/g) ?? []).length, 1);
  });
});
