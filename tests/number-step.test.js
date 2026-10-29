import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { stepValue } from '../src/core/number-step.js';

describe('stepValue', () => {
  test('steps up and down within min and max', () => {
    assert.equal(stepValue('200', 10), 210);
    assert.equal(stepValue('5', -10), 0);
    assert.equal(stepValue('31', 1, { min: 1, max: 32 }), 32);
    assert.equal(stepValue('32', 1, { min: 1, max: 32 }), 32);
    assert.equal(stepValue('1', -1, { min: 1, max: 32 }), 1);
  });

  test('leaves an empty or non-numeric field alone', () => {
    assert.equal(stepValue('', 10), null);
    assert.equal(stepValue('  ', 1), null);
    assert.equal(stepValue(null, 1), null);
    assert.equal(stepValue('abc', 1), null);
  });

  test('steps whole numbers only, as the fields accept, and never past a u32', () => {
    for (const text of ['1.5', '1e3', '0x10', '-5', '18o']) assert.equal(stepValue(text, 10), null, text);
    assert.equal(stepValue(' 0180 ', 10), 190);
    assert.equal(stepValue('4294967290', 10), 4294967295);
  });
});
