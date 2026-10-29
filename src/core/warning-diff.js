// Which warnings are new since the last check, and which cleared ones still apply. Warnings are
// live checks on the keymap, so they are matched by their text.

// Texts in `next` that were not in `prev`.
export function addedWarnings(prev, next) {
  const before = new Set(prev);
  return next.filter((t) => !before.has(t));
}

// Cleared texts that still apply; a warning that went away and comes back is new again.
export function stillDismissed(dismissed, current) {
  const now = new Set(current);
  return new Set([...dismissed].filter((t) => now.has(t)));
}
