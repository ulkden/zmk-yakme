// Side panel for the Behaviors tab: list, add and edit hold-taps, mod-morphs and macros.
import { h } from './dom.js';
import { numberField, textField, selectField, chips, confirmRow } from './fields.js';
import { FLAVORS, MOD_FLAGS, countBehaviorUses } from '../core/behavior-ops.js';
import { normalizeBinding } from '../core/bindings.js';
import { refHolders } from '../core/source-refs.js';

const KIND_LABEL = { 'hold-tap': 'Hold-tap', 'mod-morph': 'Mod-morph', macro: 'Macro' };
// Button text is Title Case (both parts of a hyphenated word are capitalized).
const ADD_LABEL = { 'hold-tap': '+ Hold-Tap', 'mod-morph': '+ Mod-Morph', macro: '+ Macro' };
const modLabel = (m) =>
  m
    .replace('MOD_', '')
    .replace(/^([LR])SFT$/, '$1Shift')
    .replace(/^([LR])CTL$/, '$1Ctrl')
    .replace(/^([LR])ALT$/, '$1Alt')
    .replace(/^([LR])GUI$/, '$1Gui');
let confirmingDelete = null;

const asBinding = (v) => {
  const b = normalizeBinding(v);
  return b.startsWith('&') ? b : null;
};

function list(state, actions) {
  const { keymap, ui } = state;
  return h(
    'div.combo-list',
    {},
    (keymap.behaviors ?? []).map((b, i) =>
      h(
        'button.combo-item',
        {
          class: ui.behavior === i ? 'active' : '',
          // Pressing the selected behavior again deselects it, so this is a toggle.
          'aria-pressed': String(ui.behavior === i),
          'data-focus': `behavior-${i}`,
          onclick: () => actions.selectBehavior(ui.behavior === i ? null : i),
        },
        h('span.combo-name.mono', {}, `&${b.label}`),
        h('span.badge', {}, KIND_LABEL[b.kind]),
        h('span.muted', {}, `${countBehaviorUses(keymap, b.label)} use(s)`),
      ),
    ),
    h(
      'div.add-row',
      {},
      Object.entries(ADD_LABEL).map(([kind, label]) =>
        h('button.add-combo', { onclick: () => actions.addBehavior(kind) }, label),
      ),
    ),
  );
}

function holdTapFields(b, update) {
  return [
    selectField('Flavor', 'bh-flavor', b.flavor, FLAVORS, (flavor) => update({ flavor })),
    numberField('Tapping term', 'bh-term', b.tappingTerm, 'ms', (tappingTerm) => update({ tappingTerm })),
    numberField('Quick tap', 'bh-quick', b.quickTap, 'ms (off)', (quickTap) => update({ quickTap })),
    numberField('Prior idle', 'bh-idle', b.priorIdle, 'ms (off)', (priorIdle) => update({ priorIdle })),
    textField(
      'Hold',
      'bh-hold',
      b.bindings[0],
      (v) => asBinding(v) && update({ bindings: [asBinding(v), b.bindings[1]] }),
      { mono: true },
    ),
    textField(
      'Tap',
      'bh-tap',
      b.bindings[1],
      (v) => asBinding(v) && update({ bindings: [b.bindings[0], asBinding(v)] }),
      { mono: true },
    ),
    h(
      'p.muted.small',
      {},
      'Hold and tap are behaviors without parameters, e.g. &kp or &mo. Key parameters are given where the behavior is used: &' +
        b.label +
        ' LSHIFT A.',
    ),
  ];
}

function modMorphFields(b, update) {
  return [
    textField(
      'Normal',
      'bh-normal',
      b.bindings[0],
      (v) => asBinding(v) && update({ bindings: [asBinding(v), b.bindings[1]] }),
      { mono: true },
    ),
    textField(
      'With mods',
      'bh-morph',
      b.bindings[1],
      (v) => asBinding(v) && update({ bindings: [b.bindings[0], asBinding(v)] }),
      { mono: true },
    ),
    h(
      'div.field',
      {},
      h('span', { id: 'bh-mods-label' }, 'Mods'),
      chips(MOD_FLAGS, b.mods, modLabel, (mods) => update({ mods }), { group: 'bh-mods-label' }),
    ),
    h(
      'div.field',
      {},
      h('span', { id: 'bh-keep-label' }, 'Keep mods'),
      chips(MOD_FLAGS, b.keepMods, modLabel, (keepMods) => update({ keepMods }), { group: 'bh-keep-label' }),
    ),
  ];
}

function macroFields(b, update) {
  const area = h('textarea.mono.macro-steps', {
    name: 'bh-steps',
    spellcheck: false,
    value: b.bindings.join('\n'),
    onchange: (e) => update({ bindings: e.target.value.split('\n').map(asBinding).filter(Boolean) }),
  });
  return [
    h('label.field.top', {}, h('span', {}, 'Steps'), area),
    h(
      'p.muted.small',
      {},
      'One binding per line. Use &macro_tap, &macro_press, &macro_release and &macro_pause_for_release to control how following keys are sent.',
    ),
    numberField('Wait', 'bh-wait', b.waitMs, 'ms (default)', (waitMs) => update({ waitMs })),
    numberField('Tap', 'bh-tapms', b.tapMs, 'ms (default)', (tapMs) => update({ tapMs })),
  ];
}

function deleteRow(state, actions) {
  const b = state.keymap.behaviors[state.ui.behavior];
  if (confirmingDelete !== b.label)
    return h(
      'button.danger',
      { 'data-focus': 'behavior-delete', onclick: () => ((confirmingDelete = b.label), actions.refreshInspector()) },
      'Delete Behavior',
    );
  const uses = countBehaviorUses(state.keymap, b.label);
  const holders = refHolders(state.keymap.source, b.label);
  const where = holders.length ? `, including in ${holders.join(', ')}` : '';
  return confirmRow(
    `Delete &${b.label}?${uses ? ` Its ${uses} use(s) become &none${where}.` : ''}`,
    'behavior-delete',
    () => ((confirmingDelete = null), actions.refreshInspector()),
    () => ((confirmingDelete = null), actions.removeBehavior()),
  );
}

function editor(state, actions) {
  const b = state.keymap.behaviors?.[state.ui.behavior];
  if (!b)
    return h(
      'p.muted',
      {},
      'Select a behavior to edit it, or add a new one. Then assign it to keys from the Behavior list in the Layers tab.',
    );
  const update = actions.updateBehavior;
  const kindFields = { 'hold-tap': holdTapFields, 'mod-morph': modMorphFields, macro: macroFields }[b.kind];
  return h(
    'div.combo-editor',
    {},
    h('p.muted.small', {}, `${KIND_LABEL[b.kind]}. Keys using it are highlighted on the current layer.`),
    textField('Label', 'bh-label', b.label, (label) => label && update({ label }), { mono: true }),
    textField('Display name', 'bh-display', b.displayName, (v) => update({ displayName: v || null }), {
      placeholder: 'optional',
    }),
    kindFields(b, update),
    h(
      'div.finish-row',
      {},
      h(
        'button.primary',
        {
          onclick: actions.finishBehavior,
          title: 'Changes are already applied; this returns to the key you were editing',
        },
        'Save Behavior',
      ),
      deleteRow(state, actions),
    ),
  );
}

export function behaviorsPanel(state, actions) {
  return h('div', {}, h('h3', {}, 'Behaviors'), list(state, actions), editor(state, actions));
}
