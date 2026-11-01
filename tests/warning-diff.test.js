import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { addedWarnings, stillDismissed } from '../src/core/warning-diff.js';

describe('warning changes', () => {
  test('finds warnings that were not there before', () => {
    assert.deepEqual(addedWarnings([], ['a', 'b']), ['a', 'b']);
    assert.deepEqual(addedWarnings(['a', 'b'], ['b', 'c']), ['c']);
    assert.deepEqual(addedWarnings(['a'], ['a']), []);
  });

  test('keeps a cleared warning hidden only while it still applies', () => {
    assert.deepEqual([...stillDismissed(new Set(['a', 'b']), ['a', 'c'])], ['a']);
    assert.deepEqual([...stillDismissed(new Set(['a']), [])], []);
  });
});
