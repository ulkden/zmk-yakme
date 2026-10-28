import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { legendToBinding, legendToCode } from '../src/core/legends.js';
import { parseGithubUrl, repoFiles, importOrder, listRepo, rawUrl } from '../src/core/github.js';
import { importText, applyImport, combineResults } from '../src/core/import.js';
import { initialState } from '../src/core/state.js';

describe('KLE legends', () => {
  test('legendToCode understands letters, digits, words, labels and codes', () => {
    assert.equal(legendToCode('q'), 'Q');
    assert.equal(legendToCode('7'), 'N7');
    assert.equal(legendToCode('Shift'), 'LSHIFT');
    assert.equal(legendToCode('Caps Lock'), 'CAPS');
    assert.equal(legendToCode('Esc'), 'ESC');
    assert.equal(legendToCode('F12'), 'F12');
    assert.equal(legendToCode('['), 'LBKT');
    assert.equal(legendToCode('←'), 'LEFT');
    assert.equal(legendToCode('<b>Tab</b>'), 'TAB');
    assert.equal(legendToCode('Fn'), null);
  });

  test('legendToBinding prefers the unshifted legend', () => {
    assert.equal(legendToBinding('!\n1'), '&kp N1');
    assert.equal(legendToBinding('~\n`'), '&kp GRAVE');
    assert.equal(legendToBinding('Q'), '&kp Q');
    assert.equal(legendToBinding(''), '&none');
    assert.equal(legendToBinding('Fn'), '&none');
  });

  test('importing KLE without a keymap seeds the base layer', () => {
    const s = applyImport(initialState(), importText('[["Esc","!\\n1","Q"],[{"w":2},"Shift","Fn"]]'));
    assert.deepEqual(s.keymap.layers[0].bindings, ['&kp ESC', '&kp N1', '&kp Q', '&kp LSHIFT', '&none']);
  });
});

describe('combineResults', () => {
  const layout = (name) => ({ layouts: [{ name, keys: [] }], keymap: null, project: null, errors: [] });
  const keymap = (id) => ({ layouts: [], keymap: { id }, project: null, errors: [] });

  test('merges layouts from files imported together and keeps the last keymap', () => {
    const [only] = combineResults([
      { name: '5column.dtsi', result: layout('5 Column') },
      { name: 'a.keymap', result: keymap('a') },
      { name: '6column.dtsi', result: layout('6 Column') },
      { name: 'corne.keymap', result: keymap('b') },
    ]);
    assert.equal(only.name, 'corne.keymap');
    assert.deepEqual(only.result.layouts.map((l) => l.name), ['5 Column', '6 Column']);
    assert.deepEqual(only.result.keymap, { id: 'b' });
  });

  test('keeps projects separate', () => {
    const project = { layouts: [], keymap: null, project: { p: 1 }, errors: [] };
    const out = combineResults([{ name: 'x.json', result: project }, { name: 'l.dtsi', result: layout('L') }]);
    assert.deepEqual(out.map((e) => e.name), ['l.dtsi', 'x.json']);
  });
});

describe('helper macro keymaps', () => {
  test('are detected with a specific error', () => {
    const r = importText('#include <zmk-helpers/helper.h>\nZMK_LAYER(base, &kp A &kp B)\n');
    assert.equal(r.errorKind, 'helper-macros');
    assert.match(r.errors[0], /helper macros/);
  });
});

describe('GitHub URLs', () => {
  test('parseGithubUrl recognizes repos, trees, blobs and raw links', () => {
    assert.deepEqual(parseGithubUrl('https://github.com/me/zmk-config'), { kind: 'repo', owner: 'me', repo: 'zmk-config', ref: null, path: '' });
    assert.deepEqual(parseGithubUrl('https://github.com/me/zmk-config.git/'), { kind: 'repo', owner: 'me', repo: 'zmk-config', ref: null, path: '' });
    assert.deepEqual(parseGithubUrl('https://github.com/me/r/tree/main/boards/x'), { kind: 'repo', owner: 'me', repo: 'r', ref: 'main', path: 'boards/x' });
    assert.equal(parseGithubUrl('https://github.com/me/r/blob/main/config/a.keymap').kind, 'file');
    assert.equal(parseGithubUrl('https://raw.githubusercontent.com/me/r/main/a.keymap').kind, 'file');
    assert.equal(parseGithubUrl('https://example.com/a.keymap'), null);
    assert.equal(rawUrl({ owner: 'o', repo: 'r', ref: 'main', path: 'a/b.keymap' }), 'https://raw.githubusercontent.com/o/r/main/a/b.keymap');
  });

  const tree = [
    { type: 'blob', path: 'README.md' },
    { type: 'blob', path: 'config/corne.keymap' },
    { type: 'blob', path: 'boards/shields/elvn/elvn.keymap' },
    { type: 'blob', path: 'boards/shields/elvn/elvn-layouts.dtsi' },
    { type: 'blob', path: 'boards/shields/elvn/elvn.overlay' },
    { type: 'tree', path: 'config' },
  ];

  test('repoFiles lists importable files and preselects likely ones', () => {
    assert.deepEqual(repoFiles(tree), [
      { path: 'config/corne.keymap', kind: 'keymap', selected: true },
      { path: 'boards/shields/elvn/elvn.keymap', kind: 'keymap', selected: false },
      { path: 'boards/shields/elvn/elvn-layouts.dtsi', kind: 'layout', selected: true },
      { path: 'boards/shields/elvn/elvn.overlay', kind: 'layout', selected: false },
    ]);
    assert.deepEqual(repoFiles(tree, 'boards/shields/elvn').map((f) => [f.path.split('/').pop(), f.selected]), [
      ['elvn.keymap', true],
      ['elvn-layouts.dtsi', true],
      ['elvn.overlay', false],
    ]);
  });

  test('importOrder puts keymaps last', () => {
    assert.deepEqual(importOrder(['a.keymap', 'b.dtsi', 'c.json']), ['b.dtsi', 'c.json', 'a.keymap']);
  });

  test('listRepo resolves the default branch and reports API errors', async () => {
    const calls = [];
    const fake = async (url) => {
      calls.push(url);
      if (url.endsWith('/repos/o/r')) return { ok: true, status: 200, json: async () => ({ default_branch: 'main' }) };
      return { ok: true, status: 200, json: async () => ({ tree, truncated: false }) };
    };
    const res = await listRepo({ owner: 'o', repo: 'r', ref: null, path: '' }, fake);
    assert.equal(res.ref, 'main');
    assert.equal(res.files.length, 4);
    assert.match(calls[1], /git\/trees\/main\?recursive=1$/);
    const limited = async () => ({ ok: false, status: 403 });
    await assert.rejects(listRepo({ owner: 'o', repo: 'r', ref: 'x', path: '' }, limited), /rate limit/);
  });
});
