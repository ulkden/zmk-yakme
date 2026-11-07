// Layer tabs, the layer settings popover, and the combos/behaviors mode buttons.
// The layer tabs are an ARIA tablist with roving focus: one Tab stop, ←/→ (wrapping) and Home/End
// switch layers. Combos and Behaviors are mode buttons, pressed while their tab is shown.
import { h, replace, renderKeepingFocus } from './dom.js';
import { rovingStep } from '../core/focus-target.js';
import { layerPopover, resetLayerPopover, popoverConfirming } from './layer-popover.js';

function layerTab(state, layer, i, actions) {
  const active = state.ui.mode === 'layers' && state.ui.layer === i;
  return h(
    'button.tab',
    {
      class: active ? 'active' : '',
      title: active ? 'Double-click for layer settings' : `Layer ${i}`,
      role: 'tab',
      'aria-selected': String(active),
      tabindex: i === state.ui.layer ? '0' : '-1',
      'aria-controls': 'keyboard',
      'data-focus': `layer-${i}`,
      'data-index': i,
      onclick: () => actions.selectLayer(i),
      ondblclick: () => active && actions.openLayerMenu(),
    },
    // The space keeps the name "0 Base" rather than "0Base" for screen readers.
    h('span.tab-idx', {}, String(i)),
    ' ',
    layer.name,
  );
}

const modeButton = (ui, mode, label, actions) =>
  h(
    `button.tab.${mode}`,
    {
      class: ui.mode === mode ? 'active' : '',
      // The current view, not a toggle: pressing it again keeps it shown.
      'aria-current': ui.mode === mode ? 'true' : null,
      'data-focus': `mode-${mode}`,
      onclick: () => actions.setMode(mode),
    },
    label,
  );

// ←/→ (wrapping) and Home/End on a layer tab switch to that layer and move focus with it.
function onTabKeys(e, el, store, actions) {
  const tab = e.target.closest?.('[role="tab"]');
  if (!tab || e.ctrlKey || e.metaKey || e.altKey) return;
  const to = rovingStep(e.key, Number(tab.dataset.index), store.get().keymap.layers.length, { wrap: true });
  if (to === undefined) return;
  e.preventDefault();
  actions.selectLayer(to);
  el.querySelector(`[data-focus="layer-${to}"]`)?.focus();
}

// Opening the layer settings moves focus into them; closing them (Esc, ✕) while focus was inside
// returns it to the ✎ button. A click elsewhere closes them and leaves focus where it went.
function popoverFocus(el, wasOpen, isOpen, wasInside) {
  if (isOpen && !wasOpen) return el.querySelector('.layer-popover [name="layer-name"]')?.focus();
  if (!isOpen && wasOpen && wasInside) el.querySelector('.layer-edit')?.focus();
}

// Keep the popover element across renders so editing its fields never loses focus.
// Returns whether the popover is shown.
function syncPopover(slot, state, actions, cache) {
  const { ui, keymap } = state;
  if (ui.mode !== 'layers' || !ui.layerMenu) {
    cache.key = null;
    replace(slot);
    return false;
  }
  const key = `${ui.layer}|${keymap.layers.length}|${popoverConfirming()}`;
  if (cache.key !== key) {
    cache.key = key;
    replace(slot, layerPopover(state, actions));
    return true;
  }
  const fresh = layerPopover(state, actions);
  for (const name of ['layer-name', 'layer-id']) {
    const cur = slot.querySelector(`[name="${name}"]`);
    const next = fresh.querySelector(`[name="${name}"]`);
    if (cur && next && cur !== document.activeElement) cur.value = next.value;
  }
  return true;
}

export function mountTabs(el, store, actions) {
  const bar = h('div.tabs-bar');
  const slot = h('div.popover-slot');
  const cache = { key: null };
  const shown = { popover: false };
  el.append(bar, slot);
  const draw = () => {
    const state = store.get();
    shown.popover = false;
    if (!state.keymap) return (replace(bar), replace(slot));
    const { ui, keymap } = state;
    if (!ui.layerMenu) resetLayerPopover();
    replace(
      bar,
      h(
        'div.tab-list',
        {},
        h(
          'div.layer-tabs',
          { role: 'tablist', 'aria-label': 'Layers' },
          keymap.layers.map((l, i) => layerTab(state, l, i, actions)),
        ),
        h('button.tab.add', { title: 'Add layer', 'aria-label': 'Add layer', onclick: actions.addLayer }, '+'),
      ),
      ui.mode === 'layers'
        ? h(
            'button.icon.layer-edit',
            {
              class: ui.layerMenu ? 'active' : '',
              title: 'Layer settings',
              'aria-label': 'Layer settings',
              'aria-expanded': String(!!ui.layerMenu),
              onclick: actions.toggleLayerMenu,
            },
            '✎',
          )
        : null,
      modeButton(ui, 'combos', `Combos (${keymap.combos.length})`, actions),
      modeButton(ui, 'behaviors', `Behaviors (${keymap.behaviors?.length ?? 0})`, actions),
    );
    shown.popover = syncPopover(slot, state, actions, cache);
  };
  let menuOpen = false;
  const render = () => {
    const wasInside = !!document.activeElement?.closest('.layer-popover');
    renderKeepingFocus(el, draw);
    popoverFocus(el, menuOpen, shown.popover, wasInside);
    menuOpen = shown.popover;
  };
  el.addEventListener('keydown', (e) => onTabKeys(e, el, store, actions));
  actions.refreshLayerMenu = render;
  document.addEventListener('click', (e) => {
    if (store.get().ui.layerMenu && !e.target.closest('.layer-popover, .layer-edit, .tab.active'))
      actions.closeLayerMenu();
  });
  store.subscribe(render);
  render();
}
