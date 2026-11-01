import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { legendToBinding, legendToCode } from '../src/core/legends.js';
import {
  parseGithubUrl,
  repoFiles,
  groupRepoFiles,
  importOrder,
  listRepo,
  rawUrl,
  isAllowedUrl,
} from '../src/core/github.js';
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
    assert.deepEqual(
      only.result.layouts.map((l) => l.name),
      ['5 Column', '6 Column'],
    );
    assert.deepEqual(only.result.keymap, { id: 'b' });
  });

  test('keeps projects separate', () => {
    const project = { layouts: [], keymap: null, project: { p: 1 }, errors: [] };
    const out = combineResults([
      { name: 'x.json', result: project },
      { name: 'l.dtsi', result: layout('L') },
    ]);
    assert.deepEqual(
      out.map((e) => e.name),
      ['l.dtsi', 'x.json'],
    );
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
    assert.deepEqual(parseGithubUrl('https://github.com/me/zmk-config'), {
      kind: 'repo',
      owner: 'me',
      repo: 'zmk-config',
      ref: null,
      path: '',
    });
    assert.deepEqual(parseGithubUrl('https://github.com/me/zmk-config.git/'), {
      kind: 'repo',
      owner: 'me',
      repo: 'zmk-config',
      ref: null,
      path: '',
    });
    assert.deepEqual(parseGithubUrl('https://github.com/me/r/tree/main/boards/x'), {
      kind: 'repo',
      owner: 'me',
      repo: 'r',
      ref: 'main',
      path: 'boards/x',
    });
    assert.equal(parseGithubUrl('https://github.com/me/r/blob/main/config/a.keymap').kind, 'file');
    assert.equal(parseGithubUrl('https://raw.githubusercontent.com/me/r/main/a.keymap').kind, 'file');
    assert.equal(parseGithubUrl('https://example.com/a.keymap'), null);
    assert.equal(
      rawUrl({ owner: 'o', repo: 'r', ref: 'main', path: 'a/b.keymap' }),
      'https://raw.githubusercontent.com/o/r/main/a/b.keymap',
    );
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
      {
        path: 'config/corne.keymap',
        kind: 'keymap',
        folder: '',
        label: 'config/corne.keymap',
        selected: true,
        relevant: true,
      },
      {
        path: 'boards/shields/elvn/elvn.keymap',
        kind: 'keymap',
        folder: '',
        label: 'boards/shields/elvn/elvn.keymap',
        selected: false,
        relevant: true,
      },
      {
        path: 'boards/shields/elvn/elvn-layouts.dtsi',
        kind: 'layout',
        folder: '',
        label: 'boards/shields/elvn/elvn-layouts.dtsi',
        selected: true,
        relevant: true,
      },
      {
        path: 'boards/shields/elvn/elvn.overlay',
        kind: 'layout',
        folder: '',
        label: 'boards/shields/elvn/elvn.overlay',
        selected: false,
        relevant: false,
      },
    ]);
    assert.deepEqual(
      repoFiles(tree, 'boards/shields/elvn').map((f) => [f.path.split('/').pop(), f.selected]),
      [
        ['elvn.keymap', true],
        ['elvn-layouts.dtsi', true],
        ['elvn.overlay', false],
      ],
    );
  });

  test('repoFiles marks keymaps and likely layouts as relevant, and the rest not', () => {
    const files = repoFiles([
      { type: 'blob', path: '.vscode/settings.json' },
      { type: 'blob', path: 'zen/corneish_zen.keymap' },
      { type: 'blob', path: 'boards/shields/cygnus/cygnus.dtsi' },
      { type: 'blob', path: 'boards/shields/cygnus/cygnus_left.overlay' },
      { type: 'blob', path: 'boards/shields/cygnus/cygnus-physical.dtsi' },
      { type: 'blob', path: 'Scotto34/QMK/keyboard.json' },
      { type: 'blob', path: 'qmk/info.json' },
      { type: 'blob', path: 'keymap.json' },
    ]);
    assert.deepEqual(
      files.map((f) => [f.path.split('/').pop(), f.relevant]),
      [
        ['settings.json', false],
        ['corneish_zen.keymap', true],
        ['cygnus.dtsi', false],
        ['cygnus_left.overlay', false],
        ['cygnus-physical.dtsi', true],
        ['keyboard.json', true],
        ['info.json', true],
        ['keymap.json', false],
      ],
    );
    // A preselected file is always relevant, so the picker never hides a ticked file.
    assert.ok(files.every((f) => !f.selected || f.relevant));
  });

  // A repository holding several keyboards, one per top-level folder (like joe-scotto/scottokeebs).
  const multi = [
    'ScottoFrog/QMK/keyboard.json',
    'ScottoFrog/ZMK/boards/shields/frog/frog.keymap',
    'ScottoFrog/ZMK/boards/shields/frog/frog_left.overlay',
    'ScottoWing/QMK/keyboard.json',
    'ScottoWing/ZMK/config/wing.keymap',
    '.github/workflows/build.yml.json',
    'README.json',
  ].map((path) => ({ type: 'blob', path }));

  test('repoFiles groups a multi-keyboard repository by top-level folder and preselects one keyboard', () => {
    const files = repoFiles(multi);
    assert.deepEqual(
      files.map((f) => [f.path, f.folder, f.selected]),
      [
        ['ScottoFrog/QMK/keyboard.json', 'ScottoFrog', true],
        ['ScottoFrog/ZMK/boards/shields/frog/frog.keymap', 'ScottoFrog', true],
        ['ScottoFrog/ZMK/boards/shields/frog/frog_left.overlay', 'ScottoFrog', false],
        ['ScottoWing/QMK/keyboard.json', 'ScottoWing', false],
        ['ScottoWing/ZMK/config/wing.keymap', 'ScottoWing', false],
        ['.github/workflows/build.yml.json', '.github', false],
        ['README.json', '', false],
      ],
    );
    assert.equal(files[1].label, 'ZMK/boards/shields/frog/frog.keymap');
    assert.deepEqual(
      groupRepoFiles(files).map((g) => [g.folder, g.files.length]),
      [
        ['', 1],
        ['ScottoFrog', 3],
        ['ScottoWing', 2],
        ['.github', 1],
      ],
    );
  });

  test('repoFiles keeps a standard zmk-config (config/ and boards/) as one ungrouped keyboard', () => {
    const files = repoFiles(
      [
        'boards/shields/cygnus/cygnus.keymap',
        'boards/shields/cygnus/layouts.dtsi',
        'config/cygnus.keymap',
        'config/hillside_view.keymap',
        '.vscode/settings.json',
      ].map((path) => ({ type: 'blob', path })),
    );
    assert.ok(files.every((f) => f.folder === ''));
    assert.deepEqual(
      files.filter((f) => f.selected).map((f) => f.path),
      ['boards/shields/cygnus/layouts.dtsi', 'config/cygnus.keymap'],
    );
    assert.equal(groupRepoFiles(files).length, 1);
  });

  test('repoFiles groups two keyboard folders, but not one, and relative to the listed folder', () => {
    const two = repoFiles(['sweep/cradio.keymap', 'zen/corneish_zen.keymap'].map((path) => ({ type: 'blob', path })));
    assert.deepEqual(
      two.map((f) => [f.folder, f.selected]),
      [
        ['sweep', true],
        ['zen', false],
      ],
    );
    const one = repoFiles(['config/a.keymap', 'extras/b.keymap'].map((path) => ({ type: 'blob', path })));
    assert.ok(one.every((f) => f.folder === ''));
    const based = repoFiles(multi, 'ScottoFrog');
    assert.ok(
      based.every((f) => f.folder === ''),
      'folders inside the listed one are not keyboards',
    );
  });

  test('repoFiles leaves a repository without keymaps flat, preselecting as before', () => {
    const files = repoFiles(['A/info.json', 'B/info.json'].map((path) => ({ type: 'blob', path })));
    assert.deepEqual(
      files.map((f) => [f.folder, f.selected]),
      [
        ['', true],
        ['', true],
      ],
    );
  });

  test('isAllowedUrl only accepts https GitHub hosts', () => {
    assert.equal(isAllowedUrl('https://github.com/me/r/blob/main/a.keymap'), true);
    assert.equal(isAllowedUrl('https://raw.githubusercontent.com/me/r/main/a.keymap'), true);
    assert.equal(isAllowedUrl('https://gist.githubusercontent.com/me/1/raw/a.keymap'), true);
    assert.equal(isAllowedUrl('http://github.com/me/r'), false);
    assert.equal(isAllowedUrl('https://github.com.evil.test/a'), false);
    assert.equal(isAllowedUrl('https://example.com/a.keymap'), false);
    assert.equal(isAllowedUrl('not a url'), false);
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
