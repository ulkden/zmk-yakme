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

// Turn the inner text of a `bindings = <...>` property into binding strings.
export function splitBindings(cells) {
  const groups = [];
  for (const tok of splitParams(cells)) {
    if (tok.startsWith('&')) groups.push([tok]);
    else if (groups.length) groups[groups.length - 1].push(tok);
  }
  return groups.map((g) => g.join(' '));
}

// Number of bindings beginning on each non-empty line (used to infer a grid layout).
export function bindingsPerLine(cells) {
  return String(cells ?? '')
    .split('\n')
    .map((line) => splitParams(line).filter((t) => t.startsWith('&')).length)
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
