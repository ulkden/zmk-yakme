// Physical layouts from JSON: QMK `info.json` and KLE raw data.

const num = (v, d) => (typeof v === 'number' && Number.isFinite(v) ? v : d);

function normKey(k) {
  return { x: num(k.x, 0), y: num(k.y, 0), w: num(k.w, 1), h: num(k.h, 1), r: num(k.r, 0), rx: num(k.rx, 0), ry: num(k.ry, 0) };
}

export function parseQmkLayouts(info) {
  const layouts = info?.layouts ?? {};
  return Object.entries(layouts)
    .filter(([, l]) => Array.isArray(l?.layout))
    .map(([name, l]) => ({ name, keys: l.layout.map(normKey) }));
}

function applyProps(cur, item, first) {
  if (!first && (item.r != null || item.rx != null || item.ry != null)) {
    throw new Error('KLE rotation can only be set at the start of a row');
  }
  if (item.r != null) cur.r = item.r;
  if (item.rx != null) {
    cur.rx = cur.clusterX = item.rx;
    cur.x = cur.clusterX;
    cur.y = cur.clusterY;
  }
  if (item.ry != null) {
    cur.ry = cur.clusterY = item.ry;
    cur.x = cur.clusterX;
    cur.y = cur.clusterY;
  }
  if (item.x) cur.x += item.x;
  if (item.y) cur.y += item.y;
  if (item.w) cur.w = item.w;
  if (item.h) cur.h = item.h;
}

export function parseKleLayout(data, name = 'KLE layout') {
  const cur = { x: 0, y: 0, w: 1, h: 1, r: 0, rx: 0, ry: 0, clusterX: 0, clusterY: 0 };
  const keys = [];
  const rows = data.some(Array.isArray) ? data : [data];
  for (const row of rows) {
    if (!Array.isArray(row)) continue; // metadata object
    row.forEach((item, idx) => {
      if (typeof item === 'string') {
        keys.push({ x: cur.x, y: cur.y, w: cur.w, h: cur.h, r: cur.r, rx: cur.rx, ry: cur.ry });
        cur.x += cur.w;
        cur.w = 1;
        cur.h = 1;
      } else if (item && typeof item === 'object') {
        applyProps(cur, item, idx === 0);
      }
    });
    cur.y += 1;
    cur.x = cur.rx;
  }
  return { name, keys };
}
