import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { countRefs, refHolders, rewriteRefs } from '../src/core/source-refs.js';
import { parseKeymap } from '../src/core/keymap-parse.js';
import { writeKeymap } from '../src/core/keymap-write.js';
import { countBehaviorUses, removeBehavior, updateBehavior } from '../src/core/behavior-ops.js';
import { VERBATIM_REFS_KEYMAP as SRC } from './fixtures/verbatim-refs.js';

describe('references kept verbatim', () => {
  test('counts code references outside regenerated nodes, not comments or overrides', () => {
    assert.equal(countRefs(SRC, 'hmr', true), 2);
    assert.equal(countRefs(SRC, 'hm', true), 0);
    assert.deepEqual(refHolders(SRC, 'hmr'), ['#define', '&td0']);
  });

  test('rename follows the tap-dance, the override and the #define, and leaves comments alone', () => {
    const out = rewriteRefs(SRC, 'hmr', 'hrm', 2, true);
    assert.match(out, /#define HM_J &hrm RSHIFT J/);
    assert.match(out, /^&hrm \{ quick-tap-ms/m);
    assert.match(out, /bindings = <&hrm RGUI LS\(SEMI\)>, <&kp SQT>; \/\/ &hmr in a comment/);
    // The keymap node is regenerated from the model, so its text is left to the writer.
    assert.match(out, /bindings = <&hmr RCTRL K &td0>/);
  });

  test('delete replaces each use and its parameters with &none and removes overrides', () => {
    const out = rewriteRefs(SRC, 'hmr', null, 2, true);
    assert.match(out, /#define HM_J &none\n/);
    assert.doesNotMatch(out, /quick-tap-ms/);
    assert.match(out, /bindings = <&none>, <&kp SQT>;/);
  });

  test('behavior ops update the model, extra properties and the source together', () => {
    const km = parseKeymap(SRC);
    assert.equal(countBehaviorUses(km, 'hmr'), 4);
    const renamed = writeKeymap(updateBehavior(km, 0, { label: 'hrm' }));
    assert.doesNotMatch(renamed.replace(/\/\/.*$/gm, ''), /&hmr\b/);
    const deleted = writeKeymap(removeBehavior(km, 0));
    assert.doesNotMatch(deleted.replace(/\/\/.*$/gm, ''), /&hmr\b/);
    assert.match(deleted, /sensor-bindings = <&none>;/);
    assert.deepEqual(parseKeymap(deleted).layers[0].bindings, ['&none', '&td0']);
    assert.match(deleted, /keys\.h>\n#define HM_J &none\n\/ \{/);
  });
});
