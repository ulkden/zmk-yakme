// "New keymap" dialog: blank grid, blank on the current layout, or the example.
import { h, toast, announce } from './dom.js';
import { dialog } from './modal.js';
import { confirmReplace } from './import-flow.js';
import { wheelStep } from './fields.js';
import { loadedMessage } from './welcome.js';

export function openNew(store, actions) {
  const hasLayout = store.get().layouts.length > 0;
  const rows = h('input', { type: 'text', value: '12, 12, 12, 6', spellcheck: false });
  const layers = wheelStep(h('input', { type: 'number', name: 'layers', value: 3, min: 1, max: 32 }));
  const parseRows = () =>
    rows.value
      .split(/[,\s]+/)
      .map(Number)
      .filter((n) => Number.isInteger(n) && n > 0);
  // `done` is read out once the dialog has closed (the page behind a modal is inert).
  const guarded = (fn, done) => async () => {
    if (!(await confirmReplace(store))) return;
    fn();
    dlg.close();
    announce(`${done}: ${loadedMessage(store.get())}`);
  };
  const create = (keep) => () => {
    const r = parseRows();
    if (!keep && !r.length) return toast('Enter keys per row, e.g. 10, 10, 10', 'warn');
    guarded(() => actions.newKeymap(r, Math.max(1, Number(layers.value) || 1), keep), 'Blank keymap created')();
  };
  const body = h(
    'div.new-body',
    {},
    h('label.field', {}, h('span', {}, 'Keys per row'), rows),
    h('label.field', {}, h('span', {}, 'Layers'), layers),
    h('p.muted', {}, 'Creates an empty keymap on a simple grid. Import a physical layout later to replace the grid.'),
  );
  const dlg = dialog('New keymap', body, [
    h('button', { onclick: guarded(actions.loadExample, 'Example loaded') }, 'Load Example'),
    h('span.grow'),
    hasLayout ? h('button', { onclick: create(true) }, 'Blank on Current Layout') : null,
    h('button.primary', { onclick: create(false) }, 'Create Grid'),
  ]);
}
