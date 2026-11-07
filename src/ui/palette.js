// Keycode palette: click a keycode to assign it to the selected key or combo.
// The keycodes are one Tab stop (roving focus, ASSUMPTIONS.md #33): ←/→ move through them in
// order, ↑/↓ to the nearest keycode in the row above or below, Home/End to the first/last.
import { h, replace, isGlyph } from './dom.js';
import { KEY_GROUPS, SPOKEN } from '../data/keycodes.js';
import { nearestKey } from '../core/layout-ops.js';
import { rovingStep } from '../core/focus-target.js';

function matches(key, q) {
  return !q || key.code.toLowerCase().includes(q) || key.label.toLowerCase() === q;
}

// The keycode in direction `key` from button `from`, or undefined for other keys.
function neighbour(buttons, from, key) {
  if (key !== 'ArrowUp' && key !== 'ArrowDown') return rovingStep(key, from, buttons.length);
  // Rows wrap and groups sit side by side, so ↑/↓ use positions on screen.
  const boxes = buttons.map((b) => {
    const r = b.getBoundingClientRect();
    return { x: r.left, y: r.top, w: r.width, h: r.height, r: 0 };
  });
  return nearestKey(boxes, from, key === 'ArrowUp' ? 'up' : 'down');
}

function keycodeButton(k, current, actions) {
  return h(
    'button.pk',
    {
      class: isGlyph(k.label) ? 'glyph' : '',
      title: k.code,
      'aria-label': SPOKEN[k.code] ?? null,
      tabindex: k.code === current ? '0' : '-1',
      'data-code': k.code,
      onclick: () => actions.pickKeycode(k.code),
    },
    k.label,
  );
}

function searchField(onQuery) {
  const search = h('input.search', {
    type: 'search',
    name: 'keycode-filter',
    placeholder: 'Filter keycodes…',
    'aria-label': 'Filter keycodes',
    oninput: (e) => onQuery(e.target.value),
    onkeydown: (e) => {
      // Esc clears the filter only; it must not also deselect the key.
      if (e.key !== 'Escape' || !search.value) return;
      e.preventDefault();
      e.stopPropagation();
      search.value = '';
      onQuery('');
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
        onQuery('');
        search.focus();
      },
    },
    '✕',
  );
  return { search, clear };
}

export function mountPalette(el, store, actions) {
  let query = '';
  let current = null; // code of the keycode that takes Tab
  const groupsEl = h('div.palette-groups');
  const { search, clear } = searchField((value) => {
    query = value.trim().toLowerCase();
    clear.hidden = !value;
    renderGroups();
  });

  function renderGroups() {
    const groups = KEY_GROUPS.map((g) => ({ ...g, keys: g.keys.filter((k) => matches(k, query)) })).filter(
      (g) => g.keys.length,
    );
    const codes = groups.flatMap((g) => g.keys.map((k) => k.code));
    if (!codes.includes(current)) current = codes[0] ?? null;
    replace(
      groupsEl,
      groups.map((g) =>
        h(
          'div.palette-group',
          {},
          h('h3.group-name', {}, g.name),
          h(
            'div.group-keys',
            {},
            g.keys.map((k) => keycodeButton(k, current, actions)),
          ),
        ),
      ),
    );
  }

  groupsEl.addEventListener('keydown', (e) => {
    const buttons = [...groupsEl.querySelectorAll('.pk')];
    const from = buttons.indexOf(e.target);
    const to = from < 0 || e.ctrlKey || e.metaKey || e.altKey ? undefined : neighbour(buttons, from, e.key);
    if (to === undefined) return;
    e.preventDefault();
    buttons[to].focus();
  });
  // Whatever focuses a keycode (arrows, a click) makes it the palette's one Tab stop.
  groupsEl.addEventListener('focusin', (e) => {
    const pk = e.target.closest?.('.pk');
    if (!pk) return;
    current = pk.dataset.code;
    groupsEl.querySelectorAll('.pk').forEach((b) => (b.tabIndex = b === pk ? 0 : -1));
  });

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
