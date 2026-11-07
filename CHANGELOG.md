# Changelog

Notable changes for people using zmk-yakme. Versions follow [Semantic Versioning](https://semver.org/);
each release on [GitHub Releases](https://github.com/ulkden/zmk-yakme/releases) also lists every
merged pull request.

## [Unreleased]

### Added

- Keyboard users: the first <kbd>Tab</kbd> press shows **Skip to keys**, **Skip to keycodes** and
  **Skip to side panel** links.
- Screen readers read out the app's short messages (such as "Project saved"), including errors in
  the Import dialog, and say when an example or blank keymap opens.
- The Import dialog's paste box and link field have visible labels.
- The keyboard and the keycode palette are each one <kbd>Tab</kbd> stop: use the arrow keys inside them,
  and <kbd>Home</kbd> / <kbd>End</kbd> for the first and last. <kbd>Enter</kbd> on the selected key
  moves to the side panel to edit it; in Combos, <kbd>Enter</kbd> or <kbd>Space</kbd> adds or removes
  a key.
- Screen readers read each key as what it does, then where it is ("Esc, hold Ctrl, key 12"), and say
  which keys are selected. Symbol keycodes such as ⇥ and ⏯ have spoken names.
- Layer tabs work like tabs: with one focused, ←/→ and <kbd>Home</kbd> / <kbd>End</kbd> switch layers.
  The layer settings (✎) take keyboard focus when they open and give it back when closed with
  <kbd>Esc</kbd>. Undo, Redo, ✎ and + have names for screen readers.
- Combos: screen readers say which combo and which layers are selected, and you can add keys with
  the arrow keys and <kbd>Space</kbd>. **Save Combo** (or <kbd>Esc</kbd>) returns focus to the combo in the list.
- Behaviors: **Save Behavior** returns focus to the key's Behavior list, ready to assign the new
  behavior. Screen readers read delete confirmations and the Mods / Keep mods groups.
- Screen readers read out new warnings, and the warnings button says whether its list is open.
  After **Clear Warnings** or "N hidden", keyboard focus stays in the status bar.
- The Export preview can be scrolled with the keyboard, and screen readers say when a download starts.
  **Save Project** now names the file it saved.
- In Windows high-contrast mode, the selected key, the keys of a combo, the active layer tab, selected
  layer chips and the selected combo are filled with the highlight colour.

### Changed

- Keyboard focus shows a clear light ring that no longer looks like the selected key. It doesn't
  appear when you click a button or key.
- Secondary grey text is slightly lighter, so it is easier to read everywhere. Key numbers are too.
- Typing a letter or digit, <kbd>Delete</kbd> and <kbd>Esc</kbd> change a key only while that key has
  keyboard focus, so typing elsewhere can't change a key by accident.

### Fixed

- Using a key, a layer tab, the Combos or Behaviors tab or a list item from the keyboard no longer
  sends focus back to the top of the page.
- After opening or closing a keymap, keyboard focus goes to the first key or to **Import Files**
  instead of being lost.

## [0.2.0] - 2026-11-01

### Added

- Scroll the mouse wheel over a focused number field to change it: by 10 for millisecond settings
  (Shift for 1), by 1 for the layer count. Empty fields are left as "default".
- **Save Combo** (or Esc) finishes editing a combo. **Save Behavior** returns from the Behaviors tab to
  the key you were editing, and clicking a key there does the same for that key. Changes still apply
  as you make them.
- New warnings make the warning button pulse once, so they're hard to miss. **Clear Warnings** hides
  the current ones until something new comes up, and "N hidden" brings them back.
- A ✕ inside the keycode filter clears it (Esc does too), in every browser.
- **Open Project** on the welcome screen, next to Import Files, Start Blank and Try the Example.
- A [user guide](docs/guide/README.md) with step-by-step instructions, screenshots and a shortcuts cheat
  sheet, linked from the welcome screen.

### Changed

- The Import dialog lists the files it accepts in two boxes (physical layouts; keymaps and saved
  projects). Its main button is now **Load**: it imports pasted text or a file link, or lists a
  repository's files, which you then import with **Import Selected**.
- Importing from a GitHub repository lists only its keymaps and likely layout files. **Show all files**
  reveals the rest, and **Deselect All** unticks everything.
- Importing from a repository that holds several keyboards folds the list by keyboard. Only the keyboard
  whose keymap was chosen is open and ticked, instead of ticking likely layouts from every keyboard.
- Long file paths in the GitHub repository list are shortened in the middle, so the file name stays
  visible, and hovering shows the whole path.
- Every dialog has a ✕ in its corner and closes when you click outside it (like Cancel), just like the
  layer settings popover.
- The layout picker in the status bar is labelled **Physical Layouts:**.
- The Combos list shows each combo's key positions as small keycaps joined by "+" (pressed together).
- Button labels use Title Case (e.g. **Try the Example**, **Close Keymap**, **+ Hold-Tap**).

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

[Unreleased]: https://github.com/ulkden/zmk-yakme/compare/v0.2.0...HEAD
[0.2.0]: https://github.com/ulkden/zmk-yakme/releases/tag/v0.2.0
[0.1.0]: https://github.com/ulkden/zmk-yakme/releases/tag/v0.1.0
