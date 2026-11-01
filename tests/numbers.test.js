import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { parseOptionalUint } from '../src/core/numbers.js';

describe('number field input', () => {
  test('empty means "not set", so the property is left out', () => {
    assert.equal(parseOptionalUint(''), null);
    assert.equal(parseOptionalUint('   '), null);
    assert.equal(parseOptionalUint(null), null);
  });

  test('whole numbers are read, ignoring surrounding spaces and leading zeros', () => {
    assert.equal(parseOptionalUint('180'), 180);
    assert.equal(parseOptionalUint('0'), 0);
    assert.equal(parseOptionalUint(' 0180 '), 180);
    assert.equal(parseOptionalUint('4294967295'), 4294967295);
  });

  test('anything a ZMK millisecond property cannot hold is invalid', () => {
    for (const text of [
      '18o',
      'abc',
      '-5',
      '1.5',
      '1e3',
      '+5',
      '0x10',
      '1 000',
      '4294967296',
      '99999999999999999999',
    ]) {
      assert.equal(parseOptionalUint(text), undefined, text);
    }
  });
});
