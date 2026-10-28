import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDtsLayouts } from '../src/core/layout-dts.js';
import { parseQmkLayouts, parseKleLayout } from '../src/core/layout-json.js';
import { gridLayout, rowsFromLayout, layoutBounds } from '../src/core/layout-ops.js';
import { ELVN_LAYOUT } from './fixtures/elvn.js';

const k = (x, y, extra = {}) => ({ x, y, w: 1, h: 1, r: 0, rx: 0, ry: 0, ...extra });

describe('parseDtsLayouts', () => {
  test('reads key_physical_attrs in key units', () => {
    const [layout, ...rest] = parseDtsLayouts(ELVN_LAYOUT);
    assert.equal(rest.length, 0);
    assert.equal(layout.name, 'Default Layout');
    assert.deepEqual(layout.keys, [k(0, 0), k(1, 0), k(0, 1), k(1, 1)]);
  });

  test('handles negative values and rotation', () => {
    const src = `/ { l: l { compatible = "zmk,physical-layout";
      keys = <&key_physical_attrs 150 100 (-50) 25 (-1500) 100 200>; }; };`;
    const [layout] = parseDtsLayouts(src);
    assert.equal(layout.name, 'l');
    assert.deepEqual(layout.keys, [{ x: -0.5, y: 0.25, w: 1.5, h: 1, r: -15, rx: 1, ry: 2 }]);
  });

  test('returns every layout in the file', () => {
    const two = ELVN_LAYOUT + ELVN_LAYOUT.replace(/default_layout/g, 'alt').replace('Default Layout', 'Alt');
    assert.deepEqual(parseDtsLayouts(two).map((l) => l.name), ['Default Layout', 'Alt']);
  });
});

describe('parseQmkLayouts', () => {
  test('reads each named layout with defaults', () => {
    const info = {
      layouts: {
        LAYOUT_split: { layout: [{ x: 0, y: 0 }, { x: 1.5, y: 0.25, w: 2, r: 10, rx: 1, ry: 1, matrix: [0, 1] }] },
      },
    };
    const [layout] = parseQmkLayouts(info);
    assert.equal(layout.name, 'LAYOUT_split');
    assert.deepEqual(layout.keys, [k(0, 0), { x: 1.5, y: 0.25, w: 2, h: 1, r: 10, rx: 1, ry: 1 }]);
  });
});

describe('parseKleLayout', () => {
  test('follows KLE positioning rules', () => {
    const kle = [{ name: 'meta' }, ['Q', { w: 1.5 }, 'W', 'E'], [{ x: 0.5 }, 'A'], [{ r: 15, rx: 4, ry: 1, y: -0.5, x: 1 }, 'T']];
    const layout = parseKleLayout(kle);
    assert.deepEqual(layout.keys, [
      k(0, 0),
      { ...k(1, 0), w: 1.5 },
      k(2.5, 0),
      k(0.5, 1),
      k(5, 0.5, { r: 15, rx: 4, ry: 1 }),
    ]);
  });
});

describe('layout ops', () => {
  test('gridLayout builds rows of keys', () => {
    assert.deepEqual(gridLayout([2, 1]).keys, [k(0, 0), k(1, 0), k(0, 1)]);
  });

  test('rowsFromLayout groups keys by row', () => {
    const keys = [k(0, 0), k(1, 0.2), k(5, 0), k(0, 1), k(1, 1), k(3, 2.1)];
    assert.deepEqual(rowsFromLayout(keys), [3, 2, 1]);
  });

  test('rowsFromLayout starts a new row when x goes backwards', () => {
    assert.deepEqual(rowsFromLayout([k(0, 0), k(1, 0), k(0, 0.3)]), [2, 1]);
  });

  test('layoutBounds accounts for size and rotation', () => {
    assert.deepEqual(layoutBounds([k(0, 0), k(2, 1, { w: 2 })]), { minX: 0, minY: 0, maxX: 4, maxY: 2 });
    const b = layoutBounds([k(0, 0, { r: 90, rx: 0, ry: 0 })]);
    assert.ok(Math.abs(b.minX - -1) < 1e-9 && Math.abs(b.maxY - 1) < 1e-9);
  });

  test('layoutBounds of nothing is empty', () => {
    assert.deepEqual(layoutBounds([]), { minX: 0, minY: 0, maxX: 0, maxY: 0 });
  });
});
