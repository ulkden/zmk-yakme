// Small form-field builders shared by the side panels.
import { h } from './dom.js';
import { stepValue } from '../core/number-step.js';

const WHEEL_COMMIT_MS = 500;

// While a number field is focused, the mouse wheel steps its value (Shift: by 1). Acting only on
// focus keeps panel scrolling from changing fields by accident. A burst of steps is committed
// once, after a pause or on blur, so it is a single undo step. Returns the input.
export function wheelStep(input, step = 1) {
  let timer;
  const commit = () => {
    clearTimeout(timer);
    if (input.dataset.pending) input.dispatchEvent(new Event('change'));
  };
  input.addEventListener(
    'wheel',
    (e) => {
      const delta = e.deltaY || e.deltaX; // Shift+wheel scrolls sideways in some browsers
      if (document.activeElement !== input || !delta) return;
      e.preventDefault(); // also stops Chromium's own stepping, which fills empty fields
      const limits = { min: Number(input.min) || 0, max: input.max === '' ? Infinity : Number(input.max) };
      const next = stepValue(input.value, (delta < 0 ? 1 : -1) * (e.shiftKey ? 1 : step), limits);
      if (next === null) return;
      input.value = String(next);
      input.dispatchEvent(new Event('input'));
      clearTimeout(timer);
      timer = setTimeout(commit, WHEEL_COMMIT_MS);
    },
    { passive: false },
  );
  input.addEventListener('blur', commit);
  return input;
}

// Optional millisecond value (empty = null), committed on change; the wheel steps by 10.
export function numberField(label, name, value, placeholder, onChange) {
  return h(
    'label.field',
    {},
    h('span', {}, label),
    wheelStep(
      h('input', {
        type: 'number',
        name,
        min: 0,
        value: value ?? '',
        placeholder,
        onchange: (e) => onChange(e.target.value === '' ? null : Number(e.target.value)),
      }),
      10,
    ),
  );
}

export function textField(label, name, value, onChange, { mono = false, placeholder = '' } = {}) {
  return h(
    'label.field',
    {},
    h('span', {}, label),
    h(mono ? 'input.mono' : 'input', {
      type: 'text',
      name,
      value: value ?? '',
      placeholder,
      spellcheck: false,
      onchange: (e) => onChange(e.target.value.trim()),
    }),
  );
}

export function selectField(label, name, value, options, onChange) {
  const opts = options.includes(value) || value == null ? options : [value, ...options];
  return h(
    'label.field',
    {},
    h('span', {}, label),
    h(
      'select',
      { name, onchange: (e) => onChange(e.target.value || null) },
      h('option', { value: '', selected: value == null }, '— default —'),
      opts.map((o) => h('option', { value: o, selected: o === value }, o)),
    ),
  );
}

// Toggle chips for a multi-select; onChange receives the new list.
export function chips(items, selected, labelOf, onChange) {
  const toggle = (item) => onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item]);
  return h(
    'div.chips',
    {},
    items.map((item) =>
      h('button.chip', { class: selected.includes(item) ? 'on' : '', onclick: () => toggle(item) }, labelOf(item)),
    ),
  );
}
