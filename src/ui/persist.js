// Browser storage: the autosaved document and small per-user preferences.
import { serialize, readProject, initialState, isDirty } from '../core/state.js';

const DOC_KEY = 'zmk-keymap-editor:v1';
const PREFS_KEY = 'zmk-keymap-editor:prefs';
const BACKUP_KEY = 'zmk-keymap-editor:v1:unreadable';

// Set when the saved document came from a newer app version: nothing may overwrite or delete it.
let protectSaved = false;

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
  if (protectSaved) return;
  try {
    localStorage.removeItem(DOC_KEY);
  } catch {
    // storage unavailable: nothing to clear
  }
}

const NEWER_NOTICE =
  'Your autosaved work was saved by a newer version of zmk-yakme, so this version cannot open it. ' +
  'Reload the page to get the latest version. Until then, autosave is paused so that work is not overwritten.';
const UNREADABLE_NOTICE =
  'Your autosaved work could not be read, so the editor started fresh. A copy of the unreadable data was kept ' +
  `in this browser's storage under "${BACKUP_KEY}".`;

function readRaw(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

// Returns { state, notice? }. notice explains a saved document that could not be opened.
export function loadDocument() {
  const raw = readRaw(DOC_KEY);
  if (!raw) return { state: initialState() };
  const result = readProject(raw);
  if (result.state) {
    const dirty = !!JSON.parse(raw).dirty;
    return { state: { ...result.state, cleanKeymap: dirty ? null : result.state.keymap } };
  }
  if (result.kind === 'newer') {
    protectSaved = true;
    return { state: initialState(), notice: NEWER_NOTICE };
  }
  try {
    localStorage.setItem(BACKUP_KEY, raw);
  } catch {
    // storage unavailable: the notice still explains what happened
  }
  return { state: initialState(), notice: `${UNREADABLE_NOTICE} (${result.error})` };
}

const WATCHED = ['keymap', 'layouts', 'layoutIndex', 'fileName', 'cleanKeymap'];

function saveNow(s) {
  if (protectSaved) return;
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
