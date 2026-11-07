// Side panel: edits the selected key's binding, or combos in combos mode.
import {
  h,
  replace,
  renderKeepingFocus,
  frameScheduler,
  requestFocus,
  takeFocusRequest,
  focusRequested,
} from './dom.js';
import { bindingEditor } from './binding-editor.js';
import { bindingLabel } from '../core/labels.js';
import { allCustomBehaviors } from '../core/behavior-ops.js';
import { behaviorsPanel, resetBehaviorConfirm } from './behaviors-panel.js';
import { numberField, chips } from './fields.js';

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
        {
          class: ui.combo === i ? 'active' : '',
          // Pressing the selected combo again deselects it, so this is a toggle.
          'aria-pressed': String(ui.combo === i),
          'data-focus': `combo-${i}`,
          onclick: () => actions.selectCombo(ui.combo === i ? null : i),
        },
        h('span.combo-name', {}, c.name),
        h('span.combo-out', {}, bindingLabel(c.binding, keymap.layers).tap || c.binding),
        c.keyPositions.length
          ? h(
              'span.combo-keys',
              {},
              // "+" between keys: they are pressed together.
              c.keyPositions.flatMap((p, i) => [
                i ? h('span.combo-plus', {}, '+') : null,
                h('kbd.key-chip', {}, String(p)),
              ]),
            )
          : h('span.muted', {}, 'no keys'),
      ),
    ),
    h('button.add-combo', { onclick: actions.addCombo }, '+ New Combo'),
  );
}

// Named layers (e.g. `layers = <BASE>` with a #define) are kept as they are and shown read-only.
function layerChips(combo, layers, actions) {
  const named = combo.layers.filter((l) => typeof l !== 'number');
  const numbers = combo.layers.filter((l) => typeof l === 'number');
  // Read-only: shown as on, and screen readers hear that too.
  const namedChips = named.map((n) =>
    h(
      'span.chip.on.named',
      { title: 'Named in the file; change it there' },
      n,
      h('span.sr-only', {}, ', on, set in the file'),
    ),
  );
  return chips(
    layers.map((_, i) => i),
    numbers,
    (i) => layers[i].name,
    (next) => actions.updateCombo({ layers: [...named, ...next.sort((a, b) => a - b)] }),
    { group: 'combo-layers-label', before: namedChips },
  );
}

function comboEditor(state, actions) {
  const combo = state.keymap.combos[state.ui.combo];
  if (!combo)
    return h(
      'p.muted',
      {},
      'Select a combo, or press "+ New Combo" and then click keys (or use the arrow keys and Space) to add them.',
    );
  return h(
    'div.combo-editor',
    {},
    h('p.muted', {}, 'Click keys on the keyboard to add or remove them, or move with the arrow keys and press Space.'),
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
    h(
      'div.field',
      {},
      h('span', { id: 'combo-layers-label' }, 'Layers'),
      layerChips(combo, state.keymap.layers, actions),
    ),
    h('p.muted.small', {}, 'No layers selected = active on all layers.'),
    h(
      'div.finish-row',
      {},
      h(
        'button.primary',
        {
          onclick: () => (requestFocus(`combo-${state.ui.combo}`, '#inspector .add-combo'), actions.finishCombo()),
          title: 'Changes are already applied; this returns to the combo list (Esc)',
        },
        'Save Combo',
      ),
      // After deleting, focus goes to the combo that takes its place in the list, or + New Combo.
      h(
        'button.danger',
        {
          onclick: () => (requestFocus(`combo-${state.ui.combo}`, '#inspector .add-combo'), actions.removeCombo()),
        },
        'Delete Combo',
      ),
    ),
  );
}

export function mountInspector(el, store, actions) {
  const render = () => {
    const state = store.get();
    if (!state.keymap) return replace(el);
    if (state.ui.mode !== 'behaviors') resetBehaviorConfirm();
    if (state.ui.mode === 'combos')
      replace(el, h('h3', {}, 'Combos'), comboList(state, actions), comboEditor(state, actions));
    else if (state.ui.mode === 'behaviors') replace(el, behaviorsPanel(state, actions));
    else replace(el, keyPanel(state, actions));
  };
  // A control that finished something (Save Combo, Delete Combo, Save Behavior, Esc) asked where
  // focus goes next; that wins over keeping focus near the removed control.
  const update = () => {
    const request = takeFocusRequest();
    renderKeepingFocus(el, render);
    if (request) focusRequested(el, request);
  };
  const schedule = frameScheduler(update);
  actions.refreshInspector = schedule;
  store.subscribe(schedule);
  render();
}
