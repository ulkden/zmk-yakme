// Minimal browser stand-in for `node:assert/strict` (only the methods the tests use).
class AssertionError extends Error {}

function fail(message, actual, expected) {
  const detail = `\n  actual:   ${show(actual)}\n  expected: ${show(expected)}`;
  throw new AssertionError((message || 'Assertion failed') + detail);
}

function show(v) {
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function deepEq(a, b) {
  if (Object.is(a, b)) return true;
  if (typeof a !== 'object' || typeof b !== 'object' || !a || !b) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a);
  const kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEq(a[k], b[k]));
}

function assert(value, message) {
  if (!value) fail(message, value, true);
}

assert.ok = assert;
assert.equal = (a, b, m) => Object.is(a, b) || fail(m, a, b);
assert.notEqual = (a, b, m) => !Object.is(a, b) || fail(m, a, b);
assert.deepEqual = (a, b, m) => deepEq(a, b) || fail(m, a, b);
assert.match = (s, re, m) => re.test(s) || fail(m, s, String(re));
assert.doesNotMatch = (s, re, m) => !re.test(s) || fail(m, s, `not ${re}`);
assert.throws = (fn, m) => {
  try {
    fn();
  } catch {
    return;
  }
  fail(m || 'Expected function to throw', 'no throw', 'throw');
};

export default assert;
export const strict = assert;
