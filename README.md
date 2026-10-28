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
npm test                          # unit tests (node:test, no installs needed)
npm install && npx playwright install chromium
npm run test:e2e                  # browser tests (Playwright, starts its own server)
# unit tests also run in a browser: http://localhost:8080/tests/
```

## Deploy

Enable GitHub Pages for the repository root (branch `main`, folder `/`). No build needed.

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
and [docs/QA.md](docs/QA.md) for the manual QA process.

## Credits & license

Inspired by [keymap-editor](https://github.com/nickcoutsos/keymap-editor) by Nick Coutsos and
[zmk-layout-helper](https://zmk-layout-helper.netlify.app/). No code was copied from either project.
This project is released under the [MIT License](LICENSE). The bundled JetBrains Mono font is under the
[SIL Open Font License 1.1](fonts/OFL.txt).
