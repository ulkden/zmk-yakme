// Reading the side panels' number fields (timeouts and tapping terms, in milliseconds).

// ZMK stores these as 32-bit unsigned devicetree cells.
export const MAX_U32 = 4294967295;

// Field text to a value: '' → null (property left out), a whole number → that number,
// anything else → undefined (invalid, so the field keeps its previous value).
export function parseOptionalUint(text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed === '') return null;
  if (!/^\d+$/.test(trimmed)) return undefined;
  const n = Number(trimmed);
  return n <= MAX_U32 ? n : undefined;
}
