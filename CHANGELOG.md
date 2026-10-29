# Changelog

Notable changes for people using zmk-yakme. Versions follow [Semantic Versioning](https://semver.org/);
each release on [GitHub Releases](https://github.com/ulkden/zmk-yakme/releases) also lists every
merged pull request.

## [Unreleased]

### Changed

- Button labels use Title Case (e.g. **Try the Example**, **Close Keymap**, **+ Hold-Tap**).

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
