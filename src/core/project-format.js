// The saved-data format shared by autosave and .zmk-project.json files. It is a public contract:
// files saved by any earlier version must keep loading. To change the shape:
//   1. bump FORMAT_VERSION,
//   2. add MIGRATIONS[old] that upgrades a version-`old` document by one step,
//   3. add a fixture saved in the old format to tests/fixtures/saved/ and a test that loads it.
// Never edit existing fixtures or migrations.

export const APP_ID = 'zmk-keymap-editor';
export const FORMAT_VERSION = 2;

// v1 → v2: keymaps gained custom behaviors, combo prior-idle / slow-release, and layer `extra`.
function v1ToV2(doc) {
  const km = doc.keymap;
  const keymap = km && {
    customBehaviors: [],
    rowHints: [],
    source: null,
    ...km,
    behaviors: km.behaviors ?? [],
    layers: (km.layers ?? []).map((l) => ({ extra: [], ...l })),
    combos: (km.combos ?? []).map((c) => ({
      timeout: null,
      layers: [],
      requirePriorIdle: null,
      slowRelease: false,
      extra: [],
      ...c,
    })),
  };
  return { ...doc, version: 2, keymap };
}

const MIGRATIONS = { 1: v1ToV2 };

const isNum = (n) => typeof n === 'number' && Number.isFinite(n);

function layoutProblem(layout, i) {
  if (!layout || !Array.isArray(layout.keys)) return `layout ${i} has no keys`;
  const bad = layout.keys.findIndex((k) => !k || !['x', 'y', 'w', 'h'].every((f) => isNum(k[f])));
  return bad < 0 ? null : `layout ${i}, key ${bad} has no valid position or size`;
}

function keymapProblem(km) {
  if (!Array.isArray(km.layers) || !km.layers.length) return 'the keymap has no layers';
  const layer = km.layers.findIndex(
    (l) => !Array.isArray(l?.bindings) || l.bindings.some((b) => typeof b !== 'string'),
  );
  if (layer >= 0) return `layer ${layer} has invalid bindings`;
  if (!Array.isArray(km.combos)) return 'combos are missing';
  if (!Array.isArray(km.behaviors)) return 'behaviors are missing';
  return null;
}

// A short reason when a (current-version) document is structurally unusable, else null.
export function shapeProblem(doc) {
  if (!Array.isArray(doc.layouts)) return 'layouts are missing';
  for (const [i, layout] of doc.layouts.entries()) {
    const problem = layoutProblem(layout, i);
    if (problem) return problem;
  }
  return doc.keymap ? keymapProblem(doc.keymap) : null;
}

// Upgrade a parsed document to FORMAT_VERSION.
// Returns { doc } or { kind: 'not-project' | 'newer' | 'invalid', error }.
export function upgrade(data) {
  if (data?.app !== APP_ID) return { kind: 'not-project', error: 'Not a zmk-yakme project file' };
  let version = data.version ?? 1;
  if (!Number.isInteger(version) || version < 1)
    return { kind: 'invalid', error: `Unknown project format version "${data.version}"` };
  if (version > FORMAT_VERSION) {
    return {
      kind: 'newer',
      error: `This project was saved by a newer version of zmk-yakme (format ${version}). Reload the page to get the latest version.`,
    };
  }
  let doc = data;
  for (; version < FORMAT_VERSION; version++) doc = MIGRATIONS[version](doc);
  const problem = shapeProblem(doc);
  return problem ? { kind: 'invalid', error: `This project file is damaged: ${problem}` } : { doc };
}
