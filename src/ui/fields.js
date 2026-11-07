// Small form-field builders shared by the side panels.
import { h, toast } from './dom.js';
import { parseOptionalUint } from '../core/numbers.js';
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
      e.preventDefault(); // keeps the panel still, and stops Chromium stepping type="number" inputs itself
      const limits = { min: Number(input.min) || 0, ...(input.max === '' ? {} : { max: Number(input.max) }) };
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

// Optional whole number of milliseconds (empty = null), committed on change; the wheel steps by 10.
// A text input, not type="number": renderKeepingFocus can only restore a selection it can read, and
// number inputs hide theirs, so tabbing into one during a re-render lost the select-all and typing
// appended to the old value. Text that isn't a whole number is put back to the last value.
export function numberField(label, name, value, placeholder, onChange) {
  const shown = (v) => (v == null ? '' : String(v));
  return h(
    'label.field',
    {},
    h('span', {}, label),
    wheelStep(
      h('input', {
        type: 'text',
        inputMode: 'numeric',
        name,
        value: shown(value),
        placeholder,
        spellcheck: false,
        autocomplete: 'off',
        onchange: (e) => {
          const next = parseOptionalUint(e.target.value);
          if (next === undefined) {
            e.target.value = shown(value);
            return toast(`${label}: enter a whole number, or leave it empty`, 'warn');
          }
          e.target.value = shown(next);
          onChange(next);
        },
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

// Toggle chips for a multi-select; onChange receives the new list. `group` names the set for
// screen readers (the id of its visible label); `before` adds read-only chips in front.
export function chips(items, selected, labelOf, onChange, { group = null, before = [] } = {}) {
  const toggle = (item) => onChange(selected.includes(item) ? selected.filter((x) => x !== item) : [...selected, item]);
  return h(
    'div.chips',
    group ? { role: 'group', 'aria-labelledby': group } : {},
    before,
    items.map((item) => {
      const on = selected.includes(item);
      return h(
        'button.chip',
        { class: on ? 'on' : '', 'aria-pressed': String(on), onclick: () => toggle(item) },
        labelOf(item),
      );
    }),
  );
}

// A Delete button that turns into an inline "are you sure?" row. Both of the row's buttons are
// described by the question, so screen readers read it when focus lands on Cancel. The button and
// Cancel share one focus name, so keyboard focus moves between them (focus-target.js).
let confirmCount = 0;
export function deleteControl({ label, name, confirming, question, disabled = false, onAsk, onCancel, onConfirm }) {
  if (!confirming) return h('button.danger', { disabled, 'data-focus': name, onclick: onAsk }, label);
  const id = `confirm-${++confirmCount}`;
  return h(
    'div.confirm-row',
    {},
    h('span', { id }, question),
    h('button', { 'data-focus': name, 'aria-describedby': id, onclick: onCancel }, 'Cancel'),
    h('button.danger.solid', { 'aria-describedby': id, onclick: onConfirm }, 'Delete'),
  );
}
