// Helpers for ZMK binding strings such as `&mt LSHIFT A`.

// Split on whitespace that is not inside parentheses; whitespace inside parens is removed.
export function splitParams(text) {
  const out = [];
  let cur = '';
  let depth = 0;
  for (const c of String(text ?? '')) {
    if (c === '(') depth++;
    else if (c === ')') depth = Math.max(0, depth - 1);
    if (/\s/.test(c)) {
      if (depth > 0) continue;
      if (cur) out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  if (cur) out.push(cur);
  return out;
}

// Optional parameters (e.g. the profile in `&bt BT_SEL 0`) are only ever numbers.
function takesParam(range, have, tok) {
  if (!range || have < range.min) return true;
  return have < range.max && /^[\d(]/.test(tok);
}

// Turn the inner text of a `bindings = <...>` property into binding strings. Without `arity`,
// every token up to the next `&` is a parameter. With `arity` (behavior name → { min, max }
// parameter counts, or null when unknown), a bare name after a complete binding is a binding of
// its own, because keymaps can #define whole bindings (Miryoku's `U_NA` for `&none`).
export function splitBindings(cells, arity = null) {
  const groups = [];
  let range = null;
  for (const tok of splitParams(cells)) {
    const last = groups[groups.length - 1];
    if (tok.startsWith('&')) {
      groups.push([tok]);
      range = arity ? arity(tok.slice(1)) : null;
    } else if (last && takesParam(range, last.length - 1, tok)) {
      last.push(tok);
    } else if (arity) {
      groups.push([tok]);
      range = { min: 0, max: 0 };
    }
  }
  return groups.map((g) => g.join(' '));
}

// Number of bindings beginning on each non-empty line (used to infer a grid layout).
export function bindingsPerLine(cells, arity = null) {
  return String(cells ?? '')
    .split('\n')
    .map((line) => splitBindings(line, arity).length)
    .filter((n) => n > 0);
}

export function parseBinding(str) {
  const [head = '', ...params] = splitParams(str);
  return { behavior: head.replace(/^&/, ''), params };
}

export function formatBinding(behavior, params = []) {
  const parts = params.map((p) => String(p ?? '').trim()).filter(Boolean);
  return ['&' + behavior, ...parts].join(' ');
}

export function normalizeBinding(str) {
  return splitParams(str).join(' ');
}
