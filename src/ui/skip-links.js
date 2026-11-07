// "Skip to" links (in index.html), shown on the first Tab press. Each moves focus to something
// useful in its region instead of following the link, so the address bar keeps no #fragment.

const FOCUSABLE = 'button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea, a[href]';

// keys: the selected key, else the first one. palette: the keycode filter. panel: its first control.
function target(name, state) {
  const $ = (id) => document.getElementById(id);
  if (name === 'keys') {
    const keys = $('keyboard').querySelectorAll('.key');
    return keys[state.ui.key ?? 0] ?? keys[0];
  }
  if (name === 'palette') return $('palette').querySelector('input');
  const panel = $('inspector');
  return panel.querySelector(FOCUSABLE) ?? panel;
}

export function mountSkipLinks(store) {
  const links = [...document.querySelectorAll('.skip-links a')];
  for (const link of links) {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      target(link.dataset.skip, store.get())?.focus();
    });
  }
  // Nothing in the palette applies on the Behaviors tab, so it is hidden there (see palette.js).
  const sync = () => {
    const palette = links.find((l) => l.dataset.skip === 'palette');
    palette.hidden = store.get().ui.mode === 'behaviors';
  };
  store.subscribe(sync);
  sync();
}
