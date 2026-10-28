// Keyboard shortcuts and drag-and-drop import.
import { keyCount, activeLayout } from '../core/state.js';
import { nearestKey } from '../core/layout-ops.js';
import { importFiles } from './import-flow.js';

const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

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
    if (!s.keymap || s.ui.mode !== 'layers') return;
    const n = keyCount(s);
    const dir = ARROWS[e.key];
    if (e.key === 'Escape') actions.selectKey(null);
    else if (dir) {
      e.preventDefault();
      const keys = activeLayout(s)?.keys;
      if (s.ui.key === null || !keys?.[s.ui.key]) actions.selectKey(0);
      else actions.selectKey(nearestKey(keys, s.ui.key, dir));
    } else if ((e.key === 'Delete' || e.key === 'Backspace') && s.ui.key !== null) {
      e.preventDefault();
      actions.setKeyBinding(s.ui.layer === 0 ? '&none' : '&trans');
    } else if (/^[a-z0-9]$/i.test(e.key) && !e.altKey && s.ui.key !== null) {
      e.preventDefault();
      actions.setKeyBinding(`&kp ${/\d/.test(e.key) ? 'N' + e.key : e.key.toUpperCase()}`);
      if (s.ui.advance) actions.selectKey(Math.min(s.ui.key + 1, n - 1));
    }
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
