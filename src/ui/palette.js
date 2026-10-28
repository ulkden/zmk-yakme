// Keycode palette: click a keycode to assign it to the selected key or combo.
import { h, replace, isGlyph } from './dom.js';
import { KEY_GROUPS } from '../data/keycodes.js';

function matches(key, q) {
  return !q || key.code.toLowerCase().includes(q) || key.label.toLowerCase() === q;
}

export function mountPalette(el, store, actions) {
  let query = '';
  const groupsEl = h('div.palette-groups');
  const search = h('input.search', {
    type: 'search',
    placeholder: 'Filter keycodes…',
    oninput: (e) => {
      query = e.target.value.trim().toLowerCase();
      renderGroups();
    },
  });

  function renderGroups() {
    replace(
      groupsEl,
      KEY_GROUPS.map((g) => {
        const keys = g.keys.filter((k) => matches(k, query));
        if (!keys.length) return null;
        return h(
          'div.palette-group',
          {},
          h('div.group-name', {}, g.name),
          h('div.group-keys', {}, keys.map((k) => h('button.pk', { class: isGlyph(k.label) ? 'glyph' : '', title: k.code, onclick: () => actions.pickKeycode(k.code) }, k.label))),
        );
      }),
    );
  }

  const datalist = h('datalist', { id: 'keycode-list' }, KEY_GROUPS.flatMap((g) => g.keys.map((k) => h('option', { value: k.code }, k.label))));
  replace(el, h('div.palette-head', {}, search), groupsEl, datalist);
  renderGroups();

  const syncVisibility = () => el.classList.toggle('hidden', !store.get().keymap);
  store.subscribe(syncVisibility);
  syncVisibility();
}
