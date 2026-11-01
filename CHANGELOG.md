# Changelog

Notable changes for people using zmk-yakme. Versions follow [Semantic Versioning](https://semver.org/);
each release on [GitHub Releases](https://github.com/ulkden/zmk-yakme/releases) also lists every
merged pull request.

## [Unreleased]

### Added

- Scroll the mouse wheel over a focused number field to change it: by 10 for millisecond settings
  (Shift for 1), by 1 for the layer count. Empty fields are left as "default".
- **Save Combo** (or Esc) finishes editing a combo. **Save Behavior** returns from the Behaviors tab to
  the key you were editing, and clicking a key there does the same for that key. Changes still apply
  as you make them.
- New warnings make the warning button pulse once, so they're hard to miss. **Clear Warnings** hides
  the current ones until something new comes up, and "N hidden" brings them back.
- A ✕ inside the keycode filter clears it (Esc does too), in every browser.

### Changed

- Every dialog has a ✕ in its corner and closes when you click outside it (like Cancel), just like the
  layer settings popover.
- The layout picker in the status bar is labelled **Physical Layouts:**.
- Long file paths in the GitHub repository list are shortened in the middle, so the file name stays
  visible, and hovering shows the whole path.
- The Combos list shows each combo's key positions as small keycaps joined by "+" (pressed together).

### Fixed

- Tabbing into a millisecond field (tapping term, combo timeout, macro wait and so on) selects its value
  again, so typing replaces it instead of adding to it. Text that isn't a whole number now keeps the
  previous value and shows a warning, instead of clearing the setting. These fields no longer have
  up/down arrows.
- Keymaps that write whole bindings as `#define` names (Miryoku's `U_NA`, `U_RDO`, …) import one key per
  name, instead of shifting the rest of the layer and padding the export with extra `&trans`. Layers
  that use macro calls such as `HRML(A, S, D, F)`, which can stand for several keys, get a warning.
- Combos limited to named layers (`layers = <BASE>` with a `#define`) keep that limit on export instead
  of becoming active on every layer, and imported combo names keep their capital letters. Projects and
  autosaves now use format 3: a tab still open on an older version asks you to reload instead of opening them.
- Renaming or deleting a behavior also updates the places the editor keeps as they are in your file:
  other behaviors such as tap-dances, `&label { … };` overrides, `#define`s and unknown layer properties.
  Before, the exported keymap could refer to a behavior that no longer existed and fail to build. The
  delete prompt counts these uses and says where they are.

## [0.1.0] - 2026-10-28

First public release, at <https://ulkden.github.io/zmk-yakme/>.

- **Import** ZMK physical layouts (`.dtsi`, `.overlay`), QMK `info.json`, KLE layouts and existing
  `.keymap` files: from disk, by drag and drop, as pasted text, or from a GitHub file or repository URL.
  Several files imported together combine, so a board's 5- and 6-column layouts both stay available.
- **Edit** keys with a keycode palette, behavior picker and type-to-set; layers (add, rename, move,
  delete); combos; and custom hold-tap, mod-morph and macro behaviors.
- **Check** your work with warnings for layers that don't match the layout, combos outside it and more.
- **Export** a `.keymap` that keeps everything else in an imported file, with optional layer diagrams
  and any `#include` lines the new bindings need.
- **Keep your work:** autosave in the browser, `.zmk-project.json` project files (a versioned format
  that newer versions will keep opening), undo/redo, and **Close keymap** to start completely fresh.
- Works in Chromium, Firefox and Safari, by mouse and keyboard. Nothing leaves your browser except
  the GitHub requests you ask for.

[Unreleased]: https://github.com/ulkden/zmk-yakme/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/ulkden/zmk-yakme/releases/tag/v0.1.0
