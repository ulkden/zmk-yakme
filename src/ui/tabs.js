// Layer tabs, layer actions and the combos tab.
import { h, replace } from './dom.js';

function layerActions(state, actions) {
  const i = state.ui.layer;
  const layers = state.keymap.layers;
  const rename = () => {
    const name = prompt('Layer name', layers[i].name);
    if (name && name.trim()) actions.renameLayer(i, name.trim());
  };
  const remove = () => {
    if (confirm(`Delete layer "${layers[i].name}"?`)) actions.removeLayer(i);
  };
  return h(
    'div.layer-actions',
    {},
    h('button.icon', { title: 'Rename layer', onclick: rename }, '✎'),
    h('button.icon', { title: 'Move left', disabled: i === 0, onclick: () => actions.moveLayer(i, -1) }, '‹'),
    h('button.icon', { title: 'Move right', disabled: i === layers.length - 1, onclick: () => actions.moveLayer(i, 1) }, '›'),
    h('button.icon.danger', { title: 'Delete layer', disabled: layers.length <= 1, onclick: remove }, '✕'),
  );
}

export function mountTabs(el, store, actions) {
  const render = () => {
    const state = store.get();
    if (!state.keymap) return replace(el);
    const { ui, keymap } = state;
    const tabs = keymap.layers.map((layer, i) =>
      h(
        'button.tab',
        {
          class: ui.mode === 'layers' && ui.layer === i ? 'active' : '',
          title: `Layer ${i}`,
          onclick: () => actions.selectLayer(i),
          ondblclick: () => {
            const name = prompt('Layer name', layer.name);
            if (name && name.trim()) actions.renameLayer(i, name.trim());
          },
        },
        h('span.tab-idx', {}, String(i)),
        layer.name,
      ),
    );
    replace(
      el,
      h('div.tab-list', {}, tabs, h('button.tab.add', { title: 'Add layer', onclick: actions.addLayer }, '+')),
      ui.mode === 'layers' ? layerActions(state, actions) : null,
      h(
        'button.tab.combos',
        { class: ui.mode === 'combos' ? 'active' : '', onclick: () => actions.setMode('combos') },
        `Combos (${keymap.combos.length})`,
      ),
    );
  };
  store.subscribe(render);
  render();
}
