// Keyboard shortcuts and drag-and-drop import.
import { keyCount } from '../core/state.js';
import { importFiles } from './dialogs.js';

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
    if (typing(document.activeElement) || mod || document.querySelector('dialog[open]')) return;
    const s = store.get();
    if (!s.keymap || s.ui.mode !== 'layers') return;
    const n = keyCount(s);
    if (e.key === 'Escape') actions.selectKey(null);
    else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const d = e.key === 'ArrowRight' ? 1 : -1;
      const cur = s.ui.key ?? (d > 0 ? -1 : n);
      actions.selectKey(Math.min(n - 1, Math.max(0, cur + d)));
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && s.ui.key !== null) {
      e.preventDefault();
      actions.setKeyBinding(s.ui.layer === 0 ? '&none' : '&trans');
    }
  });
}

export function mountDropzone(actions) {
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
    if (files.length) importFiles(files, actions);
  });
}
