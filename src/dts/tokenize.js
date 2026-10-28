// Tokenizer for (masked) devicetree source. Token types:
//   '{' '}' ';' '=' ':' ','  structural characters
//   'str'    "quoted string"           value = unquoted text
//   'cells'  <cell list>               value = inner text
//   'bytes'  [byte string]             value = inner text
//   'word'   names, labels, &refs, macro calls (parens kept balanced)
// Every token carries `start`/`end` offsets into the source.

const STRUCT = new Set(['{', '}', ';', '=', ':', ',']);
const WORD_STOP = /[\s{};=:,"<>[\]]/;

function scanBalanced(src, i, open, close) {
  let depth = 0;
  let paren = 0;
  for (let j = i; j < src.length; j++) {
    const c = src[j];
    if (c === '(') paren++;
    else if (c === ')') paren = Math.max(0, paren - 1);
    else if (paren === 0 && c === open) depth++;
    else if (paren === 0 && c === close && --depth === 0) return j + 1;
  }
  return src.length;
}

function scanWord(src, i) {
  let j = i;
  while (j < src.length && !WORD_STOP.test(src[j])) {
    if (src[j] === '(') {
      let depth = 0;
      for (; j < src.length; j++) {
        if (src[j] === '(') depth++;
        else if (src[j] === ')' && --depth === 0) break;
      }
    }
    j++;
  }
  return Math.min(j, src.length);
}

function scanString(src, i) {
  let j = i + 1;
  while (j < src.length && src[j] !== '"') {
    if (src[j] === '\\') j++;
    j++;
  }
  return Math.min(j + 1, src.length);
}

export function tokenize(src) {
  const tokens = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (/\s/.test(c)) {
      i++;
      continue;
    }
    let end;
    let type;
    if (STRUCT.has(c)) {
      tokens.push({ type: c, value: c, start: i, end: i + 1 });
      i++;
      continue;
    }
    if (c === '"') {
      end = scanString(src, i);
      type = 'str';
    } else if (c === '<') {
      end = scanBalanced(src, i, '<', '>');
      type = 'cells';
    } else if (c === '[') {
      end = scanBalanced(src, i, '[', ']');
      type = 'bytes';
    } else {
      end = scanWord(src, i);
      if (end === i) end = i + 1; // stray character such as '>'
      type = 'word';
    }
    const raw = src.slice(i, end);
    tokens.push({ type, value: type === 'word' ? raw : stripDelims(raw), start: i, end });
    i = end;
  }
  return tokens;
}

function stripDelims(raw) {
  const closing = { '"': '"', '<': '>', '[': ']' }[raw[0]];
  return raw.length > 1 && raw.endsWith(closing) ? raw.slice(1, -1) : raw.slice(1);
}
