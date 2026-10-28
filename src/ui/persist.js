// Browser storage: the autosaved document and small per-user preferences.
import { serialize, deserialize, initialState, isDirty } from '../core/state.js';

const DOC_KEY = 'zmk-keymap-editor:v1';
const PREFS_KEY = 'zmk-keymap-editor:prefs';

export function loadPrefs() {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY)) ?? {};
  } catch {
    return {};
  }
}

export function savePref(name, value) {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify({ ...loadPrefs(), [name]: value }));
  } catch {
    // storage unavailable: the preference just isn't remembered
  }
}

export function clearPrefs() {
  try {
    localStorage.removeItem(PREFS_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}

export function clearDocument() {
  try {
    localStorage.removeItem(DOC_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}

export function loadDocument() {
  try {
    const raw = localStorage.getItem(DOC_KEY);
    const saved = raw && deserialize(raw);
    if (!saved) return initialState();
    const { dirty } = JSON.parse(raw);
    return { ...saved, cleanKeymap: dirty ? null : saved.keymap };
  } catch {
    return initialState();
  }
}

const WATCHED = ['keymap', 'layouts', 'layoutIndex', 'fileName', 'cleanKeymap'];

function saveNow(s) {
  if (!s.keymap && !s.layouts.length) return clearDocument();
  try {
    const data = JSON.parse(serialize(s));
    const dirty = isDirty(s);
    localStorage.setItem(DOC_KEY, JSON.stringify({ ...data, dirty }));
  } catch {
    // storage full or unavailable: editing still works, it just isn't saved
  }
}

// Debounced save on document changes, flushed when the page is hidden or unloaded.
export function autosave(store) {
  let timer = null;
  let last = null;
  const flush = () => {
    if (timer === null) return;
    clearTimeout(timer);
    timer = null;
    saveNow(store.get());
  };
  store.subscribe((s) => {
    if (last && WATCHED.every((k) => s[k] === last[k])) return;
    last = s;
    clearTimeout(timer);
    timer = setTimeout(flush, 300);
  });
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
}
