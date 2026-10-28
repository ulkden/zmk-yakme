// Checks that real ZMK files import, export and re-import without losing anything.
// Shared by the pinned-fixture tests (tests/zmk-boards.test.js) and the monthly drift check
// against ZMK's main branch (scripts/zmk-drift.mjs), so both apply exactly the same rules.
import { importText, applyImport, combineResults } from '../src/core/import.js';
import { exportKeymap } from '../src/core/export.js';
import { initialState } from '../src/core/state.js';
import { validate } from '../src/core/validate.js';
import { parseBinding } from '../src/core/bindings.js';
import { behaviorDef } from '../src/data/behaviors.js';

// Real ZMK boards, by their paths in the zmkfirmware/zmk repository. The pinned copies live in
// tests/fixtures/zmk/ at the same paths (see the README there).
export const BOARDS = [
  {
    name: 'Corne',
    layouts: ['app/dts/layouts/foostan/corne/5column.dtsi', 'app/dts/layouts/foostan/corne/6column.dtsi'],
    keymap: 'app/boards/shields/corne/corne.keymap',
  },
  {
    name: 'Lily58',
    layouts: ['app/dts/layouts/kata0510/lily58.dtsi'],
    keymap: 'app/boards/shields/lily58/lily58.keymap',
  },
  {
    name: 'Sofle',
    layouts: ['app/dts/layouts/josefadamcik/sofle.dtsi'],
    keymap: 'app/boards/shields/sofle/sofle.keymap',
  },
  {
    name: 'Kyria',
    layouts: ['app/boards/shields/kyria/kyria-layouts.dtsi'],
    keymap: 'app/boards/shields/kyria/kyria_rev3.keymap',
  },
  {
    name: 'Ferris',
    layouts: ['app/dts/layouts/cuddlykeyboards/ferris.dtsi'],
    keymap: 'app/boards/pierrechevalier83/ferris/ferris.keymap',
  },
  {
    name: 'REVIUNG41',
    layouts: ['app/dts/layouts/gtips/reviung41.dtsi'],
    keymap: 'app/boards/shields/reviung41/reviung41.keymap',
  },
  {
    name: 'Planck',
    layouts: ['app/dts/layouts/common/ortho_4x12/all1u.dtsi'],
    keymap: 'app/boards/olkb/planck/planck.keymap',
  },
  {
    name: 'nice!60',
    layouts: ['app/dts/layouts/common/60percent/ansi.dtsi'],
    keymap: 'app/boards/nicekeyboards/nice60/nice60.keymap',
  },
  {
    name: 'BDN9',
    layouts: ['app/boards/keebio/bdn9/bdn9-layouts.dtsi'],
    keymap: 'app/boards/keebio/bdn9/bdn9.keymap',
  },
];

// What an export must keep: layers, combos and custom behaviors. Layers shorter than the layout
// are padded on export (&none on the base layer, &trans above it, as validate() warns), so the
// exported layers are compared up to the original lengths and the rest must be that padding.
const content = (km, lengths = km.layers.map((l) => l.bindings.length)) =>
  JSON.stringify({
    layers: km.layers.map(({ id, name, bindings }, i) => ({ id, name, bindings: bindings.slice(0, lengths[i]) })),
    combos: km.combos,
    behaviors: km.behaviors,
  });

const onlyPadding = (before, after) =>
  after.layers.every((l, i) =>
    l.bindings.slice(before.layers[i]?.bindings.length).every((b) => b === (i ? '&trans' : '&none')),
  );

function keymapChanged(before, after) {
  if (after.layers.length !== before.layers.length) return true;
  const lengths = before.layers.map((l) => l.bindings.length);
  return content(after, lengths) !== content(before) || !onlyPadding(before, after);
}

// Lines outside the edited nodes that an export must carry over unchanged.
const preservedLines = (text) => text.split('\n').filter((l) => /^\s*#\s*(include|define)\b/.test(l));

// Export the state, import the result again and compare. Returns problem strings.
function roundTripProblems(state) {
  const problems = [];
  const exported = exportKeymap(state);
  const again = importText(exported);
  if (!again.keymap) return ['the exported keymap could not be imported again'];
  if (keymapChanged(state.keymap, again.keymap)) problems.push('layers, combos or behaviors changed on export');
  const missing = preservedLines(state.keymap.source ?? '').filter((l) => !exported.includes(l.trim()));
  if (missing.length) problems.push(`export dropped: ${missing.map((l) => l.trim()).join(', ')}`);
  if (exportKeymap(applyImport(state, again)) !== exported) problems.push('exporting twice gives different text');
  return problems;
}

// Bindings whose behavior is neither built into the editor nor defined in the keymap.
function unknownBehaviors(km) {
  const custom = [...km.behaviors, ...km.customBehaviors];
  const names = km.layers.flatMap((l) => l.bindings).map((b) => parseBinding(b).behavior);
  return [...new Set(names.filter((n) => !behaviorDef(n, custom)))];
}

// A file that only #includes another keymap (e.g. one half of a split board).
const isIncludeOnly = (text) =>
  text
    .replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, '')
    .split('\n')
    .every((l) => !l.trim() || /^\s*#\s*include\b/.test(l));

// files: { path: text } for one board's layout files and keymap, imported together as a user would.
// Returns { keys, layers, layouts, problems }.
export function checkBoard(board, files) {
  const paths = [...board.layouts, board.keymap];
  const entries = paths.map((name) => ({ name, result: importText(files[name]) }));
  const problems = entries.flatMap((e) => e.result.errors.map((err) => `${e.name}: ${err}`));
  if (problems.length) return { problems };
  const state = applyImport(initialState(), combineResults(entries)[0].result);
  if (!state.keymap) return { problems: ['no keymap found'] };
  const layout = state.layouts[state.layoutIndex];
  problems.push(...validate(state).map((w) => w.text), ...roundTripProblems(state));
  return {
    keys: layout?.keys.length ?? 0,
    layers: state.keymap.layers.length,
    layouts: state.layouts.map((l) => l.name),
    problems,
  };
}

// Any .keymap file on its own. Returns { skipped?, unknown, problems }.
export function checkKeymapFile(text) {
  if (isIncludeOnly(text)) return { skipped: 'only includes another keymap', unknown: [], problems: [] };
  const result = importText(text);
  if (!result.keymap) return { unknown: [], problems: result.errors };
  const state = applyImport(initialState(), result);
  return { unknown: unknownBehaviors(result.keymap), problems: roundTripProblems(state) };
}

// A devicetree file that defines physical layouts. Returns { layouts, problems }.
export function checkLayoutFile(text) {
  const { layouts } = importText(text);
  const problems = layouts.length ? [] : ['no physical layout found'];
  for (const l of layouts) {
    const bad = l.keys.filter((k) => ![k.x, k.y, k.r, k.rx, k.ry].every(Number.isFinite) || !(k.w > 0 && k.h > 0));
    if (!l.keys.length) problems.push(`layout "${l.name}" has no keys`);
    if (bad.length) problems.push(`layout "${l.name}" has ${bad.length} key(s) with invalid position or size`);
  }
  return { layouts: layouts.length, problems };
}

export const definesPhysicalLayout = (text) => /compatible\s*=\s*"zmk,physical-layout"/.test(text);
