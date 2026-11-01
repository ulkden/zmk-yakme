// Stepping a number field with the mouse wheel. An empty field ("default") is left alone.
import { MAX_U32, parseOptionalUint } from './numbers.js';

// Returns the next value, or null when the field has no whole number to step: empty, or text the
// field would refuse anyway (e.g. 1.5), which the user should fix by typing.
export function stepValue(current, delta, { min = 0, max = MAX_U32 } = {}) {
  const n = parseOptionalUint(current);
  if (n == null) return null;
  return Math.min(max, Math.max(min, n + delta));
}
