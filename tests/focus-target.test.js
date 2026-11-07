import { test } from 'node:test';
import assert from 'node:assert/strict';
import { focusIds, focusTarget, rovingStep } from '../src/core/focus-target.js';

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
  const disabled = (j) => j === 1;
  assert.equal(focusTarget(before, 1, focusIds(['combo-0', 'combo-1', 'combo-2', 'add']), disabled), 2);
});

test('only the candidates tried are checked for usability', () => {
  const ids = focusIds(['a', 'b', 'c', 'd']);
  const checked = [];
  focusTarget(ids, 1, ids, (j) => (checked.push(j), false));
  assert.deepEqual(checked, [1]);
});

test('nothing to focus when no control is left', () => {
  assert.equal(focusTarget(focusIds(['a']), 0, []), -1);
  assert.equal(focusTarget(focusIds(['a', 'b']), 0, focusIds(['c'])), -1);
});

test('roving keys: arrows step (optionally wrapping), Home/End go to the ends', () => {
  assert.equal(rovingStep('ArrowRight', 1, 3), 2);
  assert.equal(rovingStep('ArrowRight', 2, 3), 2);
  assert.equal(rovingStep('ArrowRight', 2, 3, { wrap: true }), 0);
  assert.equal(rovingStep('ArrowLeft', 0, 3, { wrap: true }), 2);
  assert.equal(rovingStep('ArrowLeft', 0, 3), 0);
  assert.equal(rovingStep('Home', 2, 3), 0);
  assert.equal(rovingStep('End', 0, 3), 2);
  assert.equal(rovingStep('ArrowUp', 1, 3), undefined);
  assert.equal(rovingStep('a', 1, 3), undefined);
});
