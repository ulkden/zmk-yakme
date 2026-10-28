// Tiny DOM helpers.

// h('button.primary', { onclick, title }, 'Text', childEl)
export function h(spec, props = {}, ...children) {
  const [tag, ...classes] = spec.split('.');
  const el = document.createElement(tag || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || (v === false && !(k in el))) continue;
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, children);
  return el;
}

function append(el, children) {
  for (const c of children.flat(Infinity)) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
}

export function replace(el, ...children) {
  el.replaceChildren();
  append(el, children);
}

export function download(name, text) {
  const url = URL.createObjectURL(new Blob([text], { type: 'text/plain' }));
  const a = h('a', { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let toastTimer;
export function toast(message, kind = 'info') {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast' });
    document.body.append(el);
  }
  el.textContent = message;
  el.className = `show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = ''), 2600);
}


// Re-render `el` while keeping focus (and caret) on the field with the same `name`.
// Pair with requestAnimationFrame so a blur→change→focus sequence has finished first.
export function renderKeepingFocus(el, render) {
  const active = document.activeElement;
  const name = active && el.contains(active) ? active.getAttribute('name') : null;
  const caret = name && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
  render();
  const next = name && el.querySelector(`[name="${name}"]`);
  if (!next || next === active) return;
  next.focus();
  if (caret) {
    try {
      next.setSelectionRange(...caret);
    } catch {
      // number inputs don't support selection ranges
    }
  }
}

// Coalesce many store updates into one render per animation frame.
export function frameScheduler(fn) {
  let pending = 0;
  return () => {
    if (!pending) pending = requestAnimationFrame(() => ((pending = 0), fn()));
  };
}

// Single non-alphanumeric symbols (⇧ ⏎ ⌫ …) come from fallback fonts and render small.
export const isGlyph = (text) => [...String(text)].length === 1 && /[^\w\s]/u.test(text) && /[^\x00-\x7f]/.test(text);
