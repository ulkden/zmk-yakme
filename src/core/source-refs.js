// References to an editable behavior in text that export keeps verbatim: other behaviors
// (tap-dance, sticky keys, …), overrides such as `&hm { … };`, #define lines, and unknown
// properties kept in `extra`. Renaming or deleting a behavior must follow them there too,
// or the exported file no longer builds.
import { parseDts, findNodes, hasCompatible } from '../dts/parse.js';
import { maskNonCode } from '../dts/mask.js';
import { behaviorKind } from './behaviors-parse.js';
import { lineRange } from './behaviors-write.js';

const LABEL_CHAR = /[A-Za-z0-9_]/;

// Nodes that export regenerates from the model, so their text is never edited here.
function regenerated(root) {
  return findNodes(
    root,
    (n) => hasCompatible(n, 'zmk,keymap') || hasCompatible(n, 'zmk,combos') || !!behaviorKind(n),
  ).map((n) => [n.start, n.end]);
}

// End of `count` parameters after `i`: words, optionally with a balanced (…) group.
function paramsEnd(code, i, count) {
  let j = i;
  for (let n = 0; n < count; n++) {
    const m = /^\s+/.exec(code.slice(j));
    const k = j + (m ? m[0].length : 0);
    if (k >= code.length || /[&<>,;{}]/.test(code[k])) break;
    j = k;
    let depth = 0;
    while (j < code.length && (depth > 0 || !/[\s<>,;{}]/.test(code[j]))) {
      if (code[j] === '(') depth++;
      else if (code[j] === ')') depth--;
      j++;
    }
  }
  return j;
}

// Every `&label` in code (comments excluded), outside the skipped ranges.
function find(text, label, skip = []) {
  const code = maskNonCode(text, { directives: false });
  const out = [];
  const needle = '&' + label;
  for (let i = code.indexOf(needle); i >= 0; i = code.indexOf(needle, i + 1)) {
    const after = i + needle.length;
    if (LABEL_CHAR.test(code[after] ?? '') || skip.some(([s, e]) => i >= s && i < e)) continue;
    out.push({ start: i, after, override: /^\s*\{/.test(code.slice(after)) });
  }
  return { code, refs: out };
}

// The panel counts uses on every render, so the last file's ranges are remembered.
let cached = { text: null, ranges: [] };
function skipFor(text, regions) {
  if (!regions) return [];
  if (cached.text !== text) cached = { text, ranges: regenerated(parseDts(text)) };
  return cached.ranges;
}

// Binding references (not overrides) to `label`; `regions` skips regenerated nodes in a whole file.
export function countRefs(text, label, regions = false) {
  if (!text) return 0;
  return find(text, label, skipFor(text, regions)).refs.filter((r) => !r.override).length;
}

// Where the binding references are (`&td0`, a node name, or `#define`), for the delete prompt.
export function refHolders(text, label) {
  if (!text) return [];
  const root = parseDts(text);
  const { refs } = find(text, label, regenerated(root));
  const holders = refs
    .filter((r) => !r.override)
    .map((r) => {
      const nodes = findNodes(root, (n) => n.start <= r.start && r.start < n.end);
      const inner = nodes[nodes.length - 1];
      if (!inner) return '#define';
      return inner.labels[0] ? '&' + inner.labels[0] : inner.name;
    });
  return [...new Set(holders)];
}

// Rename `&from` to `&to`, or with to === null replace each use (and its `cells` parameters)
// with `&none` and remove overrides of it. Returns the new text.
export function rewriteRefs(text, from, to, cells = 0, regions = false) {
  if (!text) return text;
  const root = regions ? parseDts(text) : null;
  const { code, refs } = find(text, from, root ? regenerated(root) : []);
  const edits = refs.map((r) => {
    if (to !== null) return { start: r.start, end: r.after, text: '&' + to };
    if (!r.override) return { start: r.start, end: paramsEnd(code, r.after, cells), text: '&none' };
    const node = root?.children.find((n) => n.start === r.start);
    return node ? { ...lineRange(text, node), text: '' } : null;
  });
  let out = text;
  for (const e of edits.filter(Boolean).sort((a, b) => b.start - a.start))
    out = out.slice(0, e.start) + e.text + out.slice(e.end);
  return out;
}
