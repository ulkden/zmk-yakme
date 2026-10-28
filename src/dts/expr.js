// Tiny integer expression evaluator for devicetree cell values such as
// `(-500)`, `0x10` or `(1 + 2) * 3`. Returns NaN for anything it cannot evaluate.

function lex(src) {
  const re = /\s*(0x[0-9a-fA-F]+|\d+|[-+*/%()])/y;
  const out = [];
  let pos = 0;
  for (;;) {
    re.lastIndex = pos;
    const m = re.exec(src);
    if (!m) break;
    out.push(m[1]);
    pos = re.lastIndex;
  }
  return src.slice(pos).trim() === '' ? out : null;
}

export function evalExpr(src) {
  const toks = lex(String(src));
  if (!toks || toks.length === 0) return NaN;
  let i = 0;
  const peek = () => toks[i];

  function primary() {
    const t = toks[i++];
    if (t === undefined) throw new Error('eof');
    if (t === '(') {
      const v = sum();
      if (toks[i++] !== ')') throw new Error('paren');
      return v;
    }
    if (t === '-') return -primary();
    if (t === '+') return primary();
    if (/^0x/.test(t)) return parseInt(t, 16);
    if (/^\d+$/.test(t)) return parseInt(t, 10);
    throw new Error('token');
  }

  function product() {
    let v = primary();
    while (['*', '/', '%'].includes(peek())) {
      const op = toks[i++];
      const r = primary();
      if (op === '*') v *= r;
      else if (op === '/') v = Math.trunc(v / r);
      else v %= r;
    }
    return v;
  }

  function sum() {
    let v = product();
    while (peek() === '+' || peek() === '-') {
      const op = toks[i++];
      const r = product();
      v = op === '+' ? v + r : v - r;
    }
    return v;
  }

  try {
    const v = sum();
    return i === toks.length && Number.isFinite(v) ? v : NaN;
  } catch {
    return NaN;
  }
}
