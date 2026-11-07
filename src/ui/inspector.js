// Side panel: edits the selected key's binding, or combos in combos mode.
import { h, replace, renderKeepingFocus, frameScheduler } from './dom.js';
import { bindingEditor } from './binding-editor.js';
import { bindingLabel } from '../core/labels.js';
import { allCustomBehaviors } from '../core/behavior-ops.js';
import { behaviorsPanel } from './behaviors-panel.js';
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
          onclick: actions.finishCombo,
          title: 'Changes are already applied; this returns to the combo list (Esc)',
        },
        'Save Combo',
      ),
      h('button.danger', { onclick: actions.removeCombo }, 'Delete Combo'),
    ),
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
  // Where focus goes when the panel's content is replaced by finishing something from inside it:
  // - a combo (Save Combo, Esc, Delete): that combo in the list, or the next, or + New Combo;
  // - a behavior (Save Behavior): the key's Behavior list, to assign it, or the diagram.
  // Otherwise focus follows renderKeepingFocus.
  const last = { mode: null, combo: null };
  const finishedTarget = (ui) => {
    if (!el.contains(document.activeElement) || document.activeElement === el) return null;
    const combo = last.combo; // read now: `last` is updated before the target is focused
    if (
      last.mode === 'combos' &&
      combo !== null &&
      ui.combo === null &&
      document.activeElement.closest('.combo-editor')
    )
      return () => el.querySelector(`[data-focus="combo-${combo}"]`) ?? el.querySelector('.add-combo');
    if (last.mode === 'behaviors' && ui.mode === 'layers')
      return () =>
        el.querySelector('select[name="behavior"]') ?? document.querySelector('#keyboard .key[tabindex="0"]');
    return null;
  };
  const update = () => {
    const { ui } = store.get();
    const target = finishedTarget(ui);
    Object.assign(last, { mode: ui.mode, combo: ui.mode === 'combos' ? ui.combo : null });
    if (!target) return renderKeepingFocus(el, render);
    render();
    target()?.focus();
  };
  const schedule = frameScheduler(update);
  actions.refreshInspector = schedule;
  store.subscribe(schedule);
  render();
}
