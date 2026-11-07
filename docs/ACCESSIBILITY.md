# Accessibility

zmk-yakme aims to conform to **[WCAG 2.2](https://www.w3.org/TR/WCAG22/) Level AA** (ASSUMPTIONS.md #30).
This file records why that target was chosen, where the app stood when the work began, and how the
changes are rolled out. Once the work is done, it becomes the app's accessibility statement.

## Standards (researched November 2026)

- **WCAG 2.2** is the current W3C Recommendation. Since October 2025 it is also the international
  standard [ISO/IEC 40500:2025](https://www.w3.org/WAI/news/2025-10-21/wcag22-iso).
- **WCAG 3.0** is still a Working Draft (latest September 2026). It proposes a different conformance
  model and is expected to take years to finish, so it can't be targeted yet.
- **EN 301 549** (Europe's standard for ICT accessibility) v4.1.1 was published in September 2026 and
  refers to WCAG 2.2 AA. Until the EU's Official Journal cites it, v3.2.1 (WCAG 2.1 AA) is the version
  in force. EN 301 549 also has clauses for software that go beyond WCAG, such as respecting the
  user's colour and contrast settings.
- **Legal scope:** the European Accessibility Act covers consumer services such as e-commerce and
  banking. Section 508 and the ADA Title II rule cover public bodies in the US. A free, open-source
  tool that sells nothing is very likely outside all of them, so the target is voluntary. WCAG 2.2 AA
  was chosen because current laws and standards all point to it.

## Baseline audit (v0.2.0)

Automated checks (axe-core 4.10, WCAG 2.2 A/AA rules) and scripted probes (focus after actions,
accessible names, live regions, 200 % zoom, 320 px width, forced colours) on Chromium, with the
example keyboard on every tab and in every dialog.

**Already met:**
- The page language and title are set.
- Dialogs are native `<dialog>` elements, so focus stays inside them and returns afterwards.
- Every control is a native button or field.
- Reduced motion is respected.
- Drag and drop has a button alternative (2.5.7).
- The welcome screen has no axe violations.

| # | Gap | WCAG 2.2 |
|---|---|---|
| A1 | Activating a key, arrow keys, a layer tab, the Combos tab or a combo sends keyboard focus back to the top of the page: each part of the screen rebuilds itself on every change | 2.4.3 Focus Order (A) |
| A2 | About 120 Tab presses reach the side panel (42 keys, then 71 palette buttons). There are no skip links | 2.4.1 Bypass Blocks (A), usability |
| A3 | The selected key, active layer tab, selected combo and on/off chips show their state only by colour. Undo, redo and ✎ are read out as "↶", "↷" and "✎"; tabs as "0Base"; keys as "⇥ 0" | 4.1.2 Name, Role, Value (A) |
| A4 | Pop-up messages (toasts), warnings and import errors are not announced to screen readers | 4.1.3 Status Messages (AA) |
| A5 | Key numbers have a contrast of 2.07:1 (1.92:1 on the selected key); the Import dialog's info box 4.11:1. axe 4.14 (PR 1) also flags the Behaviors tab's kind badge and the grey use count on a selected list item | 1.4.3 Contrast (AA) |
| A6 | The Export preview can't be scrolled by keyboard | 2.1.1 Keyboard (A) |
| A7 | Typing a letter assigns it to the selected key wherever focus is (outside text fields), and this can't be turned off | 2.1.4 Character Key Shortcuts (A) |
| A8 | The focus ring and the selected-key highlight look the same (both a 1 px accent-coloured outline) | 2.4.7 Focus Visible (AA) |
| A9 | In forced-colours (high-contrast) mode, the selected key and the active layer tab are indistinguishable from the others | EN 301 549 11.7, best practice |
| A10 | The Import paste box and URL field are labelled only by placeholder text. Palette group names aren't headings, and the editor has no `h1` | 3.3.2 Labels (A), 1.3.1 (A) |

At 320 px wide the whole page scrolls sideways. WCAG 1.4.10 exempts content that needs a
two-dimensional layout, which covers the keyboard diagram but not the page as a whole.

## Rollout

Agreed: **foundation first, then area by area**, in small PRs. The app claims WCAG 2.2 AA only after
the final pass.

The PRs land on `initiative/accessibility`, not `main` (ASSUMPTIONS.md #37). The agent merges each one
after a clean local run, green CI and its own code review. The maintainer reviews each PR as step 0 of
its QA, and changes are handled in QA. The live site stays at v0.2.0 until every PR is re-landed on
`main` in order.

1. **Foundation:** focus survives re-renders (A1), one shared screen-reader announcer (A4), and
   automated accessibility checks in the browser tests.
2. **One PR per area**, in QA order: import → keys → layers → combos → behaviors → warnings → export
   → saving. Each PR makes that area meet AA and comes with its QA issue.
3. **Final pass:** keyboard-only and screen-reader testing of the whole journey, this file turned into
   the accessibility statement, and release 0.3.0.
4. **Retrospective:** once everything is on `main`, look back at how the initiative went (QA findings
   per PR, problems that carried forward, re-landing effort, what self-review missed). Then decide
   whether to codify this approach in `AGENTS.md` as the general way to run unassisted initiatives.

### Planned PRs

Each PR removes its rows from the axe known-gaps list, adds hand-written keyboard tests, opens or
updates its QA issue, and updates the docs it touches (`docs/DESIGN.md`, the user guide, README
cheatsheet, `CHANGELOG.md`).

| PR | Area | Covers |
|---|---|---|
| 0 | Plan (this file) | Target, plan, `AGENTS.md` rules |
| 1 | Foundation | axe in the browser tests with a known-gaps list; focus survives re-renders (A1); shared announcer, with toasts announced (A4); skip links (A2); a focus ring distinct from the selection (A8) |
| 2 | Welcome and import | Visible labels for paste and URL fields, page headings (A10); info box contrast (A5); import errors announced (A4) |
| 3 | Keys and palette | Roving focus in the diagram and the palette (A2); key names and selected state (A3); type-to-assign only on focus (A7); key-number contrast (A5); palette group headings (A10); forced colours (A9) |
| 4 | Layers | Layer tabs exposed as tabs, with arrow keys; names for ✎, ↶ and ↷ (A3); focus in the layer settings popover; forced colours for the active tab (A9) |
| 5 | Combos | Selected combo and layer chips exposed as states (A3); key positions read out sensibly |
| 6 | Behaviors | Chips and list states (A3); focus during delete confirmation |
| 7 | Warnings | New warnings announced (A4); focus after Clear Warnings |
| 8 | Export and saving | Preview reachable by keyboard (A6); Copy, Download and Save announced (A4) |
| 9 | Final pass | Reflow at 320 px; the full manual screen-reader pass; this file finished as the statement; welcome-screen link; release 0.3.0 |

Visual choices, made from previews on a real Corne (ASSUMPTIONS.md #38–#41):
- **Key numbers:** #8a919c, always shown.
- **Secondary grey text:** #959ca7 everywhere.
- **Forced colours:** selected, active and "on" items fill with `Highlight`.
- **How a screen reader reads a key:** its label, then its position ("A, key 13").

### Progress

| PR | Done |
|---|---|
| 1 | Focus stays on the control you used, or moves to its nearest neighbour when that control goes away (A1, everywhere). The light focus ring (A8). Skip links (A2, first half; roving focus follows in PR 3). One `#announcer` live region, through which every toast is read out (A4, first half; other messages follow per area). axe runs in the browser tests on every engine (`e2e/a11y.spec.js`) |
| 2 | One `h1` for the page (the app name; the welcome title is now an `h2`) and dialogs named by their titles, with short ones (confirmations, errors, notices) also reading their message (A10). Visible labels for the Import paste and link fields (A10). The lighter secondary grey, #959ca7 (A5: info box, badge and use count, fixed for every surface at once). Import and repository messages are read out, and messages raised inside a dialog come from a live region within it (A4). When opening a keymap removes the welcome screen, or closing it removes the editor, focus moves to the first key or to Import Files; Example and blank keymaps are announced with their size |
| 3 | The diagram is a listbox with roving focus: one Tab stop, arrows by physical position, Home/End; selection follows focus on the Layers tab, Enter on the selected key opens it in the side panel, and in Combos (multi-select) Enter/Space adds or removes the focused key (A2). Keys are named legend first, then position, with their state as aria-selected (A3, #41; #42 for axe's label-in-name check). Typing, Delete and Esc act only while a key has focus (A7). The palette is one Tab stop with arrows and Home/End; its group names are headings and symbol keycaps have spoken names (A2, A10). Key numbers are #8a919c (A5). Selected and combo keys fill with Highlight in forced colours (A9) |
| 4 | Layer tabs are an ARIA tablist: one Tab stop, ←/→ (wrapping) and Home/End switch layers, the active layer is aria-selected (A2, A3). Combos and Behaviors are mode buttons with aria-pressed. Undo, Redo, ✎ and + have names, and ✎ says whether the settings are open (aria-expanded) (A3). Opening the layer settings moves focus to the display name; Esc returns it to ✎. Tab names read "0 Base", not "0Base". The active tab fills with Highlight in forced colours (A9) |

### Focus ring (A8)

Agreed (ASSUMPTIONS.md #36), from previews on a real Corne: a **2 px light ring (`--focus`, #e8ecf2)
with a 2 px gap**, on every control. It is the only light outline in the app, so focus never looks
like the blue selection, and a selected key that also has focus shows both. Contrast is 13.8:1 on a
key and 16.1:1 on the page (WCAG 1.4.11 needs 3:1). It uses `:focus-visible`: buttons and keys
show it for keyboard focus only, text fields whenever they are focused, as browsers do. Rejected: the same ring in the accent blue (a key that only has focus still
read as selected) and a ring inside the keys (it covered the key numbers).

### Automated checks

Agreed: **[@axe-core/playwright](https://github.com/dequelabs/axe-core-npm)** as a devDependency, pinned
exactly, never shipped to the site. The browser tests scan every app state and dialog against the
WCAG 2.2 A/AA rules. Known gaps go on a list that each area PR shrinks, and any new problem fails CI.
axe finds roughly a third to half of WCAG problems, so keyboard and focus behaviour also get
hand-written Playwright tests.

### Keyboard navigation (A2)

Agreed: **roving focus plus skip links.**
- **Keyboard diagram:** one Tab stop, on the selected key. Arrow keys move by physical position (as the
  selection already did), and keyboard focus now follows them.
- **Keycode palette:** one Tab stop after its filter. Arrows move through the keycodes, Home and End
  jump to the first and last.
- **Skip links:** on the first Tab press, "Skip to" links appear for the keys, the palette and the side
  panel.
- **Result:** about 14 Tab presses from the top of the page to the side panel, instead of about 120.
  Mouse use is unchanged.

### Type-to-assign (A7)

Agreed: typing a letter or digit assigns it **only while keyboard focus is on the keyboard diagram**.
This meets WCAG 2.1.4's "active only on focus" exception. Clicking a key gives it focus, so mouse use
doesn't change. Delete, Esc and the arrow keys follow the same rule. There is no new setting.

### Manual testing

Agreed: the maintainer tests by hand with **NVDA** (Firefox and Chrome), **VoiceOver** with Safari
(macOS), **Narrator** with Edge, and **Orca** with Firefox (Linux). These are the combinations the
accessibility statement will name as tested. Every area's QA issue includes keyboard-only steps and
screen-reader steps.

### Statement and feedback

Agreed: this file becomes the accessibility statement in the final pass. It will say which standard
the app meets, which combinations were tested, any known gaps, and how to report a problem. It is
linked from the README and from the welcome screen's version line (… · User guide · Accessibility).
Problems are reported as GitHub issues labelled `accessibility` (the label already exists).
