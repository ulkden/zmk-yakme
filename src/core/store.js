// Minimal observable store with undo/redo of the document (layouts + keymap).

const LIMIT = 200;
const docOf = (s) => ({ layouts: s.layouts, layoutIndex: s.layoutIndex, keymap: s.keymap });
const docChanged = (a, b) => a.layouts !== b.layouts || a.layoutIndex !== b.layoutIndex || a.keymap !== b.keymap;

// normalize(state) runs after every change (e.g. to clamp UI selections).
export function createStore(initial, { normalize = (s) => s } = {}) {
  let state = normalize(initial);
  const listeners = new Set();
  const past = [];
  const future = [];
  const emit = () => listeners.forEach((fn) => fn(state));

  return {
    get: () => state,
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    // fn(state) -> next state. Document changes are recorded for undo unless history is false.
    update(fn, { history = true } = {}) {
      const next = fn(state);
      if (next === state) return;
      if (history && docChanged(state, next)) {
        past.push(docOf(state));
        if (past.length > LIMIT) past.shift();
        future.length = 0;
      }
      state = normalize(next);
      emit();
    },
    undo() {
      if (!past.length) return;
      future.push(docOf(state));
      state = normalize({ ...state, ...past.pop() });
      emit();
    },
    redo() {
      if (!future.length) return;
      past.push(docOf(state));
      state = normalize({ ...state, ...future.pop() });
      emit();
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}
