// Layer tabs, the layer settings popover, and the combos/behaviors mode tabs.
import { h, replace } from './dom.js';
import { layerPopover, resetLayerPopover, popoverConfirming } from './layer-popover.js';

function layerTab(state, layer, i, actions) {
  const active = state.ui.mode === 'layers' && state.ui.layer === i;
  return h(
    'button.tab',
    {
      class: active ? 'active' : '',
      title: active ? 'Double-click for layer settings' : `Layer ${i}`,
      onclick: () => actions.selectLayer(i),
      ondblclick: () => active && actions.openLayerMenu(),
    },
    h('span.tab-idx', {}, String(i)),
    layer.name,
  );
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
  const render = () => {
    const state = store.get();
    if (!state.keymap) return replace(bar), replace(slot);
    const { ui, keymap } = state;
    if (!ui.layerMenu) resetLayerPopover();
    replace(
      bar,
      h('div.tab-list', {}, keymap.layers.map((l, i) => layerTab(state, l, i, actions)), h('button.tab.add', { title: 'Add layer', onclick: actions.addLayer }, '+')),
      ui.mode === 'layers'
        ? h('button.icon.layer-edit', { class: ui.layerMenu ? 'active' : '', title: 'Layer settings', onclick: actions.toggleLayerMenu }, '✎')
        : null,
      h('button.tab.combos', { class: ui.mode === 'combos' ? 'active' : '', onclick: () => actions.setMode('combos') }, `Combos (${keymap.combos.length})`),
      h('button.tab', { class: ui.mode === 'behaviors' ? 'active' : '', onclick: () => actions.setMode('behaviors') }, `Behaviors (${keymap.behaviors?.length ?? 0})`),
    );
    syncPopover(slot, state, actions, cache);
  };
  actions.refreshLayerMenu = render;
  document.addEventListener('click', (e) => {
    if (store.get().ui.layerMenu && !e.target.closest('.layer-popover, .layer-edit, .tab.active')) actions.closeLayerMenu();
  });
  store.subscribe(render);
  render();
}
