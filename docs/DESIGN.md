# Functional Design

A static, client-side web app (no build step, no runtime dependencies) that turns a
physical layout plus an optional existing keymap into an edited ZMK `.keymap` file.

## Flow

1. **Import physical layout** — ZMK devicetree (`.dtsi` / `.overlay` / `.keymap` with
   `zmk,physical-layout` nodes, which is what zmk-layout-helper produces), QMK `info.json`,
   or a KLE raw-data JSON. If none is imported, a grid is inferred from the keymap's
   binding rows, or created via **New**.
2. **Import existing keymap** — any ZMK `.keymap`. Layers, combos, and custom behavior
   labels are read; everything else in the file is preserved verbatim on export.
3. **Edit**
   - Layers: add, rename, reorder, delete (layer references in `&mo/&lt/&to/&tog/&sl`
     and combo `layers` are remapped automatically).
   - Keys: click a key, then pick a behavior + parameters or click a keycode in the palette.
   - Combos: create, pick positions by clicking keys, set binding, timeout and layers.
   - Undo / redo for all edits.
4. **Export** — download or copy the `.keymap`. If a keymap was imported, only the
   `keymap` and `combos` nodes are regenerated (plus any missing `#include`s).

Import is one dialog that auto-detects content: a single file can supply a layout, a
keymap, or both. Files can also be dropped anywhere on the page.

## Click budget (≤ 3 clicks)

| Action                 | Clicks                                             |
|------------------------|----------------------------------------------------|
| Import a file          | Import → choose file → pick in OS dialog (or drag & drop: 0) |
| Set a key to a keycode | key → palette keycode (2)                          |
| Set a key behavior     | key → behavior select → option (3)                 |
| Add layer              | + (1)                                              |
| Rename / move / delete layer | layer tab → action (2)                       |
| Add combo              | Combos tab → key(s) (2+, first key creates combo)  |
| Export                 | Download (1) / Copy (1)                            |

## Architecture

```
index.html, css/app.css
src/dts/     devicetree text: comment masking, tokenizer, tolerant parser, int expressions
src/core/    pure logic: layouts, bindings, keymap parse/write, model ops, store, validation
src/data/    keycodes, behaviors, example keyboard
src/ui/      DOM components; each exports a mount(el, store) function
src/main.js  wiring
tests/       node:test files (run with `npm test` or open tests/index.html)
```

Data model (stored in localStorage, undoable):

```js
state = {
  layouts: [{ name, keys: [{ x, y, w, h, r, rx, ry }] }],   // key units (1u)
  layoutIndex: 0,
  keymap: {
    layers: [{ id, name, bindings: ['&kp A', ...], extra: [rawProp] }],
    combos: [{ id, name, keyPositions, binding, timeout, layers, extra }],
    customBehaviors: [{ label, cells }],
    rowHints: [n, ...],          // binding count per source line (layout fallback)
    source: 'original text' | null,
  },
  ui: { mode: 'layers' | 'combos', layer, key, combo },
}
```
