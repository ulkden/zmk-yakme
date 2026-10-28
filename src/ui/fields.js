// Small form-field builders shared by the side panels.
import { h } from './dom.js';

// Optional integer (empty = null), committed on change.
export function numberField(label, name, value, placeholder, onChange) {
  return h(
    'label.field',
    {},
    h('span', {}, label),
    h('input', {
      type: 'number',
      name,
      min: 0,
      value: value ?? '',
      placeholder,
      onchange: (e) => onChange(e.target.value === '' ? null : Number(e.target.value)),
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
