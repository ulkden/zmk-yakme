// Page-wide keyboard shortcuts and drag-and-drop import. Keys on the keyboard diagram (arrows,
// typing, Delete, Esc) are handled by the diagram itself, only while a key has focus (keyboard.js).
import { importFiles } from './import-flow.js';

const typing = (el) => el && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

export function mountShortcuts(store, actions) {
  document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'z' && !typing(document.activeElement)) {
      e.preventDefault();
      return e.shiftKey ? actions.redo() : actions.undo();
    }
    if (mod && e.key.toLowerCase() === 'y' && !typing(document.activeElement)) {
      e.preventDefault();
      return actions.redo();
    }
    const s = store.get();
    if (e.key === 'Escape' && s.ui.layerMenu) return actions.closeLayerMenu();
    if (typing(document.activeElement) || mod || document.querySelector('dialog[open]')) return;
    if (e.key === 'Escape' && s.ui.mode === 'combos' && s.ui.combo !== null) return actions.finishCombo();
  });
}

export function mountDropzone(store, actions) {
  const overlay = document.getElementById('drop-overlay');
  let depth = 0;
  const show = (on) => overlay.classList.toggle('show', on);
  window.addEventListener('dragenter', (e) => {
    if (!e.dataTransfer?.types.includes('Files')) return;
    depth++;
    show(true);
  });
  window.addEventListener('dragleave', () => {
    depth = Math.max(0, depth - 1);
    if (!depth) show(false);
  });
  window.addEventListener('dragover', (e) => e.preventDefault());
  window.addEventListener('drop', (e) => {
    e.preventDefault();
    depth = 0;
    show(false);
    const files = [...(e.dataTransfer?.files ?? [])];
    if (files.length) importFiles(files, store, actions);
  });
}
