// Detect what a pasted/dropped file contains and merge it into the state.
import { parseDtsLayouts } from './layout-dts.js';
import { parseQmkLayouts, parseKleLayout } from './layout-json.js';
import { gridLayout } from './layout-ops.js';
import { parseKeymap } from './keymap-parse.js';
import { emptyKeymap } from './keymap-ops.js';
import { deserialize, keyCount } from './state.js';
import { legendToBinding } from './legends.js';

// KLE "raw data" is JSON-like but has unquoted keys and no outer brackets.
export function looseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    const quoted = text.trim().replace(/([{,]\s*)([A-Za-z_]\w*)\s*:/g, '$1"$2":');
    for (const candidate of [quoted, `[${quoted}]`]) {
      try {
        return JSON.parse(candidate);
      } catch {
        // try the next candidate
      }
    }
    throw new Error('not valid JSON or KLE raw data');
  }
}

function importJson(text) {
  const result = { layouts: [], keymap: null, project: null, errors: [] };
  let data;
  try {
    data = looseJson(text);
  } catch (err) {
    result.errors.push(`Could not parse JSON: ${err.message}`);
    return result;
  }
  result.project = deserialize(data);
  if (result.project) return result;
  if (Array.isArray(data)) result.layouts = [parseKleLayout(data)];
  else if (data?.layouts) result.layouts = parseQmkLayouts(data);
  if (!result.layouts.length) result.errors.push('JSON is not a QMK info.json, KLE layout, or saved project');
  return result;
}

const HELPER_MACROS = /\bZMK_(LAYER|BASE_LAYER|COMBO|HOLD_TAP|MOD_MORPH|MACRO|BEHAVIOR|TAP_DANCE|CONDITIONAL_LAYER)\s*\(/;

export function importText(text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return importJson(trimmed);
  const result = { layouts: parseDtsLayouts(text), keymap: parseKeymap(text), project: null, errors: [] };
  if (result.layouts.length || result.keymap) return result;
  if (HELPER_MACROS.test(text)) {
    result.errorKind = 'helper-macros';
    result.errors.push('This keymap is written with ZMK helper macros (ZMK_LAYER, ZMK_COMBO, …), which are not supported yet.');
  } else {
    result.errors.push('No physical layout or keymap found in this file');
  }
  return result;
}

// Base layer from KLE legends, when the layout carries them.
function seededKeymap(layout, count) {
  const km = emptyKeymap(count);
  if (!layout?.legends?.length) return km;
  const bindings = layout.legends.map(legendToBinding);
  return { ...km, layers: [{ ...km.layers[0], bindings }] };
}

function inferLayout(keymap) {
  const rows = keymap.rowHints?.length ? keymap.rowHints : [keymap.layers[0]?.bindings.length ?? 0];
  return { ...gridLayout(rows, 'Inferred grid'), inferred: true };
}

// Merge an import result into the state. Returns the next state.
export function applyImport(state, result) {
  if (result.project) return result.project;
  let { layouts, layoutIndex, keymap } = state;
  if (result.layouts.length) {
    layouts = result.layouts;
    layoutIndex = 0;
  }
  if (result.keymap) {
    keymap = result.keymap;
    const onlyInferred = layouts.every((l) => l.inferred);
    if (!result.layouts.length && onlyInferred) {
      layouts = [inferLayout(keymap)];
      layoutIndex = 0;
    }
  }
  const next = { ...state, layouts, layoutIndex, keymap, ui: { ...state.ui, layer: 0, key: null, combo: null } };
  if (!next.keymap && layouts.length) next.keymap = seededKeymap(layouts[layoutIndex], keyCount(next));
  return next;
}
