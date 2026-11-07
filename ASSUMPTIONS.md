# Assumptions & Open Questions

Decisions made while building unattended. Each one can be changed. Review and tell me which to revisit.

## Environment
1. ✅ **Resolved:** Tooling is Node LTS (via nvm) plus Playwright. `npm test` runs 82 unit tests and
   `npm run test:e2e` runs 16 browser tests. All pass.
2. ✅ **Confirmed:** No build step and no dependencies: plain ES modules so the repo can be served as-is from
   GitHub Pages. ES modules need http(s), so for local use run `npm run serve` (opening `index.html` as a file won't work).
   It runs `scripts/serve.mjs`, a small Node static server, so Node is the only tool development needs. It replaced
   `python3 -m http.server`, whose listen backlog of 5 made macOS reset connections when the browser tests ran in parallel.

## Scope / interpretation
3. ✅ **Implemented:** Combos **and** custom behavior definitions can be created and edited:
   hold-tap, mod-morph and macros. Plan: a "Behaviors" tab next to Combos that lists the behaviors
   defined in the file, with add/edit/delete in the side panel. Generated nodes go in
   `behaviors { }` / `macros { }`, and other behavior types are still preserved verbatim.
4. ✅ **Resolved:** MIT `LICENSE` added and both projects credited in the README. Code from the referenced projects was **not copied**. Everything is a from-scratch
   reimplementation, which avoids license questions. The zmk-layout-helper's import formats
   (QMK info.json, KLE JSON, ZMK dtsi) are supported as layout inputs.
5. ✅ **Implemented:** On export, generate a fresh ASCII-art diagram of each layer as a
   comment above its node, so the diagram always matches the bindings. Existing comments inside the
   `keymap`/`combos` nodes are replaced. The export UI (Download / Copy / Preview) must **tell the user
   this happens**, with a toggle that turns diagrams off. Off means today's behavior: no comments inside
   those nodes. Content outside the two nodes is still preserved verbatim. The toggle
   defaults to on and is remembered. Open point for #8: diagrams are wide (cell width = longest label).
6. ✅ **Implemented:** Missing `#include`s for used behaviors (`bt.h`, `outputs.h`, `rgb.h`,
   `ext_power.h`, `pointing.h`) are still added automatically after the last existing `#include`
   (existing ones are never removed), **and the export notice lists which includes were added**.
7. ✅ **Implemented:** Node names stay stable by default: kept from the source, or made from the
   display name for new layers (`nav_layer`), and every layer gets a `display-name`. In addition, the
   **node name is shown as its own editable field** in the layer actions, sanitized to a valid
   devicetree name and kept unique.
8. ✅ **Resolved:** 10 boards from the ZMK repo (Corne, Lily58, Sofle, Kyria, Ferris, Reviung41, Planck,
   60% ANSI, BDN9) were imported through the UI. All import cleanly and render correctly. Row detection was
   fixed (it split column-staggered rows on 5 of 9 boards): rows now break when x moves left or y jumps
   ≥ 1.5u, and an imported keymap's own line breaks are kept when they fit. **Bindings** keep style A
   (aligned by position in row). **Diagrams** use physical placement with labels capped at 6 characters
   (Corne ≈ 110 chars wide). Custom hold-taps are now labelled like `&mt`.
9. ✅ **Implemented:** Short layers are padded on export (`&none` on layer 0, `&trans`
   elsewhere), and extra bindings are kept and shown as a warning. In addition, the warning gets a
   one-click **"Trim extra bindings"** action (undoable).
10. ✅ **Implemented:** Deleting or moving layers renumbers **numeric** params in
    `&mo &lt &to &tog &sl` and combo `layers`, and references to a deleted layer become `&trans`.
    Symbolic params (e.g. `&mo NAV` with a `#define`) are left untouched, **but a warning is shown after a
    move/delete when symbolic layer references exist**, so the user can check their `#define`s.
11. ✅ **Resolved:** Layouts appear in a status-bar selector. Layout files imported together are merged
    (e.g. Corne's separate 5- and 6-column files), and the layout whose key count matches the keymap is
    selected automatically. Verified with Kyria (two layouts in one
    file) and Corne (5- and 6-column layouts in separate files).
12. ✅ **Implemented:** KLE import keeps geometry (x, y, w, h, r, rx, ry). The secondary
    rectangle (w2/h2/x2/y2) is still ignored. **New:** when no keymap is loaded, KLE legends become the
    starting base-layer bindings: a legend that matches a keycode or label (e.g. `Q`, `Esc`, `⇧`, `1`)
    becomes `&kp CODE`, and anything else becomes `&none`. For multi-legend keys, the main (top-left or
    center) legend is used.
13. ✅ **Implemented:** The combo editor adds **`require-prior-idle-ms`** (number, empty =
    unset) and **`slow-release`** (checkbox). **Symbolic key positions** (e.g. `#define`d names in
    `key-positions`) are accepted: they're written back unchanged, and the UI warns that it can't place
    them on the keyboard. Any other combo properties are still preserved verbatim. **Named combo
    layers** (e.g. `layers = <BASE>`) are kept the same way: written back unchanged, shown as read-only
    chips, and left out of renumbering, which the #10 warning covers. Imported combo node names are kept
    as they are.
14. ✅ **Implemented:** In Combos mode, key clicks do nothing until a combo exists and is
    selected. **"+ New combo" is the only way to create one**, and it selects the new combo. Then key clicks
    add or remove keys from the selected combo. With no combo selected, the panel hints at
    "+ New combo".
15. ✅ **Confirmed:** Clicking a palette keycode fills the *last keycode parameter* of the current behavior
    (e.g. the tap key of `&mt`/`&lt`). Behaviors without a keycode param are replaced with `&kp X`.
16. ✅ **Implemented:** State still autosaves to `localStorage`. **New:** (a) "New", "Load
    example" and imports that would replace a keymap **ask for confirmation when there are unexported
    changes**; (b) **Save project / Open project** buttons write and read a JSON project file (layouts +
    keymap + file name), so work can be backed up and moved between browsers. Project files are already
    recognized by Import.
17. ✅ **Implemented:** Dark mode only. **New:** bundle a monospace font locally (JetBrains Mono,
    SIL OFL 1.1, with its license file in `fonts/`) for key labels, the palette, raw binding fields and the
    preview. The rest of the UI keeps the system font stack. No external requests, so it still works offline.
18. ✅ **Implemented:** Pointing behaviors (`&mkp/&mmv/&msc`) add
    `dt-bindings/zmk/pointing.h`, **unless the file already includes `dt-bindings/zmk/mouse.h`** (older
    ZMK), in which case nothing is added.
19. ✅ **Implemented:** Keymaps written with helper macros (`ZMK_LAYER`, `ZMK_COMBO`,
    `ZMK_HOLD_TAP`, …, from zmk-helpers / zmk-nodefree-config) are still not parsed, but they are **detected,
    and a clear message explains they aren't supported yet**. Below it, in small text, the message links to the
    project's GitHub issues page to request the feature. The link points to
    https://github.com/ulkden/zmk-yakme/issues.
20. ✅ **Implemented:** "Advance to next key after picking a keycode" stays **off by default**,
    and **the choice is remembered** across reloads (localStorage preference, separate from the document).
21. ✅ **Implemented:** Replace `prompt()`/`confirm()` with a **layer settings popover**: ✎ (or
    double-clicking the active tab) opens a small panel under the tab with display name, node name
    (see #7), move left/right and delete. Delete confirms inline in the same panel.
22. ✅ **Implemented:** Delete/Backspace clears the selected key (`&none` on layer 0, `&trans`
    elsewhere), and Esc deselects. **New:** arrow keys (←↑→↓) move to the **physically nearest key in that
    direction** (using key centers, rotation included) instead of by index. **Type-to-assign:** with a key
    selected and focus on the page, typing a letter or digit assigns `&kp X`, and advances to the next key
    **only when auto-advance (#20) is on**. Modifier combos such as Ctrl+Z still go to shortcuts.
23. ✅ **Implemented:** Exported layers are padded to the layout's key count. The file name
    defaults to the imported keymap's name (or `keymap.keymap`), and it is **shown and editable in the
    export notice / preview**. The edited name is remembered with the project.
24. ✅ **Implemented:** Single-file URL import stays (`blob` links are rewritten to `raw`).
    **New: whole-repo import.** Paste a GitHub repo URL (optionally with `/tree/<branch>/<path>`). The
    app lists the `.keymap`, `.dtsi`, `.overlay` and `.json` files through the public GitHub API (git trees
    endpoint, no auth), preselects the likely keymap and physical-layout files, and imports the ones you
    check. Caveats: unauthenticated API calls are limited to 60 per hour per IP, and only public repos work.
25. ✅ **Agreed:** The millisecond fields in the side panels (hold-tap tapping term, quick tap and prior
    idle; combo timeout and prior idle; macro wait and tap) are **text inputs that take whole numbers**
    (`inputmode="numeric"`, so phones still show a number keypad), not `type="number"`. Number inputs hide
    their selection, so a re-render while tabbing between fields lost the select-all and typing added to the
    old value. The cost is no up/down arrows (spinner or arrow keys). Text that isn't a whole number keeps
    the previous value and shows a warning, instead of clearing the setting.
26. ✅ **Agreed:** Text that export keeps verbatim has **one exception**: renaming or deleting an
    editable behavior also updates references to it there, so the file still builds. That covers other
    behaviors (tap-dances, sticky keys, …), `&label { … };` overrides, `#define` lines and unknown
    properties. A rename replaces only the `&label` token. A delete turns each use and its parameters into
    `&none` and removes overrides of the deleted behavior; its prompt says where the uses are. Comments
    and everything else stay as they were. Checked on 40 real keymaps (200 behaviors, see #66): no other
    text changed. The alternative, refusing to rename or delete until those references were edited by
    hand, was rejected because a missed reference breaks the build.
27. ✅ **Agreed:** The mouse wheel steps a number field **only while it is focused** (click, then
    scroll), so scrolling the side panel past a field never changes it. Millisecond fields step by
    **10** (Shift: 1); the New dialog's layer count steps by 1, within 1–32. Empty fields ("default" /
    "off") and text that isn't a whole number are left alone. A burst of steps is one undo step.
28. ✅ **Agreed:** New warnings make the warning button give **one stronger pulse**: a 12 px ring at
    60 % of the warning colour (`--warn-pulse`), fading over 900 ms. It was chosen over a subtler 8 px /
    35 % ring after comparing both with a real Corne switched to its 5-column layout, because the button
    sits in a corner, away from where you work. With reduced motion, a brief static highlight at 35 %
    (`--warn-dim`) replaces it. Cleared warnings are matched by text and stay hidden while they still
    apply; "N hidden" brings them back.
29. ✅ **Implemented (#82):** A repository listing is folded by keyboard when its **keymaps** sit in two or
    more top-level folders below the listed one. ZMK's standard `config/` and `boards/` folders don't
    count, so a usual zmk-config (keymaps in `config/`, custom shields in `boards/`) stays one flat list,
    as before; #82 first proposed grouping by any top-level folder, which would have split such repos
    and dropped their preselected shield layouts. Grouping on keymaps rather than on any likely file
    keeps one keyboard's `QMK/` and `ZMK/` subfolders together when you list that keyboard's folder.
    When grouped, only the chosen keymap's own layouts are preselected (scottokeebs: 46 files from 45
    keyboards before, 1 now), and only its keyboard starts open.

## Accessibility
30. ✅ **Agreed:** The app targets **WCAG 2.2 Level AA** (also ISO/IEC 40500:2025), the level that
    EN 301 549 v4.1.1 and current laws point to. The project very likely has no legal obligation (it is
    free and sells nothing), so this is a voluntary commitment. WCAG 2.1 AA would save little, because
    the app already mostly meets 2.2's new criteria. AAA criteria were not chosen, because they would
    change the quiet dark design more. WCAG 3.0 is still a draft. The research, the audit of v0.2.0 and
    the rollout plan are in [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md).
31. ✅ **Agreed:** Rollout is **foundation first, then area by area** in QA order, one PR each, with
    the AA claim and release 0.3.0 after a final pass. Fixing gaps level by level (all A, then all AA),
    one PR per audit row, or one long-lived branch were rejected. Each of them touches the same files
    repeatedly or goes against the small-PR flow.
32. ✅ **Agreed:** Browser tests run **@axe-core/playwright**, a devDependency pinned exactly and never
    shipped to the site. Known gaps are listed and shrink with each PR, and new violations fail CI.
33. ✅ **Agreed:** The keyboard diagram and the keycode palette use **roving focus** (one Tab stop
    each, arrow keys inside), plus **skip links**. This takes about 14 Tab presses to the side panel
    instead of about 120. Mouse use is unchanged.
34. ✅ **Agreed:** Type-to-assign (#22) works **only while the keyboard diagram has focus**, which
    meets WCAG 2.1.4. There is no new setting.
35. ✅ **Agreed:** Manual testing uses NVDA (Firefox and Chrome), VoiceOver with Safari, Narrator with
    Edge, and Orca with Firefox. `docs/ACCESSIBILITY.md` becomes the accessibility statement, linked
    from the README and the welcome screen. Problems are reported with the `accessibility` label.
36. ✅ **Agreed:** Keyboard focus shows as a **2 px light ring (#e8ecf2) with a 2 px gap** on every
    control (`:focus-visible`: buttons and keys show it for keyboard focus only, text fields whenever
    they are focused, as browsers do). It was chosen from previews on a real Corne over a ring in the
    accent blue, where a key with only focus still read as selected, and over a ring inside the keys,
    which covered the key numbers. Contrast is 13.8:1 on a key.
37. ✅ **Agreed (a deviation from the usual flow):** QA can't keep pace with the accessibility PRs, so
    they land on **`initiative/accessibility`** (named to show it is temporary) instead of `main`. Each
    PR still gets CI. The agent merges it after a clean local run (fresh worktree, `npm ci`, all three
    engines, built-site smoke test), green CI and its own code review. The maintainer reviews each PR
    as step 0 of its QA issue, and changes go through QA. The live site stays at v0.2.0 meanwhile, so
    QA runs on a local checkout of the branch. At the end each PR is re-landed on `main` in order,
    keeping per-PR history and release notes under the squash-only ruleset. Accepted risks: errors in
    early PRs can carry into later ones (refined during QA), CodeQL probably only scans PRs into
    `main`, and the branch must be kept in step with `main`.
38. ✅ **Agreed:** Key position numbers turn **#8a919c**, the dimmest grey that passes 4.5:1 on every
    key state (4.55:1 at worst, on hover), and stay always visible. Rejected: the brighter general grey
    (busy on a full board), and numbers only on the selected key, under the pointer and in Combos
    (positions hidden when wanted).
39. ✅ **Agreed:** Secondary grey text (`--muted`) goes from #858d99 to **#959ca7** everywhere: 5:1 or
    better on every surface, including the blue-tinted info box and selected list items. Rejected:
    changing it only on tinted surfaces, which needs the exception repeated for each new one.
40. ✅ **Agreed:** In forced-colours (high-contrast) mode, selected, active and "on" items (the
    selected key, combo keys, the active tab, chips, the selected list item) **fill with the theme's
    `Highlight` colour** with `HighlightText`, like a selected item in any Windows list. Rejected: a
    thick Highlight border, which was easier to miss next to the focus ring.
41. ✅ **Agreed:** A screen reader reads a key as **its label first, then its position**, e.g.
    "A, key 13", "Esc, hold Ctrl, key 12", "Lower layer while held, key 37", with "selected" for the
    selected key. Rejected: position first (slower to scan by sound) and the raw binding (symbols are
    spelled out). The full binding stays in the side panel.
42. ⏳ **Assumed (review at QA 48):** Key names keep #41's order even though axe's *label in name*
    check (WCAG 2.5.3) flags them: it wants the small hold legend and the corner number in screen order
    ("Ctrl Esc 12"). The assumption is that a key's label is its main legend, and the hold legend and
    number are extra information. Names start with the legend and include the other words, so speech
    input ("click Esc") finds the key. A test checks that every text legend starts its key's name, and
    the axe list records this as an accepted exception. The palette had a real 2.5.3 gap: spoken names
    such as "Right Ctrl" for "RCtrl" left out the visible text. Its names now start with the label's
    own letters ("R Shift", "Vol up", "kp Enter"), and plain-text labels keep their text.
