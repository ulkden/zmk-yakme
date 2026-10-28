// Generate and splice custom behavior nodes (hold-tap, mod-morph, macro).
import { findNodes } from '../dts/parse.js';
import { behaviorKind, fingerprint } from './behaviors-parse.js';

const IND = '    ';
const COMPAT = { 'hold-tap': 'zmk,behavior-hold-tap', 'mod-morph': 'zmk,behavior-mod-morph', macro: 'zmk,behavior-macro' };
const quote = (s) => `"${String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
const intProp = (name, v) => (v != null ? [`${name} = <${v}>;`] : []);
const mods = (list) => `<(${list.join('|')})>`;

function kindLines(b) {
  if (b.kind === 'hold-tap') {
    return [
      ...(b.flavor ? [`flavor = ${quote(b.flavor)};`] : []),
      ...intProp('tapping-term-ms', b.tappingTerm),
      ...intProp('quick-tap-ms', b.quickTap),
      ...intProp('require-prior-idle-ms', b.priorIdle),
      `bindings = ${b.bindings.map((x) => `<${x}>`).join(', ')};`,
    ];
  }
  if (b.kind === 'mod-morph') {
    return [
      `bindings = ${b.bindings.map((x) => `<${x}>`).join(', ')};`,
      ...(b.mods.length ? [`mods = ${mods(b.mods)};`] : []),
      ...(b.keepMods.length ? [`keep-mods = ${mods(b.keepMods)};`] : []),
    ];
  }
  return [...intProp('wait-ms', b.waitMs), ...intProp('tap-ms', b.tapMs), `bindings = <${b.bindings.join(' ')}>;`];
}

export function behaviorLines(b) {
  const cells = b.kind === 'hold-tap' ? 2 : 0;
  return [
    `${b.label}: ${b.name || b.label} {`,
    `${IND}compatible = "${COMPAT[b.kind]}";`,
    `${IND}#binding-cells = <${cells}>;`,
    ...(b.displayName ? [`${IND}display-name = ${quote(b.displayName)};`] : []),
    ...kindLines(b).map((l) => IND + l),
    ...(b.extra ?? []).map((e) => IND + e),
    '};',
  ];
}

const indentLines = (lines, ind) => lines.map((l, i) => (i === 0 || !l ? l : ind + l)).join('\n');

function indentOf(text, pos) {
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  return text.slice(lineStart, pos).match(/^[ \t]*/)[0];
}

// Range covering a node plus its own line (so deleting it leaves no blank line).
function lineRange(text, node) {
  const lineStart = text.lastIndexOf('\n', node.start - 1) + 1;
  const start = /^[ \t]*$/.test(text.slice(lineStart, node.start)) ? lineStart : node.start;
  const end = text[node.end] === '\n' ? node.end + 1 : node.end;
  return { start, end };
}

const containerFor = (b) => (b.kind === 'macro' ? 'macros' : 'behaviors');

// Wraps new behaviors in a container node (`behaviors { ... };`).
export function containerLines(name, behaviors) {
  return [`${name} {`, ...behaviors.flatMap((b, i) => [...(i ? [''] : []), ...behaviorLines(b).map((l) => IND + l)]), '};'];
}

// Returns { edits: [{ start, end, text }], prefix: [lines] } where prefix holds containers
// that must be created (placed before the keymap node by the caller).
export function behaviorEdits(text, root, behaviors) {
  const nodes = findNodes(root, behaviorKind);
  const byLabel = new Map(nodes.map((n) => [n.labels[0], n]));
  const kept = new Set();
  const edits = [];
  const fresh = [];
  for (const b of behaviors) {
    const node = b.origLabel ? byLabel.get(b.origLabel) : null;
    if (!node) {
      fresh.push(b);
      continue;
    }
    kept.add(node);
    if (fingerprint(b) !== b.orig) edits.push({ start: node.start, end: node.end, text: indentLines(behaviorLines(b), indentOf(text, node.start)) });
  }
  for (const node of nodes) if (!kept.has(node)) edits.push({ ...lineRange(text, node), text: '' });
  const prefix = [];
  for (const name of ['behaviors', 'macros']) {
    const items = fresh.filter((b) => containerFor(b) === name);
    if (!items.length) continue;
    const container = root.children.flatMap((c) => c.children).find((c) => c.name === name);
    if (!container) {
      prefix.push(containerLines(name, items));
      continue;
    }
    const closeLine = text.lastIndexOf('\n', container.bodyEnd - 1) + 1;
    const ind = indentOf(text, container.start) + IND;
    const body = items.map((b) => indentLines(behaviorLines(b), ind)).map((t) => `\n${ind}${t}\n`).join('');
    edits.push({ start: closeLine, end: closeLine, text: body });
  }
  return { edits, prefix };
}
