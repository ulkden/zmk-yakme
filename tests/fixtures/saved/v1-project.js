// A project exactly as format version 1 saved it (before custom behaviors and the newer combo
// options existed). NEVER EDIT: it guards that old saves keep loading. Add new fixtures instead.
export const V1_PROJECT = {
  app: 'zmk-keymap-editor',
  version: 1,
  layouts: [
    {
      name: 'Default Layout',
      keys: [
        { x: 0, y: 0, w: 1, h: 1, r: 0, rx: 0, ry: 0 },
        { x: 1, y: 0, w: 1, h: 1, r: 0, rx: 0, ry: 0 },
        { x: 0, y: 1, w: 1, h: 1, r: 0, rx: 0, ry: 0 },
        { x: 1, y: 1, w: 1, h: 1, r: 0, rx: 0, ry: 0 },
      ],
    },
  ],
  layoutIndex: 0,
  keymap: {
    layers: [{ id: 'default_layer', name: 'Base', bindings: ['&kp A', '&kp B', '&kp C', '&mo 1'], extra: [] }],
    combos: [{ name: 'combo_esc', keyPositions: [0, 1], binding: '&kp ESC', timeout: 50, layers: [], extra: [] }],
    customBehaviors: [],
    rowHints: [2, 2],
    source: null,
  },
  fileName: 'elvn.keymap',
};
