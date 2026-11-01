// Small form-field builders shared by the side panels.
import { h, toast } from './dom.js';
import { parseOptionalUint } from '../core/numbers.js';

// Optional whole number (empty = null), committed on change. A text input, not type="number":
// renderKeepingFocus can only restore a selection it can read, and number inputs hide theirs, so
// tabbing into one during a re-render lost the select-all and typing appended to the old value.
// Text that isn't a whole number is put back to the last value instead of clearing it.
export function numberField(label, name, value, placeholder, onChange) {
  const shown = (v) => (v == null ? '' : String(v));
  return h(
    'label.field',
    {},
    h('span', {}, label),
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
