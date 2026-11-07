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

// What screen readers hear when warnings appear: the warning itself, or how many there are.
export function newWarningsMessage(added, { open = false } = {}) {
  if (!added.length) return null;
  if (added.length === 1) return `New warning: ${added[0]}`;
  if (open) return `${added.length} new warnings in the warnings list.`;
  return `${added.length} new warnings. Open the warnings in the status bar to read them.`;
}

// Several messages sent at once, read as one: in order, without repeats, the last few only, each
// ending in punctuation so screen readers pause between them.
const MAX_JOINED = 3;
export function joinMessages(messages) {
  const unique = messages.filter((m, i) => m && messages.indexOf(m) === i).slice(-MAX_JOINED);
  if (unique.length === 1) return unique[0];
  return unique.map((m) => (/[.!?:…]$/.test(m) ? m : `${m}.`)).join(' ');
}
