import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { addedWarnings, stillDismissed, newWarningsMessage, joinMessages } from '../src/core/warning-diff.js';

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

test('new warnings are read out: the warning itself, or how many', () => {
  assert.equal(newWarningsMessage([]), null);
  assert.equal(
    newWarningsMessage(['Combo "c" needs at least 2 keys.']),
    'New warning: Combo "c" needs at least 2 keys.',
  );
  assert.equal(
    newWarningsMessage(['a', 'b', 'c']),
    '3 new warnings. Open the warnings in the status bar to read them.',
  );
  assert.equal(newWarningsMessage(['a', 'b'], { open: true }), '2 new warnings in the warnings list.');
});

test('messages sent together are joined into one, in order, without repeats', () => {
  assert.equal(joinMessages(['Imported keymap', 'New warning: x.']), 'Imported keymap. New warning: x.');
  assert.equal(joinMessages(['Delete it?', 'Done']), 'Delete it? Done.');
  assert.equal(joinMessages(['a', 'a', 'b']), 'a. b.');
  assert.equal(joinMessages(['1', '2', '3', '4', '5']), '3. 4. 5.');
  assert.equal(joinMessages(['File a.. b']), 'File a.. b');
});
