// Settings panel for the active layer: display name, node name, move and delete.
import { h } from './dom.js';
import { deleteControl } from './fields.js';
import { layerIds } from '../core/keymap-write.js';

let confirming = false;

function deleteRow(layer, i, total, actions) {
  return deleteControl({
    label: 'Delete Layer',
    name: 'layer-delete',
    confirming,
    disabled: total <= 1,
    question: `Delete "${layer.name}"? References to it become &trans.`,
    onAsk: () => ((confirming = true), actions.refreshLayerMenu()),
    onCancel: () => ((confirming = false), actions.refreshLayerMenu()),
    onConfirm: () => ((confirming = false), actions.removeLayer(i)),
  });
}

export function layerPopover(state, actions) {
  const i = state.ui.layer;
  const layers = state.keymap.layers;
  const layer = layers[i];
  const nodeId = layerIds(layers)[i];
  return h(
    'div.layer-popover',
    { role: 'dialog', 'aria-label': 'Layer settings' },
    h(
      'div.popover-head',
      {},
      h('strong', {}, `Layer ${i}`),
      h('button.icon', { title: 'Close', onclick: actions.closeLayerMenu }, '✕'),
    ),
    h(
      'label.field',
      {},
      h('span', {}, 'Display name'),
      h('input', {
        name: 'layer-name',
        type: 'text',
        value: layer.name,
        onchange: (e) => e.target.value.trim() && actions.renameLayer(i, e.target.value.trim()),
      }),
    ),
    h(
      'label.field',
      {},
      h('span', {}, 'Node name'),
      h('input.mono', {
        name: 'layer-id',
        type: 'text',
        value: nodeId,
        spellcheck: false,
        onchange: (e) => (e.target.value = actions.setLayerId(i, e.target.value)),
      }),
    ),
    h('p.muted.small', {}, 'The node name is used in the .keymap file; the display name is shown in ZMK Studio.'),
    h(
      'div.popover-actions',
      {},
      h('button', { disabled: i === 0, onclick: () => actions.moveLayer(i, -1) }, '‹ Move Left'),
      h('button', { disabled: i === layers.length - 1, onclick: () => actions.moveLayer(i, 1) }, 'Move Right ›'),
      h('span.grow'),
      deleteRow(layer, i, layers.length, actions),
    ),
  );
}

export function resetLayerPopover() {
  confirming = false;
}

export const popoverConfirming = () => confirming;
