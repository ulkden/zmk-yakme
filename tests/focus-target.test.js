import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusIds, focusTarget } from '../src/core/focus-target.js';

test('identities number repeated names in order', () => {
  assert.deepEqual(focusIds(['save', 'chip:Base', 'chip:Base', 'save']), [
    'save#0',
    'chip:Base#0',
    'chip:Base#1',
    'save#1',
  ]);
});

test('focus returns to the same control after a re-render', () => {
  const before = focusIds(['key-0', 'key-1', 'key-2']);
  assert.equal(focusTarget(before, 1, before), 1);
  assert.equal(focusTarget(before, 1, focusIds(['new', 'key-0', 'key-1', 'key-2'])), 2);
});

test('a control that is gone or disabled hands focus to its next neighbour, then the previous one', () => {
  const before = focusIds(['combo-0', 'combo-1', 'combo-2', 'add']);
  assert.equal(focusTarget(before, 1, focusIds(['combo-0', 'combo-2', 'add'])), 1);
  assert.equal(focusTarget(before, 3, focusIds(['combo-0', 'combo-1', 'combo-2'])), 2);
  assert.equal(focusTarget(before, 1, focusIds(['combo-0', 'combo-1', 'combo-2', 'add']), [1]), 2);
});

test('nothing to focus when no control is left', () => {
  assert.equal(focusTarget(focusIds(['a']), 0, []), -1);
  assert.equal(focusTarget(focusIds(['a', 'b']), 0, focusIds(['c'])), -1);
});
