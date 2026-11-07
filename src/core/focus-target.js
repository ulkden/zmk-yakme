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
export function focusTarget(before, index, after, unusable = []) {
  const usable = (i) => i >= 0 && !unusable.includes(i);
  const all = before.map((_, i) => i);
  const order = [index, ...all.filter((i) => i > index), ...all.filter((i) => i < index).reverse()];
  for (const i of order) {
    const j = after.indexOf(before[i]);
    if (usable(j)) return j;
  }
  return -1;
}
