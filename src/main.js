// Application entry point: build the store, restore saved work and mount components.
import { createStore } from './core/store.js';
import { normalizeUi } from './core/state.js';
import { loadDocument, loadPrefs, savePref, autosave } from './ui/persist.js';
import { toast } from './ui/dom.js';
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
const initial = loadDocument();
initial.ui = { ...initial.ui, advance: !!prefs.advance, diagrams: prefs.diagrams ?? true };
const store = createStore(initial, { normalize: normalizeUi });
const actions = createActions(store, { savePref, notify: toast });
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

const syncLayout = () => document.body.classList.toggle('empty', !store.get().keymap);
store.subscribe(syncLayout);
syncLayout();
