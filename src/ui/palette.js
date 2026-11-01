// Keycode palette: click a keycode to assign it to the selected key or combo.
import { h, replace, isGlyph } from './dom.js';
import { KEY_GROUPS } from '../data/keycodes.js';

function matches(key, q) {
  return !q || key.code.toLowerCase().includes(q) || key.label.toLowerCase() === q;
}

export function mountPalette(el, store, actions) {
  let query = '';
  const groupsEl = h('div.palette-groups');
  const setQuery = (value) => {
    query = value.trim().toLowerCase();
    clear.hidden = !value;
    renderGroups();
  };
  const search = h('input.search', {
    type: 'search',
    name: 'keycode-filter',
    placeholder: 'Filter keycodes…',
    'aria-label': 'Filter keycodes',
    oninput: (e) => setQuery(e.target.value),
    onkeydown: (e) => {
      // Esc clears the filter only; it must not also deselect the key.
      if (e.key !== 'Escape' || !search.value) return;
      e.preventDefault();
      e.stopPropagation();
      search.value = '';
      setQuery('');
    },
  });
  // Our own ✕, so it looks and works the same in every browser (Firefox draws none).
  const clear = h(
    'button.search-clear',
    {
      type: 'button',
      title: 'Clear filter',
      'aria-label': 'Clear filter',
      hidden: true,
      onclick: () => {
        search.value = '';
        setQuery('');
        search.focus();
      },
    },
    '✕',
  );

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
          h(
            'div.group-keys',
            {},
            keys.map((k) =>
              h(
                'button.pk',
                { class: isGlyph(k.label) ? 'glyph' : '', title: k.code, onclick: () => actions.pickKeycode(k.code) },
                k.label,
              ),
            ),
          ),
        );
      }),
    );
  }

  const datalist = h(
    'datalist',
    { id: 'keycode-list' },
    KEY_GROUPS.flatMap((g) => g.keys.map((k) => h('option', { value: k.code }, k.label))),
  );
  replace(el, h('div.palette-head', {}, h('div.search-wrap', {}, search, clear)), groupsEl, datalist);
  renderGroups();

  // Nothing in the palette applies to behavior definitions, so it is hidden on that tab.
  const syncVisibility = () =>
    el.classList.toggle('hidden', !store.get().keymap || store.get().ui.mode === 'behaviors');
  store.subscribe(syncVisibility);
  syncVisibility();
}
