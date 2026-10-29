// "New keymap" dialog: blank grid, blank on the current layout, or the example.
import { h, toast } from './dom.js';
import { dialog } from './modal.js';
import { confirmReplace } from './import-flow.js';

export function openNew(store, actions) {
  const hasLayout = store.get().layouts.length > 0;
  const rows = h('input', { type: 'text', value: '12, 12, 12, 6', spellcheck: false });
  const layers = h('input', { type: 'number', value: 3, min: 1, max: 32 });
  const parseRows = () =>
    rows.value
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0);
  const guarded = (fn) => async () => {
    if (!(await confirmReplace(store))) return;
    fn();
    dlg.close();
  };
  const create = (keep) => () => {
    const r = parseRows();
    if (!keep && !r.length) return toast('Enter keys per row, e.g. 10, 10, 10', 'warn');
    guarded(() => actions.newKeymap(r, Math.max(1, Number(layers.value) || 1), keep))();
  };
  const body = h(
    'div.new-body',
    {},
    h('label.field', {}, h('span', {}, 'Keys per row'), rows),
    h('label.field', {}, h('span', {}, 'Layers'), layers),
    h('p.muted', {}, 'Creates an empty keymap on a simple grid. Import a physical layout later to replace the grid.'),
  );
  const dlg = dialog('New keymap', body, [
    h('button', { onclick: guarded(actions.loadExample) }, 'Load Example'),
    h('span.grow'),
    hasLayout ? h('button', { onclick: create(true) }, 'Blank on Current Layout') : null,
    h('button.primary', { onclick: create(false) }, 'Create Grid'),
  ]);
}
