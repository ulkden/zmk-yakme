// Real ZMK boards, pinned in tests/fixtures/zmk/, must import, export and re-import cleanly.
// scripts/zmk-drift.mjs runs the same checks monthly against ZMK's main branch.
import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { BOARDS, checkBoard, checkKeymapFile, checkLayoutFile } from './zmk-checks.js';

// Node reads the fixtures from disk; the browser test runner fetches them from the dev server.
async function readFixture(path) {
  const url = new URL(`./fixtures/zmk/${path}`, import.meta.url);
  if (globalThis.process?.versions?.node) return (await import('node:fs/promises')).readFile(url, 'utf8');
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
  return res.text();
}

async function boardFiles(board) {
  const paths = [...board.layouts, board.keymap];
  return Object.fromEntries(await Promise.all(paths.map(async (p) => [p, await readFixture(p)])));
}

// Key and layer counts at the pinned ZMK commit, so a change in layout matching shows up here.
const EXPECTED = {
  Corne: { keys: 42, layers: 3, layouts: ['5 Column', '6 Column'] },
  Lily58: { keys: 58, layers: 3 },
  Sofle: { keys: 60, layers: 4 },
  Kyria: { keys: 50, layers: 2, layouts: ['6 Column', '5 Column'] },
  Ferris: { keys: 34, layers: 5 },
  REVIUNG41: { keys: 41, layers: 4 },
  Planck: { keys: 48, layers: 3 },
  'nice!60': { keys: 61, layers: 2 },
  BDN9: { keys: 9, layers: 1 },
};

describe('pinned ZMK boards', () => {
  for (const board of BOARDS) {
    test(`${board.name} imports, exports and re-imports without changes`, async () => {
      const result = checkBoard(board, await boardFiles(board));
      assert.deepEqual(result.problems, []);
      const { layouts, ...counts } = EXPECTED[board.name];
      assert.deepEqual({ keys: result.keys, layers: result.layers }, counts);
      if (layouts) assert.deepEqual(result.layouts, layouts);
    });
  }

  test('each pinned file also passes the single-file checks', async () => {
    for (const board of BOARDS) {
      const files = await boardFiles(board);
      for (const path of board.layouts) assert.deepEqual(checkLayoutFile(files[path]).problems, [], path);
      assert.deepEqual(checkKeymapFile(files[board.keymap]).problems, [], board.keymap);
    }
  });
});

describe('ZMK checks report problems', () => {
  const corne = BOARDS[0];

  test('a layer with too few bindings for the layout', async () => {
    const files = await boardFiles(corne);
    files[corne.keymap] = files[corne.keymap].replace('&kp TAB', '');
    const { problems } = checkBoard(corne, files);
    // No layout has 41 keys, so the first (36-key) one is used and the extra bindings are reported.
    assert.match(problems.join('\n'), /Layer "Default Layer" has 5 binding\(s\) beyond the 36 physical keys/);
  });

  test('a file that is not a keymap or layout', () => {
    assert.deepEqual(checkKeymapFile('/ { };').problems, ['No physical layout or keymap found in this file']);
    assert.deepEqual(checkLayoutFile('/ { };').problems, ['no physical layout found']);
  });

  test('bindings to behaviors the editor does not know', () => {
    const km = '/ { keymap { compatible = "zmk,keymap"; base { bindings = <&kp A &bl BL_TOG>; }; }; };';
    assert.deepEqual(checkKeymapFile(km).unknown, ['bl']);
  });

  test('keymaps that only include another keymap are skipped', () => {
    const half = '/*\n * Copyright\n */\n\n#include "glove80.keymap"\n';
    assert.equal(checkKeymapFile(half).skipped, 'only includes another keymap');
  });
});
