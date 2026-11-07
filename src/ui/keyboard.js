// Renders the physical layout with the bindings of the active layer.
// Keyboard use follows the ARIA listbox pattern with roving focus (ASSUMPTIONS.md #33): the diagram
// is one Tab stop, arrow keys move by physical position, Home/End go to the first/last key. On the
// Layers tab selection follows focus; in Combos, Enter/Space adds or removes the focused key.
// Typing a letter or digit, Delete and Esc act on the key only while it has focus (#34).
import { h, replace, isGlyph, renderKeepingFocus, FOCUSABLE, unusable } from './dom.js';
import { activeLayout, keyCount } from '../core/state.js';
import { layoutBounds, nearestKey } from '../core/layout-ops.js';
import { bindingLabel } from '../core/labels.js';
import { keyName } from '../core/key-names.js';
import { rovingStep } from '../core/focus-target.js';
import { parseBinding } from '../core/bindings.js';
import { allCustomBehaviors } from '../core/behavior-ops.js';

const MAX_UNIT = 64;
const GAP = 4;
const ARROWS = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' };

// Whether key i is "on": the selected key, a key of the selected combo, or a key using the
// selected behavior. Shown by colour and exposed as aria-selected.
function isOn(state, i, binding) {
  const { ui, keymap } = state;
  if (ui.mode === 'layers') return ui.key === i;
  if (ui.mode === 'combos') return !!keymap.combos[ui.combo]?.keyPositions.includes(i);
  const label = keymap.behaviors?.[ui.behavior]?.label;
  return !!label && parseBinding(binding).behavior === label;
}

function keyClasses(state, i, on, kind) {
  const cls = ['key', `kind-${kind}`];
  if (on) cls.push(state.ui.mode === 'layers' ? 'selected' : 'combo-on');
  else if (state.ui.mode === 'combos' && state.keymap.combos.some((c) => c.keyPositions.includes(i)))
    cls.push('combo-other');
  return cls.join(' ');
}

// What the list of keys is, for screen readers ("Keys on layer Base", "Keys in combo combo_esc").
function listLabel({ ui, keymap }) {
  if (ui.mode === 'combos') return keymap.combos[ui.combo] ? `Keys in combo ${keymap.combos[ui.combo].name}` : 'Keys';
  if (ui.mode === 'behaviors')
    return keymap.behaviors?.[ui.behavior] ? `Keys using ${keymap.behaviors[ui.behavior].label}` : 'Keys';
  return `Keys on layer ${keymap.layers[ui.layer]?.name ?? ''}`;
}

function renderKey(state, key, i, view) {
  const layerIdx = state.ui.mode === 'combos' ? 0 : state.ui.layer;
  const binding = state.keymap.layers[layerIdx]?.bindings[i] ?? '';
  const { custom } = view;
  const label = bindingLabel(binding, state.keymap.layers, custom);
  const on = isOn(state, i, binding);
  const { unit, origin } = view;
  const style = {
    left: `${(key.x - origin.x) * unit}px`,
    top: `${(key.y - origin.y) * unit}px`,
    width: `${key.w * unit - GAP}px`,
    height: `${key.h * unit - GAP}px`,
  };
  if (key.r) {
    style.transform = `rotate(${key.r}deg)`;
    style.transformOrigin = `${(key.rx - key.x) * unit}px ${(key.ry - key.y) * unit}px`;
  }
  return h(
    'button.' + keyClasses(state, i, on, label.kind).replace(/ /g, '.'),
    {
      style,
      title: `#${i}  ${binding || '(no binding)'}`,
      role: 'option',
      'aria-selected': String(on),
      'aria-label': keyName(binding, state.keymap.layers, custom, i),
      tabindex: i === view.roving ? '0' : '-1',
      'data-focus': `key-${i}`,
      'data-index': i,
      onclick: () => view.onClick(i),
    },
    h('span.hold', { 'aria-hidden': 'true' }, label.hold),
    h('span.tap', { class: isGlyph(label.tap) ? 'glyph' : '', 'aria-hidden': 'true' }, label.tap),
    h('span.idx', { 'aria-hidden': 'true' }, String(i)),
  );
}

// The key that takes Tab: the selected key on the Layers tab, else the one last focused.
function rovingIndex(state, last) {
  if (state.ui.mode === 'layers' && state.ui.key !== null) return state.ui.key;
  return Math.min(last, Math.max(0, keyCount(state) - 1));
}

function focusPanel() {
  const panel = document.getElementById('inspector');
  [...panel.querySelectorAll(FOCUSABLE)].find((c) => !unusable(c))?.focus();
}

