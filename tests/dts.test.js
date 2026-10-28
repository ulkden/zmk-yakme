import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { maskNonCode } from '../src/dts/mask.js';
import { tokenize } from '../src/dts/tokenize.js';
import { parseDts, findNodes, propString, propCells } from '../src/dts/parse.js';
import { evalExpr } from '../src/dts/expr.js';
import { FULL_KEYMAP } from './fixtures/full-keymap.js';

describe('maskNonCode', () => {
  test('blanks comments but keeps offsets and newlines', () => {
    const src = 'a // hi\nb /* x\ny */ c';
    const out = maskNonCode(src);
    assert.equal(out.length, src.length);
    assert.equal(out, 'a      \nb     \n     c');
  });

  test('blanks preprocessor directives but not #binding-cells', () => {
    const src = '#include <x.h>\n  #binding-cells = <1>;\n#define FOO \\\n  1\nz';
    const out = maskNonCode(src);
    assert.equal(out.split('\n')[0].trim(), '');
    assert.match(out, /#binding-cells = <1>;/);
    assert.equal(out.split('\n')[2].trim(), '');
    assert.equal(out.split('\n')[3].trim(), '');
    assert.equal(out.split('\n')[4], 'z');
  });

  test('does not treat // inside strings as comments', () => {
    const src = 'url = "http://x";';
    assert.equal(maskNonCode(src), src);
  });
});

describe('tokenize', () => {
  test('produces structural, cell and word tokens', () => {
    const toks = tokenize('a: b { c = <&kp LC(A) 1>, "s"; };');
    assert.deepEqual(
      toks.map((t) => t.type),
      ['word', ':', 'word', '{', 'word', '=', 'cells', ',', 'str', ';', '}', ';'],
    );
    assert.equal(toks[6].value, '&kp LC(A) 1');
    assert.equal(toks[8].value, 's');
  });

  test('keeps macro calls with spaces as one word', () => {
    const toks = tokenize('ZMK_COMBO(esc, &kp ESC, 0 1) x');
    assert.equal(toks[0].value, 'ZMK_COMBO(esc, &kp ESC, 0 1)');
    assert.equal(toks[1].value, 'x');
  });

  test('cells may contain > inside parentheses', () => {
    const toks = tokenize('<(1 >> 0) 2>');
    assert.equal(toks[0].value, '(1 >> 0) 2');
  });
});

describe('parseDts', () => {
  test('builds a node tree with labels, props and ranges', () => {
    const src = '/ { lbl: node { compatible = "x"; flag; }; };';
    const root = parseDts(src);
    const slash = root.children[0];
    assert.equal(slash.name, '/');
    const node = slash.children[0];
    assert.equal(node.name, 'node');
    assert.deepEqual(node.labels, ['lbl']);
    assert.equal(propString(node, 'compatible'), 'x');
    assert.equal(node.props[1].name, 'flag');
    assert.equal(src.slice(node.start, node.end), 'lbl: node { compatible = "x"; flag; };');
  });

  test('parses a realistic keymap file', () => {
    const root = parseDts(FULL_KEYMAP);
    const keymaps = findNodes(root, (n) => propString(n, 'compatible') === 'zmk,keymap');
    assert.equal(keymaps.length, 1);
    assert.deepEqual(
      keymaps[0].children.map((c) => c.name),
      ['default_layer', 'lower_layer'],
    );
    const base = keymaps[0].children[0];
    assert.match(propCells(base, 'bindings'), /&hm LSHIFT A/);
    const hm = findNodes(root, (n) => n.labels.includes('hm'))[0];
    assert.equal(propCells(hm, '#binding-cells').trim(), '2');
  });

  test('skips macro statements without breaking following nodes', () => {
    const root = parseDts('/ { ZMK_LAYER(x, &kp A) after { a = <1>; }; };');
    assert.deepEqual(
      root.children[0].children.map((c) => c.name),
      ['after'],
    );
  });
});

describe('evalExpr', () => {
  test('evaluates integers and simple expressions', () => {
    assert.equal(evalExpr('100'), 100);
    assert.equal(evalExpr('(-500)'), -500);
    assert.equal(evalExpr('(1 + 2) * 3'), 9);
    assert.equal(evalExpr('0x10'), 16);
    assert.equal(evalExpr('10 / 4'), 2);
    assert.ok(Number.isNaN(evalExpr('FOO')));
  });
});
