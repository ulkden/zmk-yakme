// Side panel: edits the selected key's binding, or combos in combos mode.
import { h, replace, renderKeepingFocus, frameScheduler } from './dom.js';
import { bindingEditor } from './binding-editor.js';
import { bindingLabel } from '../core/labels.js';
import { allCustomBehaviors } from '../core/behavior-ops.js';
import { behaviorsPanel } from './behaviors-panel.js';
import { numberField } from './fields.js';

function ctxOf(state) {
  return { layers: state.keymap.layers, customBehaviors: allCustomBehaviors(state.keymap) };
}

function keyPanel(state, actions) {
  const { ui, keymap } = state;
  const layer = keymap.layers[ui.layer];
  if (ui.key === null) {
    return h(
      'div.empty-hint',
      {},
      h('p', {}, 'Select a key to edit it.'),
      h(
        'p.muted',
        {},
        'Tip: arrow keys move between keys, typing a letter or digit assigns it, Delete clears, Ctrl+Z undoes.',
      ),
    );
  }
  const binding = layer.bindings[ui.key] ?? (ui.layer === 0 ? '&none' : '&trans');
  return h(
    'div',
    {},
    h('h3', {}, `Key ${ui.key}`, h('span.muted', {}, ` · ${layer.name}`)),
    bindingEditor(binding, ctxOf(state), actions.setKeyBinding),
    h(
      'div.quick',
      {},
      h('button', { onclick: () => actions.setKeyBinding('&trans') }, '▽ Transparent'),
      h('button', { onclick: () => actions.setKeyBinding('&none') }, '∅ None'),
    ),
    h(
      'label.check',
      {},
      h('input', {
        type: 'checkbox',
        name: 'advance',
        checked: !!ui.advance,
        onchange: (e) => actions.setAdvance(e.target.checked),
      }),
      ' Advance to next key after picking a keycode',
    ),
  );
}

function comboList(state, actions) {
  const { ui, keymap } = state;
  return h(
    'div.combo-list',
    {},
    keymap.combos.map((c, i) =>
      h(
        'button.combo-item',
        { class: ui.combo === i ? 'active' : '', onclick: () => actions.selectCombo(ui.combo === i ? null : i) },
        h('span.combo-name', {}, c.name),
        h('span.combo-out', {}, bindingLabel(c.binding, keymap.layers).tap || c.binding),
        h('span.muted', {}, c.keyPositions.join(' + ') || 'no keys'),
      ),
    ),
    h('button.add-combo', { onclick: actions.addCombo }, '+ New combo'),
  );
}

// Named layers (e.g. `layers = <BASE>` with a #define) are kept as they are and shown read-only.
function layerChips(combo, layers, actions) {
  const named = combo.layers.filter((l) => typeof l !== 'number');
  const numbers = combo.layers.filter((l) => typeof l === 'number');
  const toggle = (i) => {
    const next = numbers.includes(i) ? numbers.filter((l) => l !== i) : [...numbers, i].sort((a, b) => a - b);
    actions.updateCombo({ layers: [...named, ...next] });
  };
  return h(
    'div.chips',
    {},
    named.map((n) => h('span.chip.on.named', { title: 'Named in the file; change it there' }, n)),
    layers.map((l, i) =>
      h('button.chip', { class: numbers.includes(i) ? 'on' : '', onclick: () => toggle(i) }, l.name),
    ),
  );
}

function comboEditor(state, actions) {
  const combo = state.keymap.combos[state.ui.combo];
  if (!combo) return h('p.muted', {}, 'Select a combo, or press "+ New combo" and then click keys to add them.');
  return h(
    'div.combo-editor',
    {},
    h('p.muted', {}, 'Click keys on the keyboard to add or remove them.'),
    h(
      'label.field',
      {},
      h('span', {}, 'Name'),
      h('input', {
        type: 'text',
        name: 'combo-name',
        value: combo.name,
        spellcheck: false,
        onchange: (e) => actions.updateCombo({ name: e.target.value.trim() || combo.name }),
      }),
    ),
    bindingEditor(combo.binding, ctxOf(state), (binding) => actions.updateCombo({ binding })),
    numberField('Timeout ms', 'combo-timeout', combo.timeout, 'default (50)', (timeout) =>
      actions.updateCombo({ timeout }),
    ),
    numberField('Prior idle ms', 'combo-idle', combo.requirePriorIdle, 'off', (requirePriorIdle) =>
      actions.updateCombo({ requirePriorIdle }),
    ),
    h(
      'label.check.field-check',
      { title: 'Release the combo only when all of its keys are released' },
      h('input', {
        type: 'checkbox',
        name: 'combo-slow',
        checked: !!combo.slowRelease,
        onchange: (e) => actions.updateCombo({ slowRelease: e.target.checked }),
      }),
      ' Slow release',
    ),
    h('div.field', {}, h('span', {}, 'Layers'), layerChips(combo, state.keymap.layers, actions)),
    h('p.muted.small', {}, 'No layers selected = active on all layers.'),
    h('button.danger', { onclick: actions.removeCombo }, 'Delete combo'),
  );
}

export function mountInspector(el, store, actions) {
  const render = () => {
    const state = store.get();
    if (!state.keymap) return replace(el);
    if (state.ui.mode === 'combos')
      replace(el, h('h3', {}, 'Combos'), comboList(state, actions), comboEditor(state, actions));
    else if (state.ui.mode === 'behaviors') replace(el, behaviorsPanel(state, actions));
    else replace(el, keyPanel(state, actions));
  };
  const schedule = frameScheduler(() => renderKeepingFocus(el, render));
  actions.refreshInspector = schedule;
  store.subscribe(schedule);
  render();
}
