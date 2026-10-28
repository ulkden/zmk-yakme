import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { upgrade, FORMAT_VERSION, APP_ID } from '../src/core/project-format.js';
import { readProject, serialize } from '../src/core/state.js';
import { importText } from '../src/core/import.js';
import { exportKeymap } from '../src/core/export.js';
import { exampleState } from '../src/data/example.js';
import { V1_PROJECT } from './fixtures/saved/v1-project.js';

const clone = (o) => JSON.parse(JSON.stringify(o));

describe('saved-data format', () => {
  test('a version 1 project still loads, upgraded to the current format', () => {
    const { state } = readProject(JSON.stringify(V1_PROJECT));
    assert.equal(state.fileName, 'elvn.keymap');
    assert.deepEqual(state.keymap.behaviors, []);
    assert.deepEqual(state.keymap.combos[0], {
      name: 'combo_esc',
      keyPositions: [0, 1],
      binding: '&kp ESC',
      timeout: 50,
      layers: [],
      requirePriorIdle: null,
      slowRelease: false,
      extra: [],
    });
    assert.match(exportKeymap(state), /combo_esc \{/);
  });

  test('missing version is treated as version 1', () => {
    const { version: _drop, ...noVersion } = clone(V1_PROJECT);
    assert.deepEqual(upgrade(noVersion).doc.keymap.behaviors, []);
  });

  test('the current format round-trips unchanged', () => {
    const s = exampleState();
    const back = readProject(serialize(s)).state;
    assert.deepEqual(back.keymap, s.keymap);
    assert.deepEqual(back.layouts, s.layouts);
    assert.equal(JSON.parse(serialize(s)).version, FORMAT_VERSION);
  });

  test('files from a newer version are refused with an update hint', () => {
    const r = upgrade({ ...clone(V1_PROJECT), version: FORMAT_VERSION + 1 });
    assert.equal(r.kind, 'newer');
    assert.match(r.error, /newer version.*Reload/);
  });

  test('damaged files are refused with a reason', () => {
    const bad = (mutate) => {
      const d = clone(V1_PROJECT);
      mutate(d);
      return upgrade(d);
    };
    assert.match(bad((d) => delete d.layouts).error, /layouts are missing/);
    assert.match(bad((d) => (d.layouts[0].keys[2].x = 'left')).error, /layout 0, key 2/);
    assert.match(bad((d) => (d.keymap.layers = [])).error, /no layers/);
    assert.match(bad((d) => d.keymap.layers[0].bindings.push(7)).error, /layer 0 has invalid bindings/);
    assert.equal(bad((d) => (d.version = 'two')).kind, 'invalid');
  });

  test('other JSON is not a project', () => {
    assert.equal(upgrade({ layouts: [] }).kind, 'not-project');
    assert.equal(readProject('not json').kind, 'not-project');
  });

  test('import reports newer and damaged projects instead of treating them as layouts', () => {
    const newer = importText(JSON.stringify({ ...clone(V1_PROJECT), version: 99 }));
    assert.match(newer.errors[0], /newer version/);
    const damaged = importText(JSON.stringify({ app: APP_ID, version: 2, layouts: 'x' }));
    assert.match(damaged.errors[0], /damaged/);
    assert.ok(importText(JSON.stringify(V1_PROJECT)).project);
  });
});