// Letters, digits, Delete and Esc on a focused key (Layers tab only). Returns true when handled.
function editKey(e, i, store, actions, moveTo) {
  const s = store.get();
  if (s.ui.mode !== 'layers') return false;
  if (e.key === 'Escape' && !s.ui.layerMenu && s.ui.key !== null) actions.selectKey(null);
  else if (e.key === 'Delete' || e.key === 'Backspace') {
    if (s.ui.key !== i) actions.selectKey(i);
    actions.setKeyBinding(s.ui.layer === 0 ? '&none' : '&trans');
  } else if (/^[a-z0-9]$/i.test(e.key)) {
    if (s.ui.key !== i) actions.selectKey(i);
    actions.setKeyBinding(`&kp ${/\d/.test(e.key) ? 'N' + e.key : e.key.toUpperCase()}`);
    if (s.ui.advance) moveTo(Math.min(i + 1, keyCount(s) - 1));
  } else return false;
  return true;
}

function keyHandlers(el, store, actions, view) {
  const keyEl = (i) => el.querySelector(`[data-focus="key-${i}"]`);
  const moveTo = (i) => {
    if (store.get().ui.mode === 'layers') actions.selectKey(i);
    keyEl(i)?.focus();
  };
  view.onClick = (i) => {
    keyEl(i)?.focus(); // WebKit doesn't focus a clicked button; typing on it needs focus
    actions.keyClick(i);
  };
  // Whatever moves focus to a key (arrows, a click, a skip link) makes it the diagram's one Tab
  // stop, so there is never a second one.
  el.addEventListener('focusin', (e) => {
    const k = e.target.closest?.('.key');
    if (!k) return;
    view.last = Number(k.dataset.index);
    el.querySelectorAll('.key').forEach((key) => (key.tabIndex = key === k ? 0 : -1));
  });
  el.addEventListener('keydown', (e) => {
    const k = e.target.closest?.('.key');
    if (!k || e.ctrlKey || e.metaKey || e.altKey) return;
    const i = Number(k.dataset.index);
    const { ui } = store.get();
    // Enter on the key that is already selected opens it for editing in the side panel. Space and
    // other activations (clicks, assistive technology) still toggle it, as a click does.
    if (e.key === 'Enter' && ui.mode === 'layers' && ui.key === i) {
      e.preventDefault();
      return focusPanel();
    }
    const keys = activeLayout(store.get())?.keys ?? [];
    // Arrows follow the physical layout; Home/End are the list's ends.
    const next = ARROWS[e.key]
      ? nearestKey(keys, i, ARROWS[e.key])
      : ['Home', 'End'].includes(e.key)
        ? rovingStep(e.key, i, keys.length)
        : undefined;
    if (next !== undefined) {
      e.preventDefault();
      return moveTo(next);
    }
    if (editKey(e, i, store, actions, moveTo)) e.preventDefault();
  });
}

export function mountKeyboard(el, store, actions) {
  const view = { last: 0, custom: [], onClick: () => {} };
  keyHandlers(el, store, actions, view);
  const draw = () => {
    const state = store.get();
    const layout = activeLayout(state);
    if (!layout || !state.keymap) return replace(el);
    const b = layoutBounds(layout.keys);
    const width = Math.max(1, b.maxX - b.minX);
    const height = Math.max(1, b.maxY - b.minY);
    const avail = Math.max(200, el.clientWidth - 32);
    view.unit = Math.min(MAX_UNIT, avail / width);
    view.origin = { x: b.minX, y: b.minY };
    view.roving = rovingIndex(state, view.last);
    view.custom = allCustomBehaviors(state.keymap);
    const board = h('div.board', {
      role: 'listbox',
      'aria-label': listLabel(state),
      'aria-multiselectable': state.ui.mode === 'layers' ? null : 'true',
      style: { width: `${width * view.unit}px`, height: `${height * view.unit}px` },
    });
    layout.keys.forEach((key, i) => board.append(renderKey(state, key, i, view)));
    replace(el, board);
  };
  const render = () => renderKeepingFocus(el, draw);
  store.subscribe(render);
  // Re-render only when the available width changes, and outside the observer callback:
  // rendering changes the board's height, which would otherwise re-trigger the observer
  // (WebKit reports that loop as an error).
  let width = el.clientWidth;
  let frame = 0;
  new ResizeObserver(() => {
    if (el.clientWidth === width || frame) return;
    frame = requestAnimationFrame(() => {
      frame = 0;
      width = el.clientWidth;
      render();
    });
  }).observe(el);
  render();
}
