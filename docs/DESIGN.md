# Functional Design

A static, client-side web app (no build step, no runtime dependencies) that turns a
physical layout plus an optional existing keymap into an edited ZMK `.keymap` file.

## Flow

1. **Import physical layout** — ZMK devicetree (`.dtsi` / `.overlay` / `.keymap` with
   `zmk,physical-layout` nodes, which is what zmk-layout-helper produces), QMK `info.json`,
   or a KLE raw-data JSON. If none is imported, a grid is inferred from the keymap's
   binding rows, or created via **New**.
2. **Import existing keymap** — any ZMK `.keymap`. Layers, combos, and custom behaviors
   are read; everything else in the file is preserved verbatim on export.
3. **Edit**
   - Layers: add, rename, reorder, delete (layer references in `&mo/&lt/&to/&tog/&sl`
     and combo `layers` are remapped automatically).
   - Keys: click a key, then pick a behavior + parameters or click a keycode in the palette.
   - Combos: create, pick positions by clicking keys, set binding, timeout and layers.
   - Undo / redo for all edits.
4. **Export** — download or copy the `.keymap`. If a keymap was imported, the `keymap` and
   `combos` nodes are regenerated (comments inside them are replaced; see ASSUMPTIONS.md #5),
   behavior nodes are rewritten only when edited or deleted, and missing `#include`s are added.
   Unknown properties inside those nodes, and everything outside them, are kept verbatim, except
   that renaming or deleting a behavior also updates its references there (other behaviors such as
   tap-dances, `&label { … };` overrides and `#define`s), so the file still builds.

Import is one dialog that auto-detects content: a single file can supply a layout, a
keymap, or both. Files can also be dropped anywhere on the page.

Every dialog and popover closes the same ways: its own buttons, Esc, the ✕ in its top-right
corner, or a click outside it. Closing without a button counts as Cancel.

## Accessibility

The app targets WCAG 2.2 AA; plan and progress are in [ACCESSIBILITY.md](ACCESSIBILITY.md).

- **Focus ring:** keyboard focus shows a 2 px light ring with a 2 px gap on every control. It never
  looks like the blue selection. Buttons and keys show it for keyboard focus only, not after a click;
  text fields show it whenever they are focused, as browsers do.
- **Focus is kept:** when part of the screen updates, focus stays on the control you used. When
  that control is gone (a deleted combo) or disabled, focus moves to its nearest neighbour.
- **Skip links:** the first Tab press shows *Skip to keys* (the selected key, else the first),
  *Skip to keycodes* (the filter) and *Skip to side panel* (its first control). They are hidden on the
  welcome screen, and the keycodes link is hidden on the Behaviors tab.
- **Messages:** every toast is also read out by screen readers, from one live region
  (`#announcer`, polite). While a dialog is open the page behind it is inert, so messages come from a
  live region inside the dialog instead. Error lines in dialogs (Import, repository listing) are read
  out too, and so are an opened example or blank keymap with its size ("Example loaded: 42 keys,
  3 layers").
- **Headings and dialogs:** the app name in the top bar is the page's only `h1`. Each dialog is named
  by its title; confirmations, errors and notices also read their message when they open.
- **Focus between screens:** opening a keymap removes the welcome screen, so focus moves to the first
  key; closing it moves focus to **Import Files**.
- **Keyboard diagram:** a listbox with one Tab stop. ←↑→↓ move to the physically nearest key,
  Home/End to the first/last. On the Layers tab selection follows focus; Enter on the selected key
  moves to the side panel to edit it. In Combos, Enter or Space adds or removes the focused key.
  Typing a letter or digit, Delete and Esc act only while a key has focus. Screen readers hear the
  key's legend first, then its position ("Esc, hold Ctrl, key 12"), and whether it is selected.
- **Keycode palette:** one Tab stop after the filter. ←/→ move through the keycodes, ↑/↓ to the
  nearest one above or below, Home/End to the ends. Group names are headings; symbol keycaps (⇥, ⏯)
  have spoken names that start with their visible letters.
- **Layer tabs:** a tablist with one Tab stop; ←/→ (wrapping) and Home/End switch layers. Combos and
  Behaviors are mode buttons; the one shown is marked current. ✎ opens the layer settings and
  moves focus to the display name; Esc closes them and returns focus to ✎.
- **Combos:** each combo in the list and each layer chip is a toggle button that says whether it is
  on; the chips form a group named "Layers". Keys are added with the mouse or with the arrow keys
  and Space. Save Combo returns focus to that combo in the list.
- **High contrast:** in forced-colours mode the selected key, the keys of the selected combo, the
  active layer tab, on-chips and the selected list item fill with the theme's Highlight colour.

## Click budget (≤ 3 clicks)

| Action                 | Clicks                                             |
|------------------------|----------------------------------------------------|
| Import a file          | Import → choose file → pick in OS dialog (or drag & drop: 0) |
| Untick a repo listing  | Deselect All (1)                                   |
| Pick another keyboard in a multi-keyboard repo | Deselect All → ▸ keyboard → tick its files (3, plus one per extra file; the chosen keyboard is ticked already) |
| Set a key to a keycode | key → palette keycode (2), or key + type a letter (1) |
| Set a key behavior     | key → behavior select → option (3)                 |
| Add layer              | + (1)                                              |
| Layer settings         | ✎ → field or action (2); delete needs 1 more to confirm (3) |
| Add combo              | Combos tab → + New Combo → key(s) (3)              |
| Add custom behavior    | Behaviors tab → + Hold-Tap/Mod-Morph/Macro (2)     |
| Finish a combo         | Save Combo, or Esc (1)                             |
| Back to the key from Behaviors | Save Behavior (returns to the last key), or click any key (1) |
| Export                 | Export… → Download (2)                             |
| Clear warnings         | ⚠ N warnings → Clear Warnings (2); "N hidden" shows them again (1) |
| Save project           | Save Project (1)                                   |
| Open project           | Open Project (toolbar or welcome screen) → pick in OS dialog (2) |
| Close keymap           | Close Keymap → Close Keymap (2)                    |
| See version / release notes | version link in the status bar or on the welcome screen (1) |
| Change a number        | field → type, or field → scroll the wheel (1)      |

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

Data model (stored in localStorage and in `.zmk-project.json` files as a versioned document,
`{ app, version, layouts, layoutIndex, keymap, fileName }`; see `src/core/project-format.js` for the
format version and migrations; the document parts are undoable):

```js
state = {
  layouts: [{ name, keys: [{ x, y, w, h, r, rx, ry }] }],   // key units (1u)
  layoutIndex: 0,
  keymap: {
    layers: [{ id, name, bindings: ['&kp A', ...], extra: [rawProp] }],
    combos: [{ name, keyPositions, binding, timeout, layers, requirePriorIdle, slowRelease, extra }],
                                 // keyPositions, layers: numbers, or #define names as strings
    behaviors: [{ kind: 'hold-tap'|'mod-morph'|'macro', label, name, bindings, …kind fields, extra, orig, origLabel }],
    customBehaviors: [{ label, cells }],   // other behaviors in the file (not editable)
    rowHints: [n, ...],          // binding count per source line (layout fallback)
    source: 'original text' | null,
  },
  fileName, cleanKeymap,          // export name; keymap as of the last import/export/save
  ui: { mode: 'layers' | 'combos' | 'behaviors', layer, key, combo, behavior, layerMenu, advance, diagrams },
}
```
