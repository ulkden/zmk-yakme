// Application entry point: build the store, restore saved work and mount components.
import { createStore } from './core/store.js';
import { normalizeUi } from './core/state.js';
import { loadDocument, loadPrefs, savePref, autosave, clearDocument, clearPrefs } from './ui/persist.js';
import { h, toast } from './ui/dom.js';
import { dialog } from './ui/modal.js';
import { createActions } from './ui/actions.js';
import { createDialogs } from './ui/dialogs.js';
import { mountToolbar } from './ui/toolbar.js';
import { mountTabs } from './ui/tabs.js';
import { mountKeyboard } from './ui/keyboard.js';
import { mountInspector } from './ui/inspector.js';
import { mountPalette } from './ui/palette.js';
import { mountStatus } from './ui/status.js';
import { mountWelcome } from './ui/welcome.js';
import { mountShortcuts, mountDropzone } from './ui/shortcuts.js';

const prefs = loadPrefs();
const { state: initial, notice } = loadDocument();
initial.ui = { ...initial.ui, advance: !!prefs.advance, diagrams: prefs.diagrams ?? true };
const store = createStore(initial, { normalize: normalizeUi });
const clearStorage = ({ resetPrefs }) => {
  clearDocument();
  if (resetPrefs) clearPrefs();
};
const actions = createActions(store, { savePref, notify: toast, clearStorage });
const dialogs = createDialogs(store, actions);
const $ = (id) => document.getElementById(id);

mountToolbar($('toolbar'), store, actions, dialogs);
mountWelcome($('welcome'), store, actions, dialogs);
mountTabs($('tabs'), store, actions);
mountKeyboard($('keyboard'), store, actions);
mountPalette($('palette'), store, actions);
mountInspector($('inspector'), store, actions);
mountStatus($('status'), store, actions);
mountShortcuts(store, actions);
mountDropzone(store, actions);
autosave(store);

if (notice) {
  const dlg = dialog(
    'Saved work not opened',
    h('p', {}, notice),
    [h('button.primary', { onclick: () => dlg.close() }, 'OK')],
    'notice',
  );
}

const syncLayout = () => document.body.classList.toggle('empty', !store.get().keymap);
store.subscribe(syncLayout);
syncLayout();
