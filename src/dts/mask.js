// Replace comments and preprocessor directives with spaces so that the parser
// can ignore them while every offset still matches the original text.

const DIRECTIVE = /^#\s*(include|define|undef|ifdef|ifndef|if|elif|else|endif|pragma|error|warning|line)\b/;

const blank = (s) => s.replace(/[^\n]/g, ' ');

function stringEnd(text, i) {
  let j = i + 1;
  while (j < text.length && text[j] !== '"' && text[j] !== '\n') {
    if (text[j] === '\\') j++;
    j++;
  }
  return Math.min(j + 1, text.length);
}

function directiveEnd(text, i) {
  let j = i;
  while (j < text.length) {
    const nl = text.indexOf('\n', j);
    if (nl < 0) return text.length;
    if (text[nl - 1] === '\\' || (text[nl - 1] === '\r' && text[nl - 2] === '\\')) {
      j = nl + 1;
      continue;
    }
    return nl;
  }
  return text.length;
}

export function maskNonCode(text) {
  let out = '';
  let i = 0;
  let lineStart = true;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    let end = -1;
    let keep = false;
    if (c === '"') {
      end = stringEnd(text, i);
      keep = true;
    } else if (c === '/' && next === '/') {
      end = text.indexOf('\n', i);
      if (end < 0) end = text.length;
    } else if (c === '/' && next === '*') {
      end = text.indexOf('*/', i + 2);
      end = end < 0 ? text.length : end + 2;
    } else if (c === '#' && lineStart && DIRECTIVE.test(text.slice(i, i + 12))) {
      end = directiveEnd(text, i);
    }
    if (end >= 0) {
      const chunk = text.slice(i, end);
      out += keep ? chunk : blank(chunk);
      if (keep) lineStart = false;
      i = end;
      continue;
    }
    out += c;
    if (c === '\n') lineStart = true;
    else if (!/\s/.test(c)) lineStart = false;
    i++;
  }
  return out;
}
