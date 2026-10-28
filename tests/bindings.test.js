import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { splitParams, splitBindings, bindingsPerLine, parseBinding, formatBinding } from '../src/core/bindings.js';

describe('splitParams', () => {
  test('splits on whitespace outside parentheses and strips it inside', () => {
    assert.deepEqual(splitParams('&kp LC( A ) 1'), ['&kp', 'LC(A)', '1']);
  });
});

describe('splitBindings', () => {
  test('groups tokens by leading &', () => {
    const cells = '\n  &kp A &mt LSHIFT B\n  &trans  &bt BT_SEL 0\n';
    assert.deepEqual(splitBindings(cells), ['&kp A', '&mt LSHIFT B', '&trans', '&bt BT_SEL 0']);
  });

  test('normalizes whitespace inside parens', () => {
    assert.deepEqual(splitBindings('&kp LS( LC(A) )'), ['&kp LS(LC(A))']);
  });

  test('returns [] for empty input', () => {
    assert.deepEqual(splitBindings(''), []);
    assert.deepEqual(splitBindings(undefined), []);
  });
});

describe('bindingsPerLine', () => {
  test('counts bindings that start on each non-empty line', () => {
    assert.deepEqual(bindingsPerLine('\n &kp A &kp B\n\n &kp C &kp D &kp E\n'), [2, 3]);
  });
});

describe('parseBinding / formatBinding', () => {
  test('round-trips behavior and params', () => {
    const b = parseBinding('&mt LSHIFT A');
    assert.deepEqual(b, { behavior: 'mt', params: ['LSHIFT', 'A'] });
    assert.equal(formatBinding(b.behavior, b.params), '&mt LSHIFT A');
  });

  test('handles behaviors without params', () => {
    assert.deepEqual(parseBinding('&trans'), { behavior: 'trans', params: [] });
    assert.equal(formatBinding('trans', []), '&trans');
  });

  test('drops empty params when formatting', () => {
    assert.equal(formatBinding('bt', ['BT_CLR', '']), '&bt BT_CLR');
  });

  test('tolerates garbage', () => {
    assert.deepEqual(parseBinding(''), { behavior: '', params: [] });
  });
});
