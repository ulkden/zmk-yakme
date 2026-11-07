// Bottom status bar: layout choice, key count, warnings and the app version.
import { h, replace, renderKeepingFocus, announce, focusRequested } from './dom.js';
import { activeLayout, keyCount } from '../core/state.js';
import { validate } from '../core/validate.js';
import { versionLink } from './version.js';
import { addedWarnings, stillDismissed, newWarningsMessage } from '../core/warning-diff.js';

const FIXES = {
  trim: {
    label: 'Trim Extra Bindings',
    run: (actions) => (actions.trimExtraBindings(), announce('Extra bindings trimmed')),
  },
};

function warningItem(w, actions, ui) {
  const fix = FIXES[w.fix];
  const run = () => (fix.run(actions), ui.afterFix());
  return h('li', {}, w.text, fix ? h('button.link', { onclick: run }, fix.label) : null);
}

// One subtle pulse when new warnings appear. The bar re-renders often, so a running pulse
// continues on the new element (negative delay) instead of starting over.
const PULSE_MS = 900;

function warnButton(count, pulseStart, onclick, open) {
  const btn = h(
    'button.warn',
    { onclick, 'data-focus': 'warnings', 'aria-expanded': String(open), 'aria-controls': open ? 'warnings-box' : null },
    `⚠ ${count} warning${count > 1 ? 's' : ''}`,
  );
  const age = performance.now() - pulseStart;
  if (age < PULSE_MS) {
    btn.classList.add('pulse');
    btn.style.animationDelay = `-${Math.round(age)}ms`;
    btn.addEventListener('animationend', () => btn.classList.remove('pulse'), { once: true });
  }
  return btn;
}

function warningSummary(visible, hidden, pulseStart, ui) {
  const restore = hidden
    ? h(
        'button.link.muted',
        { onclick: ui.restore, title: 'Show the cleared warnings again', 'data-focus': 'warnings-hidden' },
        `${hidden} hidden`,
      )
    : null;
  if (visible.length) return [warnButton(visible.length, pulseStart, ui.toggle, ui.isOpen()), restore];
  // Focusable by script only, so focus has somewhere to land when the last warning is fixed.
  const ok = (...content) => h('span.ok', { tabindex: '-1', 'data-focus': 'warnings-ok' }, ...content);
  if (!hidden) return ok('✓ No issues');
  return ok('✓ No new issues ', restore);
}

export function mountStatus(el, store, actions) {
  let open = false;
  let seen = [];
  let dismissed = new Set();
  let pulseStart = -Infinity;
  // Clear Warnings, "N hidden" and a fix remove themselves, so focus moves to what replaces them.
  const focus = (...names) =>
    focusRequested(el, { name: names.find((n) => el.querySelector(`[data-focus="${n}"]`)), fallbacks: [] });
  const ui = {
    isOpen: () => open,
    toggle: () => ((open = !open), render()),
    restore: () => ((dismissed = new Set()), (open = true), render(), focus('warnings')),
    clear: (texts) => ((dismissed = new Set(texts)), (open = false), render(), focus('warnings-hidden')),
    afterFix: () => focus('warnings', 'warnings-ok'),
  };
  // Warnings are read out only when they appear while editing: not those a keymap already had when it
  // opened (page load, import, example), and not on a freshly loaded, unchanged keymap.
  let primed = false;
  const draw = () => {
    const s = store.get();
    const layout = activeLayout(s);
    if (!s.keymap) {
      seen = [];
      dismissed = new Set();
      primed = false;
      return replace(el);
    }
    const warnings = validate(s);
    const texts = warnings.map((w) => w.text);
    dismissed = stillDismissed(dismissed, texts);
    const added = addedWarnings(seen, texts);
    if (added.length) {
      pulseStart = performance.now();
      if (primed && s.keymap !== s.cleanKeymap) announce(newWarningsMessage(added, { open }), { last: true });
    }
    primed = true;
    seen = texts;
    const visible = warnings.filter((w) => !dismissed.has(w.text));
    const layoutPart = h(
      'label.status-layout',
      {},
      h('span.muted', {}, 'Physical Layouts:'),
      s.layouts.length > 1
        ? h(
            'select',
            { name: 'layout', onchange: (e) => actions.selectLayout(Number(e.target.value)) },
            s.layouts.map((l, i) => h('option', { value: i, selected: i === s.layoutIndex }, l.name)),
          )
        : h('span', {}, layout?.name ?? 'No layout'),
    );
    replace(
      el,
      h(
        'div.status-row',
        {},
        layoutPart,
        h(
          'span.muted',
          {},
          `${keyCount(s)} keys · ${s.keymap.layers.length} layers · ${s.keymap.combos.length} combos`,
        ),
        h('span.grow'),
        warningSummary(visible, dismissed.size, pulseStart, ui),
        versionLink(),
      ),
      open && visible.length
        ? h(
            'div.warnings-box',
            { id: 'warnings-box' },
            h(
              'ul.warnings',
              { 'aria-label': 'Warnings' },
              visible.map((w) => warningItem(w, actions, ui)),
            ),
            h('button.link.clear-warnings', { onclick: () => ui.clear(texts) }, 'Clear Warnings'),
          )
        : null,
    );
  };
  const render = () => renderKeepingFocus(el, draw);
  store.subscribe(render);
  render();
}
