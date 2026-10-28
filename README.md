# ZMK Keymap Editor (basic)

A static, client-side editor for [ZMK](https://zmk.dev) keymaps. It combines what
[keymap-editor](https://github.com/nickcoutsos/keymap-editor) and
[zmk-layout-helper](https://zmk-layout-helper.netlify.app/) do, in one page:

1. **Import a physical layout**: ZMK `.dtsi`/`.overlay` (`zmk,physical-layout`), QMK `info.json`, or KLE JSON.
2. **Import an existing keymap**: any ZMK `.keymap`.
3. **Edit** layers, key bindings, combos and custom behaviors (hold-tap, mod-morph, macro), with undo/redo.
4. **Export** a `.keymap` file. Content you didn't change is preserved.

There is no build step and there are no dependencies. Everything runs in the browser, and work is autosaved to localStorage.

## Run locally

ES modules need to be served over HTTP:

```sh
python3 -m http.server 8080      # or: npm run serve
# open http://localhost:8080
```

## Tests

```sh
nvm use                           # Node version from .nvmrc
npm ci
npm test                          # unit tests (node:test)
npm run lint && npm run format:check
npx playwright install chromium
npm run test:e2e                  # browser tests on Chromium (starts its own server)
npm run test:e2e:all              # Chromium, Firefox and WebKit (as CI does)
# unit tests also run in a browser: http://localhost:8080/tests/
```

CI runs all of the above on every pull request; `main` only accepts changes through a PR with green checks.

**Real ZMK files:** the unit tests import, export and re-import nine real boards from ZMK, pinned in
`tests/fixtures/zmk/`. Once a month, `.github/workflows/zmk-drift.yml` runs the same checks against
ZMK's latest `main` and also sweeps every keymap, physical layout and built-in behavior there. If ZMK
has changed in a way the editor doesn't handle, it opens an issue labelled `zmk-drift` (or comments on the
open one). Run it locally with `npm run zmk-drift -- <path-to-zmk-checkout>`.

**Function length:** keep functions under 100 lines. Exceeding that is allowed only when splitting the
function would genuinely make the code worse, and the exception must say why, inline:

```js
// eslint-disable-next-line max-lines-per-function -- <why splitting would hurt readability>
```

Lint fails on long functions without such a comment, on exceptions without a reason, and on exceptions that are
no longer needed.

## Deploy

**Live:** https://ulkden.github.io/zmk-yakme/

Every merge to `main` runs the full CI suite and then publishes to GitHub Pages
(`.github/workflows/deploy.yml`). `npm run build` assembles the site in `_site/`: only the app files,
with a version stamp (`?v=<version>+<commit>`) on every module, stylesheet and font URL, so browsers
don't mix cached old files with new ones after a deploy. `npm run test:site` builds and smoke-tests it.

## Releases

The app shows its version in the status bar and on the welcome screen, linking to that release's notes.
See [CHANGELOG.md](CHANGELOG.md) for what changed, and [GitHub Releases](https://github.com/ulkden/zmk-yakme/releases)
for every merged pull request. How to cut a release is described in [AGENTS.md](AGENTS.md#releases).

## Usage cheatsheet

| Do this | How |
|---|---|
| Import | **Import** → *Choose files…*, paste text, or paste a URL. A GitHub repo URL lists its files so you can pick which to import. You can also drop files anywhere. |
| Edit a key | Click the key, then click a keycode in the palette, choose a behavior in the side panel, or just type a letter or digit. |
| Clear a key | Select it and press <kbd>Delete</kbd>, or use *Transparent* / *None*. |
| Move between keys | Arrow keys (they follow the physical layout) |
| Layers | `+` adds a layer. ✎ (or double-click the active tab) opens layer settings: display name, node name, move, delete. |
| Combos | **Combos** tab → **+ New combo**, then click keys. Set the binding, timeout, prior-idle, slow-release and layers in the side panel. |
| Behaviors | **Behaviors** tab → add a hold-tap, mod-morph or macro, then pick it from the Behavior list when editing a key. |
| Export | **Export…** → set the file name, choose whether to add layer diagrams, then **Download** or **Copy**. |
| Back up work | **Save project** / **Open project** (JSON). Work also autosaves in the browser. |
| Start over | **Close keymap** clears the layout, keymap, autosaved copy and undo history. |
| Undo / redo | <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>Z</kbd> |

See [docs/DESIGN.md](docs/DESIGN.md) for the functional design, [ASSUMPTIONS.md](ASSUMPTIONS.md) for design decisions,
[docs/QA.md](docs/QA.md) for the manual QA process,
and [AGENTS.md](AGENTS.md) for the rules every change follows (for humans and AI agents alike).

## Credits & license

Inspired by [keymap-editor](https://github.com/nickcoutsos/keymap-editor) by Nick Coutsos and
[zmk-layout-helper](https://zmk-layout-helper.netlify.app/). No code was copied from either project.
This project is released under the [MIT License](LICENSE). The bundled JetBrains Mono font is under the
[SIL Open Font License 1.1](fonts/OFL.txt).
