// Renders the physical layout with the bindings of the active layer.
import { h, replace, isGlyph } from './dom.js';
import { activeLayout } from '../core/state.js';
import { layoutBounds } from '../core/layout-ops.js';
import { bindingLabel } from '../core/labels.js';
import { parseBinding } from '../core/bindings.js';
import { allCustomBehaviors } from '../core/behavior-ops.js';

const MAX_UNIT = 64;
const GAP = 4;

function keyClasses(state, i, binding, kind) {
  const { ui, keymap } = state;
  const cls = ['key', `kind-${kind}`];
  if (ui.mode === 'layers' && ui.key === i) cls.push('selected');
  if (ui.mode === 'behaviors') {
    const label = keymap.behaviors?.[ui.behavior]?.label;
    if (label && parseBinding(binding).behavior === label) cls.push('combo-on');
  }
  if (ui.mode === 'combos') {
    const combo = keymap.combos[ui.combo];
    if (combo?.keyPositions.includes(i)) cls.push('combo-on');
    else if (keymap.combos.some((c) => c.keyPositions.includes(i))) cls.push('combo-other');
  }
  return cls.join(' ');
}

function renderKey(state, key, i, unit, origin, onClick) {
  const layerIdx = state.ui.mode === 'combos' ? 0 : state.ui.layer;
  const binding = state.keymap.layers[layerIdx]?.bindings[i] ?? '';
  const label = bindingLabel(binding, state.keymap.layers, allCustomBehaviors(state.keymap));
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
    'button.' + keyClasses(state, i, binding, label.kind).replace(/ /g, '.'),
    { style, title: `#${i}  ${binding || '(no binding)'}`, onclick: () => onClick(i) },
    h('span.hold', {}, label.hold),
    h('span.tap', { class: isGlyph(label.tap) ? 'glyph' : '' }, label.tap),
    h('span.idx', {}, String(i)),
  );
}

export function mountKeyboard(el, store, actions) {
  const render = () => {
    const state = store.get();
    const layout = activeLayout(state);
    if (!layout || !state.keymap) return replace(el);
    const b = layoutBounds(layout.keys);
    const width = Math.max(1, b.maxX - b.minX);
    const height = Math.max(1, b.maxY - b.minY);
    const avail = Math.max(200, el.clientWidth - 32);
    const unit = Math.min(MAX_UNIT, avail / width);
    const board = h('div.board', { style: { width: `${width * unit}px`, height: `${height * unit}px` } });
    const origin = { x: b.minX, y: b.minY };
    layout.keys.forEach((key, i) => board.append(renderKey(state, key, i, unit, origin, actions.keyClick)));
    replace(el, board);
  };
  store.subscribe(render);
  new ResizeObserver(render).observe(el);
  render();
}
