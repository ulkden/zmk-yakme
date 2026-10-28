# Assumptions & Open Questions

Decisions made while building unattended. Each one can be changed. Review and tell me which to revisit.

## Environment
1. **No Node.js on this machine.** Installing one (via `uvx nodejs-wheel`) was blocked by the
   permission classifier, so **tests have not been executed yet**. Tests use `node:test`; run them
   with `npm test` (Node ≥ 21) or by serving the repo and opening `tests/index.html` (an import map
   swaps in small browser shims for `node:test` / `node:assert/strict`).
2. No build step and no dependencies: plain ES modules so the repo can be served as-is from
   GitHub Pages. ES modules need http(s), so for local use run `python3 -m http.server` (opening `index.html` as a file won't work).

## Scope / interpretation
3. "Key combination behaviors" is read as **ZMK combos** (`zmk,combos`). Hold-tap/mod-morph/macro
   definitions are not edited, but they are *preserved* on export and their labels show up as
   selectable behaviors.
4. Code from the referenced projects was **not copied**. Everything is a from-scratch
   reimplementation, which avoids license questions. The zmk-layout-helper's import formats
   (QMK info.json, KLE JSON, ZMK dtsi) are supported as layout inputs.
5. Export preserves the imported file's text and regenerates only the `keymap` and `combos`
   nodes. **Comments inside those two nodes (e.g. ASCII-art layer diagrams) are lost.**
6. Missing `#include`s for used behaviors (`bt.h`, `outputs.h`, `rgb.h`, `ext_power.h`,
   `pointing.h`) are added automatically after the last existing `#include`.
7. Layer node names are kept from the source. New layers get a sanitized node name
   (`layer_name`), and every layer gets a `display-name`.
8. Bindings are formatted one row per physical row: a new row starts when a key's `y` changes by
   ≥ 0.5u or `x` goes backwards. Columns are padded for alignment.
9. If a layer has fewer bindings than the layout has keys, it is padded with `&trans` (`&none` on
   layer 0). Extra bindings beyond the key count are kept and reported as a warning.
10. Deleting/moving layers remaps **numeric** layer params in `&mo &lt &to &tog &sl` and combo
    `layers`. Symbolic params (e.g. `&mo NAV` with a `#define`) are left untouched. References to a
    deleted layer become `&trans`.
11. When a file has several physical layouts, the first is used and a selector appears in the
    status bar.
12. KLE parsing covers geometry (x, y, w, h, r, rx, ry) only. Legends and the secondary
    rectangle (w2/h2/x2/y2) are ignored.
13. Combo `key-positions`/`layers` must be numeric (simple integer expressions are evaluated).
    Other combo properties (e.g. `require-prior-idle-ms`, `slow-release`) are preserved verbatim
    but not editable in the UI.
14. Clicking a key in Combos mode with no combo selected creates a new combo containing that key.
15. Clicking a palette keycode fills the *last keycode parameter* of the current behavior
    (e.g. the tap key of `&mt`/`&lt`). Behaviors without a keycode param are replaced with `&kp X`.
16. State autosaves to `localStorage`. "New" and imports replace the current state (undoable).
17. Dark mode only, system font stack, no web fonts (works offline).
