// Stepping a number field with the mouse wheel. An empty field ("default") is left alone.

// Returns the next value, or null when the field has no number to step.
export function stepValue(current, delta, { min = 0, max = Infinity } = {}) {
  const text = String(current ?? '').trim();
  if (text === '' || Number.isNaN(Number(text))) return null;
  return Math.min(max, Math.max(min, Number(text) + delta));
}
