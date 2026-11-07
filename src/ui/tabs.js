// Layer tabs, the layer settings popover, and the combos/behaviors mode buttons.
// The layer tabs are an ARIA tablist with roving focus: one Tab stop, ←/→ (wrapping) and Home/End
// switch layers. Combos and Behaviors are mode buttons, pressed while their tab is shown.
import { h, replace, renderKeepingFocus } from './dom.js';
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
      'data-focus': `layer-${i}`,
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
      'aria-pressed': String(ui.mode === mode),
      'data-focus': `mode-${mode}`,
      onclick: () => actions.setMode(mode),
    },
    label,
  );

// ←/→ (wrapping) and Home/End on a layer tab switch to that layer and move focus with it.
function onTabKeys(e, el, store, actions) {
  const tab = e.target.closest?.('[role="tab"]');
  if (!tab || e.ctrlKey || e.metaKey || e.altKey) return;
  const n = store.get().keymap.layers.length;
  const i = Number(tab.dataset.focus.slice(6));
  const to = { ArrowLeft: (i - 1 + n) % n, ArrowRight: (i + 1) % n, Home: 0, End: n - 1 }[e.key];
  if (to === undefined) return;
  e.preventDefault();
  actions.selectLayer(to);
  el.querySelector(`[data-focus="layer-${to}"]`)?.focus();
}

// Opening the layer settings moves focus into them; closing them (Esc, ✕) while focus was inside,
// or with nothing focused, returns it to the ✎ button.
function popoverFocus(el, wasOpen, isOpen, wasInside) {
  if (isOpen && !wasOpen) return el.querySelector('.layer-popover [name="layer-name"]')?.focus();
  const a = document.activeElement;
  const lost = !a || a === document.body || !a.isConnected;
  if (!isOpen && wasOpen && (wasInside || lost)) el.querySelector('.layer-edit')?.focus();
}

// Keep the popover element across renders so editing its fields never loses focus.
function syncPopover(slot, state, actions, cache) {
  const { ui, keymap } = state;
  if (ui.mode !== 'layers' || !ui.layerMenu) {
    cache.key = null;
    return replace(slot);
  }
  const key = `${ui.layer}|${keymap.layers.length}|${popoverConfirming()}`;
  if (cache.key !== key) {
    cache.key = key;
    return replace(slot, layerPopover(state, actions));
  }
  const fresh = layerPopover(state, actions);
  for (const name of ['layer-name', 'layer-id']) {
    const cur = slot.querySelector(`[name="${name}"]`);
    const next = fresh.querySelector(`[name="${name}"]`);
    if (cur && next && cur !== document.activeElement) cur.value = next.value;
  }
}

export function mountTabs(el, store, actions) {
  const bar = h('div.tabs-bar');
  const slot = h('div.popover-slot');
  const cache = { key: null };
  el.append(bar, slot);
  const draw = () => {
    const state = store.get();
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
    syncPopover(slot, state, actions, cache);
  };
  let menuOpen = false;
  const render = () => {
    const wasInside = !!document.activeElement?.closest('.layer-popover');
    renderKeepingFocus(el, draw);
    const open = !!store.get().ui.layerMenu && store.get().ui.mode === 'layers';
    popoverFocus(el, menuOpen, open, wasInside);
    menuOpen = open;
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
