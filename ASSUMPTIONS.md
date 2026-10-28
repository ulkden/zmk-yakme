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
9. 🛠 **Decided (to implement):** Short layers are padded on export (`&none` on layer 0, `&trans`
   elsewhere), and extra bindings are kept and shown as a warning. In addition, the warning gets a
   one-click **"Trim extra bindings"** action (undoable).
10. 🛠 **Decided (to implement):** Deleting or moving layers renumbers **numeric** params in
    `&mo &lt &to &tog &sl` and combo `layers`, and references to a deleted layer become `&trans`.
    Symbolic params (e.g. `&mo NAV` with a `#define`) are left untouched, **but a warning is shown after a
    move/delete when symbolic layer references exist**, so the user can check their `#define`s.
11. ✅ **Kept for now (TODO: re-evaluate):** When a file has several physical layouts, the first is used
    and a selector appears in the status bar. **TODO:** try this with a real open-source board that ships
    multiple layouts (e.g. 5- and 6-column variants) during the #8 investigation, then make a final call.
12. 🛠 **Decided (to implement):** KLE import keeps geometry (x, y, w, h, r, rx, ry). The secondary
    rectangle (w2/h2/x2/y2) is still ignored. **New:** when no keymap is loaded, KLE legends become the
    starting base-layer bindings: a legend that matches a keycode or label (e.g. `Q`, `Esc`, `⇧`, `1`)
    becomes `&kp CODE`, and anything else becomes `&none`. For multi-legend keys, the main (top-left or
    center) legend is used.
13. 🛠 **Decided (to implement):** The combo editor adds **`require-prior-idle-ms`** (number, empty =
    unset) and **`slow-release`** (checkbox). **Symbolic key positions** (e.g. `#define`d names in
    `key-positions`) are accepted: they're written back unchanged, and the UI warns that it can't place
    them on the keyboard. Any other combo properties are still preserved verbatim.
14. 🛠 **Decided (to implement):** In Combos mode, key clicks do nothing until a combo exists and is
    selected. **"+ New combo" is the only way to create one**, and it selects the new combo. Then key clicks
    add or remove keys from the selected combo. With no combo selected, the panel hints at
    "+ New combo".
15. ✅ **Confirmed:** Clicking a palette keycode fills the *last keycode parameter* of the current behavior
    (e.g. the tap key of `&mt`/`&lt`). Behaviors without a keycode param are replaced with `&kp X`.
16. 🛠 **Decided (to implement):** State still autosaves to `localStorage`. **New:** (a) "New", "Load
    example" and imports that would replace a keymap **ask for confirmation when there are unexported
    changes**; (b) **Save project / Open project** buttons write and read a JSON project file (layouts +
    keymap + file name), so work can be backed up and moved between browsers. Project files are already
    recognized by Import.
17. 🛠 **Decided (to implement):** Dark mode only. **New:** bundle a monospace font locally (JetBrains Mono,
    SIL OFL 1.1, with its license file in `fonts/`) for key labels, the palette, raw binding fields and the
    preview. The rest of the UI keeps the system font stack. No external requests, so it still works offline.
18. 🛠 **Decided (to implement):** Pointing behaviors (`&mkp/&mmv/&msc`) add
    `dt-bindings/zmk/pointing.h`, **unless the file already includes `dt-bindings/zmk/mouse.h`** (older
    ZMK), in which case nothing is added.
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
