// Application entry point: build the store, restore saved work and mount components.
import { createStore } from './core/store.js';
import { initialState, normalizeUi, serialize, deserialize } from './core/state.js';
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

const STORAGE_KEY = 'zmk-keymap-editor:v1';

function loadSaved() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const saved = raw && deserialize(raw);
    if (!saved) return initialState();
    return { ...saved, fileName: JSON.parse(raw).fileName ?? null };
  } catch {
    return initialState();
  }
}

function persist(store) {
  let timer;
  let last = null;
  store.subscribe((s) => {
    if (s.keymap === last?.keymap && s.layouts === last?.layouts && s.layoutIndex === last?.layoutIndex) return;
    last = s;
    clearTimeout(timer);
    timer = setTimeout(() => {
      try {
        const data = JSON.parse(serialize(s));
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...data, fileName: s.fileName ?? null }));
      } catch {
        // storage full or unavailable: editing still works, it just isn't saved
      }
    }, 300);
  });
}

const store = createStore(loadSaved(), { normalize: normalizeUi });
const actions = createActions(store);
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
mountDropzone(actions);
persist(store);

const syncLayout = () => document.body.classList.toggle('empty', !store.get().keymap);
store.subscribe(syncLayout);
syncLayout();
