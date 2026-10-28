// Minimal observable store with undo/redo of the document (layouts + keymap).

const LIMIT = 200;
const docOf = (s) => ({ layouts: s.layouts, layoutIndex: s.layoutIndex, keymap: s.keymap });
const docChanged = (a, b) => a.layouts !== b.layouts || a.layoutIndex !== b.layoutIndex || a.keymap !== b.keymap;

export function createStore(initial) {
  let state = initial;
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
      state = next;
      emit();
    },
    undo() {
      if (!past.length) return;
      future.push(docOf(state));
      state = { ...state, ...past.pop() };
      emit();
    },
    redo() {
      if (!future.length) return;
      past.push(docOf(state));
      state = { ...state, ...future.pop() };
      emit();
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
  };
}
