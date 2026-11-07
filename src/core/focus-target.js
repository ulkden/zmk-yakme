// Where keyboard focus goes after a part of the screen is rebuilt. Each focusable control has a
// name (see focusName in src/ui/dom.js); repeated names are told apart by their order.

// ['save', 'chip', 'chip'] → ['save#0', 'chip#0', 'chip#1']
export function focusIds(names) {
  const seen = new Map();
  return names.map((name) => {
    const n = seen.get(name) ?? 0;
    seen.set(name, n + 1);
    return `${name}#${n}`;
  });
}

// Index in `after` to focus: the control that had focus (`before[index]`), or when it is gone or
// unusable (e.g. a deleted combo, a disabled Move Left), its nearest neighbour that is still
// there: first the ones after it, then the ones before. -1 when none is left.
// `unusable(j)` is asked only about candidates actually tried, since checking a control can force
// a layout. A control and its replacement (Delete → its Cancel) share a name, so focus follows it.
export function focusTarget(before, index, after, unusable = () => false) {
  const usable = (j) => j >= 0 && !unusable(j);
  const all = before.map((_, i) => i);
  const order = [index, ...all.filter((i) => i > index), ...all.filter((i) => i < index).reverse()];
  for (const i of order) {
    const j = after.indexOf(before[i]);
    if (usable(j)) return j;
  }
  return -1;
}

// Roving focus in a one-dimensional list (layer tabs, the palette's ←/→): the index that ←/→ and
// Home/End move to from `index` among `count` items, or undefined for any other key.
export function rovingStep(key, index, count, { wrap = false } = {}) {
  const last = count - 1;
  if (key === 'Home') return 0;
  if (key === 'End') return last;
  if (key === 'ArrowRight') return index < last ? index + 1 : wrap ? 0 : last;
  if (key === 'ArrowLeft') return index > 0 ? index - 1 : wrap ? last : 0;
  return undefined;
}
