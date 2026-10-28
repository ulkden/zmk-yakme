// Form for editing one binding: behavior select, typed parameter inputs and a raw text field.
import { h } from './dom.js';
import { parseBinding, normalizeBinding } from '../core/bindings.js';
import { switchBehavior, setParam } from '../core/binding-edit.js';
import { BEHAVIORS, OPTIONS, behaviorDef } from '../data/behaviors.js';
import { MODIFIERS } from '../data/keycodes.js';

const PARAM_NAMES = { keycode: 'Key', mod: 'Modifier', layer: 'Layer', number: 'Number', raw: 'Param' };

function select(name, value, options, onchange) {
  const opts = options.some((o) => o.value === value) ? options : [{ value, label: value || '—' }, ...options];
  return h(
    'select',
    { name, onchange: (e) => onchange(e.target.value) },
    opts.map((o) => h('option', { value: o.value, selected: o.value === value }, o.label)),
  );
}

function behaviorSelect(behavior, custom, onchange) {
  const groups = [
    h('optgroup', { label: 'Built-in' }, BEHAVIORS.map((b) => h('option', { value: b.name, selected: b.name === behavior }, `${b.label}  &${b.name}`))),
  ];
  if (custom.length) {
    groups.push(h('optgroup', { label: 'From keymap' }, custom.map((b) => h('option', { value: b.label, selected: b.label === behavior }, `&${b.label}`))));
  }
  const known = BEHAVIORS.some((b) => b.name === behavior) || custom.some((b) => b.label === behavior);
  if (!known) groups.unshift(h('option', { value: behavior, selected: true }, `&${behavior || '?'}`));
  return h('select.behavior', { name: 'behavior', onchange: (e) => onchange(e.target.value) }, groups);
}

function paramInput(type, i, value, ctx, onchange) {
  const t = type.replace(/\?$/, '');
  const name = `param-${i}`;
  if (t === 'mod') return select(name, value, MODIFIERS.map((m) => ({ value: m, label: m })), onchange);
  if (t === 'layer') return select(name, value, ctx.layers.map((l, i) => ({ value: String(i), label: `${i} · ${l.name}` })), onchange);
  if (OPTIONS[t]) return select(name, value, OPTIONS[t].map((o) => ({ value: o, label: o })), onchange);
  return h('input', {
    type: 'text',
    name,
    value: value ?? '',
    placeholder: type.endsWith('?') ? 'optional' : '',
    spellcheck: false,
    list: t === 'keycode' ? 'keycode-list' : null,
    onchange: (e) => onchange(e.target.value.trim()),
  });
}

// ctx: { layers, customBehaviors }. Returns an element; onChange(newBinding) on every edit.
export function bindingEditor(binding, ctx, onChange) {
  const { behavior, params } = parseBinding(binding);
  const def = behaviorDef(behavior, ctx.customBehaviors);
  const paramTypes = def ? def.params : params.map(() => 'raw');
  const rows = paramTypes.map((type, i) =>
    h(
      'label.field',
      {},
      h('span', {}, PARAM_NAMES[type.replace(/\?$/, '')] ?? type.replace(/\?$/, '')),
      paramInput(type, i, params[i], ctx, (v) => onChange(setParam(binding, i, v))),
    ),
  );
  return h(
    'div.binding-editor',
    {},
    h('label.field', {}, h('span', {}, 'Behavior'), behaviorSelect(behavior, ctx.customBehaviors, (b) => onChange(switchBehavior(binding, b, ctx.customBehaviors)))),
    rows,
    h(
      'label.field',
      {},
      h('span', {}, 'Raw'),
      h('input.raw', {
        type: 'text',
        name: 'raw',
        value: binding,
        spellcheck: false,
        onchange: (e) => {
          const v = normalizeBinding(e.target.value);
          if (v.startsWith('&')) onChange(v);
        },
      }),
    ),
  );
}
