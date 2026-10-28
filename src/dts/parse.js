// Tolerant devicetree parser. Produces a tree of nodes:
//   { name, labels, props: [{ name, values, start, end }], children, start, end, bodyStart, bodyEnd }
// Offsets refer to the original text. Comments, preprocessor lines and
// unknown macro statements are skipped.
import { maskNonCode } from './mask.js';
import { tokenize } from './tokenize.js';

export function parseDts(text) {
  const tokens = tokenize(maskNonCode(text));
  const p = { tokens, i: 0 };
  const root = makeNode('', [], 0);
  root.end = text.length;
  parseItems(p, root, true);
  return root;
}

function makeNode(name, labels, start) {
  return { name, labels, props: [], children: [], start, end: start, bodyStart: start, bodyEnd: start };
}

const at = (p, k = 0) => p.tokens[p.i + k];

function parseItems(p, node, top) {
  while (p.i < p.tokens.length) {
    const t = at(p);
    if (t.type === '}') {
      if (!top) return;
      p.i++;
    } else if (t.type === 'word') {
      parseStatement(p, node);
    } else {
      p.i++;
    }
  }
}

function parseStatement(p, parent) {
  const start = at(p).start;
  const labels = [];
  while (at(p)?.type === 'word' && at(p, 1)?.type === ':') {
    labels.push(at(p).value);
    p.i += 2;
  }
  const nameTok = at(p);
  if (nameTok?.type !== 'word') return;
  p.i++;
  const next = at(p);
  if (next?.type === '{') parseNodeBody(p, parent, nameTok.value, labels, start);
  else if (next?.type === '=') parseProp(p, parent, nameTok.value, start);
  else if (next?.type === ';') {
    parent.props.push({ name: nameTok.value, values: [], start, end: next.end });
    p.i++;
  }
  // Anything else (e.g. a bare macro call) is skipped: only the word was consumed.
}

function parseNodeBody(p, parent, name, labels, start) {
  const open = at(p);
  p.i++;
  const node = makeNode(name, labels, start);
  node.bodyStart = open.end;
  parseItems(p, node, false);
  const close = at(p);
  node.bodyEnd = close ? close.start : open.end;
  node.end = close ? close.end : open.end;
  if (close) p.i++;
  if (at(p)?.type === ';') {
    node.end = at(p).end;
    p.i++;
  }
  parent.children.push(node);
}

function parseProp(p, parent, name, start) {
  p.i++; // '='
  const values = [];
  let end = start;
  while (p.i < p.tokens.length) {
    const t = at(p);
    if (t.type === ';') {
      end = t.end;
      p.i++;
      break;
    }
    if (t.type === '}' || t.type === '{') break;
    if (t.type !== ',') values.push({ type: t.type, value: t.value });
    end = t.end;
    p.i++;
  }
  parent.props.push({ name, values, start, end });
}

export function findNodes(node, pred, out = []) {
  for (const child of node.children) {
    if (pred(child)) out.push(child);
    findNodes(child, pred, out);
  }
  return out;
}

export function getProp(node, name) {
  return node.props.find((pr) => pr.name === name);
}

export function propString(node, name) {
  const prop = getProp(node, name);
  const str = prop?.values.find((v) => v.type === 'str');
  return str ? str.value : undefined;
}

// Concatenate the inner text of all `<...>` groups of a property.
export function propCells(node, name) {
  const prop = getProp(node, name);
  if (!prop) return undefined;
  return prop.values
    .filter((v) => v.type === 'cells')
    .map((v) => v.value)
    .join(' ');
}

export function hasCompatible(node, value) {
  const prop = getProp(node, 'compatible');
  return !!prop?.values.some((v) => v.type === 'str' && v.value === value);
}
