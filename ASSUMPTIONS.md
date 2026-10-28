# Assumptions & Open Questions

Decisions made while building unattended. Each one can be changed. Review and tell me which to revisit.

## Environment
1. ✅ **Resolved:** Tooling is Node LTS (via nvm) plus Playwright. `npm test` runs 82 unit tests and
   `npm run test:e2e` runs 16 browser tests. All pass.
2. ✅ **Confirmed:** No build step and no dependencies: plain ES modules so the repo can be served as-is from
   GitHub Pages. ES modules need http(s), so for local use run `python3 -m http.server` (opening `index.html` as a file won't work).

## Scope / interpretation
3. 🛠 **Decided (to implement):** Combos **and** custom behavior definitions can be created and edited:
   hold-tap, mod-morph and macros. Plan: a "Behaviors" tab next to Combos that lists the behaviors
   defined in the file, with add/edit/delete in the side panel. Generated nodes go in
   `behaviors { }` / `macros { }`, and other behavior types are still preserved verbatim.
4. ✅ **Resolved:** MIT `LICENSE` added and both projects credited in the README. Code from the referenced projects was **not copied**. Everything is a from-scratch
   reimplementation, which avoids license questions. The zmk-layout-helper's import formats
   (QMK info.json, KLE JSON, ZMK dtsi) are supported as layout inputs.
5. 🛠 **Decided (to implement):** On export, generate a fresh ASCII-art diagram of each layer as a
   comment above its node, so the diagram always matches the bindings. Existing comments inside the
   `keymap`/`combos` nodes are replaced. The export UI (Download / Copy / Preview) must **tell the user
   this happens**, with a toggle that turns diagrams off. Off means today's behavior: no comments inside
   those nodes. Content outside the two nodes is still preserved verbatim.
6. 🛠 **Decided (to implement):** Missing `#include`s for used behaviors (`bt.h`, `outputs.h`, `rgb.h`,
   `ext_power.h`, `pointing.h`) are still added automatically after the last existing `#include`
   (existing ones are never removed), **and the export notice lists which includes were added**.
7. 🛠 **Decided (to implement):** Node names stay stable by default: kept from the source, or made from the
   display name for new layers (`nav_layer`), and every layer gets a `display-name`. In addition, the
   **node name is shown as its own editable field** in the layer actions, sanitized to a valid
   devicetree name and kept unique.
8. 🔍 **To investigate:** Bindings currently export one row per physical row (new row when `y` changes by
   ≥ 0.5u or `x` goes backwards), with columns padded. Plan: import several popular split and
   single-board ZMK keyboards from GitHub (layouts + keymaps), check how they look in the editor and
   in the exported text, then pick a more refined approach based on what looks wrong.
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
18. Pointing behaviors (`&mkp/&mmv/&msc`) add `dt-bindings/zmk/pointing.h` (current ZMK). Older
    configs used `mouse.h`.
19. Keymaps written with preprocessor helper macros (e.g. zmk-nodefree-config's `ZMK_LAYER(...)`)
    are **not** parsed. Only real devicetree nodes are.
20. "Advance to next key after picking a keycode" is **off** by default (toggle in the side panel).
21. Layer rename uses the browser's `prompt()` dialog (✎ button or double-click an active tab). This is
    a simple MVP choice that can become inline editing later.
22. Delete/Backspace on a selected key sets `&none` on layer 0 and `&trans` on other layers.
23. Exported layer bindings are padded to the layout's key count. The exported file name follows the
    imported keymap's file name, or `keymap.keymap`.
24. Keymaps can also be imported from a URL. `github.com/.../blob/...` links are rewritten to
    `raw.githubusercontent.com` so the browser can fetch them (CORS).
