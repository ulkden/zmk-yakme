// Tiny DOM helpers.
import { focusIds, focusTarget } from '../core/focus-target.js';
import { joinMessages } from '../core/warning-diff.js';

// h('button.primary', { onclick, title }, 'Text', childEl)
export function h(spec, props = {}, ...children) {
  const [tag, ...classes] = spec.split('.');
  const el = document.createElement(tag || 'div');
  if (classes.length) el.className = classes.join(' ');
  for (const [k, v] of Object.entries(props ?? {})) {
    if (v === undefined || v === null || (v === false && !(k in el))) continue;
    if (k === 'onchange') continue; // attached below, once the input type is known
    if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k === 'class') el.className += (el.className ? ' ' : '') + v;
    else if (k in el && k !== 'list') el[k] = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  if (props?.onchange) onCommit(el, props.onchange);
  append(el, children);
  return el;
}

const TEXT_INPUTS = new Set(['text', 'number', 'url', 'search']);

// Text-like inputs commit on Enter as well as on blur. Chrome and Firefox fire `change`
// on Enter but WebKit/Safari does not, so Enter commits explicitly and the following
// `change` (if any) is skipped when the value is unchanged.
// Textareas get the same pending-text tracking but keep Enter for new lines.
function onCommit(el, handler) {
  const isTextInput = el.tagName === 'INPUT' && TEXT_INPUTS.has(el.type);
  if (!isTextInput && el.tagName !== 'TEXTAREA') return el.addEventListener('change', handler);
  let committed = el.value;
  const commit = (e) => {
    if (el.value === committed) return;
    committed = el.value;
    delete el.dataset.pending;
    handler(e);
    committed = el.value; // handlers may normalize the field (e.g. sanitized node names)
  };
  // Marks typing that is not committed yet, so a re-render can carry it over (see renderKeepingFocus).
  el.addEventListener('input', () => {
    if (el.value === committed) delete el.dataset.pending;
    else el.dataset.pending = '1';
  });
  el.addEventListener('change', commit);
  if (isTextInput) el.addEventListener('keydown', (e) => e.key === 'Enter' && commit(e));
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

// Screen readers read messages from #announcer, a live region present from page load (regions
// added later are often not watched). While a modal dialog is open the rest of the page is inert,
// #announcer included, so messages go to the dialog's own region instead (see modal.js). A region
// is cleared first and filled a moment later, so the same message twice in a row is read twice.
// The region is chosen when the message is written, not when it is sent: a dialog that closes
// right after (Import after a successful import) takes its region with it.
// Messages sent within the delay are read together, in order ("Imported keymap. New warning: …"),
// so a warning doesn't silence the message of the action that caused it. Messages marked `last`
// (warnings) come after the others. The delay starts with the first message and isn't extended.
const ANNOUNCE_DELAY_MS = 50;
let batch = null;
const region = () =>
  [...document.querySelectorAll('dialog[open]')].at(-1)?.querySelector('.dialog-announcer') ??
  document.getElementById('announcer');
export function announce(message, { last = false } = {}) {
  if (!message) return;
  if (!batch) {
    batch = { first: [], last: [] };
    const before = region();
    if (before) before.textContent = '';
    setTimeout(() => {
      const el = region();
      if (el) el.textContent = joinMessages([...batch.first, ...batch.last]);
      batch = null;
    }, ANNOUNCE_DELAY_MS);
  }
  (last ? batch.last : batch.first).push(message);
}

// Show a message in `el` (e.g. a dialog's error line) and read it out to screen readers.
export function showMessage(el, ...content) {
  replace(el, ...content);
  if (el.textContent.trim()) announce(el.textContent.trim());
}

// A short visible message, also read out by screen readers. The visible copy is hidden from them
// so it isn't read twice.
let toastTimer;
export function toast(message, kind = 'info') {
  let el = document.getElementById('toast');
  if (!el) {
    el = h('div', { id: 'toast', 'aria-hidden': 'true' });
    document.body.append(el);
  }
  el.textContent = message;
  el.className = `show ${kind}`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = ''), 2600);
  announce(message);
}

export const FOCUSABLE = 'button, input, select, textarea, a[href], summary, [tabindex]:not([tabindex="-1"])';

// A control's identity across re-renders: `data-focus` for items whose text changes (keys, tabs,
// list items), else its field name, else its label or text.
export function focusName(el) {
  return (
    el.dataset.focus ??
    el.getAttribute('name') ??
    `${el.tagName}:${el.getAttribute('aria-label') ?? el.textContent.trim()}`
  );
}

// Disabled or not rendered (hidden, or inside a closed <details>), so focus() would do nothing.
export const unusable = (el) => el.disabled || !el.getClientRects().length;

function restoreField(next, { caret, pending }) {
  if (pending !== null) {
    next.value = pending;
    next.dataset.pending = '1';
  }
  if (!caret) return;
  try {
    next.setSelectionRange(...caret);
  } catch {
    // number inputs don't support selection ranges
  }
}

// Re-render `el` without losing keyboard focus: focus goes back to the same control (see
// focusName), or to its nearest neighbour when that control is gone or disabled. For fields,
// the caret and any text typed but not committed yet are carried over, so a re-render caused by
// another field's commit never discards what the user is typing.
// Pair with requestAnimationFrame where a blur→change→focus sequence must finish first.
export function renderKeepingFocus(el, render) {
  const active = document.activeElement;
  const controls = () => [...el.querySelectorAll(FOCUSABLE)];
  const beforeEls = active && el.contains(active) ? controls() : [];
  const index = beforeEls.indexOf(active);
  if (index < 0) return render();
  const field = {
    caret: typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null,
    pending: active.dataset.pending ? active.value : null,
  };
  const before = focusIds(beforeEls.map(focusName));
  render();
  if (active.isConnected && el.contains(active)) return;
  const afterEls = controls();
  const after = focusIds(afterEls.map(focusName));
  const j = focusTarget(before, index, after, (k) => unusable(afterEls[k]));
  if (j < 0) return;
  const next = afterEls[j];
  const same = after[j] === before[index];
  next.focus({ preventScroll: same });
  if (same) restoreField(next, field);
}

// Coalesce many store updates into one render per animation frame.
export function frameScheduler(fn) {
  let pending = 0;
  return () => {
    if (!pending) pending = requestAnimationFrame(() => ((pending = 0), fn()));
  };
}

// Single non-alphanumeric symbols (⇧ ⏎ ⌫ …) come from fallback fonts and render small.
export const isGlyph = (text) => [...String(text)].length === 1 && /[^\w\s]/u.test(text) && /\P{ASCII}/u.test(text);

// A one-shot request for where focus goes after the side panel next renders, made by the control
// that finishes something and so removes itself (Save Combo, Delete Combo, Save Behavior, Esc). The
// panel honours it after rendering (inspector.js). `name` is a data-focus name in the panel;
// `fallbacks` are selectors tried in order.
let focusRequest = null;
export function requestFocus(name, ...fallbacks) {
  focusRequest = { name, fallbacks };
}
export function takeFocusRequest() {
  const request = focusRequest;
  focusRequest = null;
  return request;
}
export function focusRequested(el, { name, fallbacks }) {
  const target =
    (name && el.querySelector(`[data-focus="${name}"]`)) ??
    fallbacks.map((selector) => document.querySelector(selector)).find(Boolean);
  target?.focus();
}
