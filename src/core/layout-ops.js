// Geometry helpers for physical layouts.

export function gridLayout(rowLengths, name = 'Grid') {
  const keys = [];
  rowLengths.forEach((n, y) => {
    for (let x = 0; x < n; x++) keys.push({ x, y, w: 1, h: 1, r: 0, rx: 0, ry: 0 });
  });
  return { name, keys };
}

// Group keys (in order) into rows. A new row starts when x moves left by more than half a
// key, or y jumps by 1.5u or more. Column stagger within a row (common on splits) does not
// start a row, which a plain y-based rule got wrong on boards like the Lily58 or Ferris.
export function rowsFromLayout(keys) {
  const rows = [];
  let prev = null;
  for (const key of keys) {
    if (!prev || key.x < prev.x - 0.5 || Math.abs(key.y - prev.y) >= 1.5) rows.push(0);
    rows[rows.length - 1]++;
    prev = key;
  }
  return rows;
}

export function keyCorners(key) {
  const pts = [
    [key.x, key.y],
    [key.x + key.w, key.y],
    [key.x + key.w, key.y + key.h],
    [key.x, key.y + key.h],
  ];
  if (!key.r) return pts;
  const a = (key.r * Math.PI) / 180;
  const cos = Math.cos(a);
  const sin = Math.sin(a);
  return pts.map(([x, y]) => {
    const dx = x - key.rx;
    const dy = y - key.ry;
    return [key.rx + dx * cos - dy * sin, key.ry + dx * sin + dy * cos];
  });
}

export function layoutBounds(keys) {
  if (!keys.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const key of keys) {
    for (const [x, y] of keyCorners(key)) {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }
  return { minX, minY, maxX, maxY };
}

export function keyCenter(key) {
  const pts = keyCorners(key);
  return [(pts[0][0] + pts[2][0]) / 2, (pts[0][1] + pts[2][1]) / 2];
}

const DIRS = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

// Index of the physically nearest key from `from` in a direction, or `from` if none.
// Keys far off the direction's axis are penalized so ↓ prefers the key straight below.
export function nearestKey(keys, from, dir) {
  const [dx, dy] = DIRS[dir];
  const [fx, fy] = keyCenter(keys[from]);
  let best = from;
  let bestScore = Infinity;
  keys.forEach((key, i) => {
    if (i === from) return;
    const [x, y] = keyCenter(key);
    const along = (x - fx) * dx + (y - fy) * dy;
    if (along < 0.25) return;
    const across = Math.abs((x - fx) * dy - (y - fy) * dx);
    const score = along + across * 2;
    if (score < bestScore) {
      bestScore = score;
      best = i;
    }
  });
  return best;
}
