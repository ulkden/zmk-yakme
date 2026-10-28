// Bottom status bar: layout choice, key count and warnings.
import { h, replace } from './dom.js';
import { activeLayout, keyCount } from '../core/state.js';
import { validate } from '../core/validate.js';

export function mountStatus(el, store, actions) {
  let open = false;
  const render = () => {
    const s = store.get();
    const layout = activeLayout(s);
    if (!s.keymap) return replace(el);
    const warnings = validate(s);
    const layoutPart =
      s.layouts.length > 1
        ? h(
            'select',
            { onchange: (e) => actions.selectLayout(Number(e.target.value)) },
            s.layouts.map((l, i) => h('option', { value: i, selected: i === s.layoutIndex }, l.name)),
          )
        : h('span', {}, layout?.name ?? 'No layout');
    const warnBtn = warnings.length
      ? h('button.warn', { onclick: () => ((open = !open), render()) }, `⚠ ${warnings.length} warning${warnings.length > 1 ? 's' : ''}`)
      : h('span.ok', {}, '✓ No issues');
    replace(
      el,
      h('div.status-row', {}, layoutPart, h('span.muted', {}, `${keyCount(s)} keys · ${s.keymap.layers.length} layers · ${s.keymap.combos.length} combos`), h('span.grow'), warnBtn),
      open && warnings.length ? h('ul.warnings', {}, warnings.map((w) => h('li', {}, w))) : null,
    );
  };
  store.subscribe(render);
  render();
}
