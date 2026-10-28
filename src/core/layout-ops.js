// Geometry helpers for physical layouts.

export function gridLayout(rowLengths, name = 'Grid') {
  const keys = [];
  rowLengths.forEach((n, y) => {
    for (let x = 0; x < n; x++) keys.push({ x, y, w: 1, h: 1, r: 0, rx: 0, ry: 0 });
  });
  return { name, keys };
}

// Group keys (in order) into rows: a new row starts when y moves by >= 0.5u or x goes backwards.
export function rowsFromLayout(keys) {
  const rows = [];
  let rowY = null;
  let prevX = -Infinity;
  for (const key of keys) {
    if (rowY === null || Math.abs(key.y - rowY) >= 0.5 || key.x < prevX) {
      rows.push(0);
      rowY = key.y;
    }
    rows[rows.length - 1]++;
    prevX = key.x;
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
