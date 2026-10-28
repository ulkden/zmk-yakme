// Detect what a pasted/dropped file contains and merge it into the state.
import { parseDtsLayouts } from './layout-dts.js';
import { parseQmkLayouts, parseKleLayout } from './layout-json.js';
import { gridLayout } from './layout-ops.js';
import { parseKeymap } from './keymap-parse.js';
import { emptyKeymap } from './keymap-ops.js';
import { deserialize, keyCount } from './state.js';

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

export function importText(text) {
  const trimmed = String(text ?? '').trim();
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) return importJson(trimmed);
  const result = { layouts: parseDtsLayouts(text), keymap: parseKeymap(text), project: null, errors: [] };
  if (!result.layouts.length && !result.keymap) result.errors.push('No physical layout or keymap found in this file');
  return result;
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
  if (!next.keymap && layouts.length) next.keymap = emptyKeymap(keyCount(next));
  return next;
}
