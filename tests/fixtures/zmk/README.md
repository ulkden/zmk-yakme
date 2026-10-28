# Pinned ZMK files

Real keyboards from [zmkfirmware/zmk](https://github.com/zmkfirmware/zmk), copied unchanged at commit
[`4dd95d7`](https://github.com/zmkfirmware/zmk/tree/4dd95d7840eb3d5a3f59bb29fbf1ab054715ef85)
(2026-10-09). Each file keeps its path in the ZMK repository, so the same list in
`tests/zmk-checks.js` (`BOARDS`) works for these copies and for a fresh ZMK checkout.

These files are © The ZMK Contributors and used under the MIT License; see [LICENSE](LICENSE).

`tests/zmk-boards.test.js` imports, exports and re-imports every board here on each test run, so
these copies never change unless we choose to. `scripts/zmk-drift.mjs` runs the same checks
monthly against ZMK's latest `main` (see `.github/workflows/zmk-drift.yml`).

## Refreshing

After a drift issue is fixed, re-pin to the commit that was checked (run from the repository root):

```sh
git clone --depth 1 https://github.com/zmkfirmware/zmk ../zmk
node -e "import('./tests/zmk-checks.js').then((m) => console.log(m.BOARDS.flatMap((b) => [...b.layouts, b.keymap]).join('\n')))" \
  | (cd ../zmk && xargs cp --parents -t "$OLDPWD/tests/fixtures/zmk")
cp ../zmk/LICENSE tests/fixtures/zmk/LICENSE
```

Then update the commit above and the expected key and layer counts in `tests/zmk-boards.test.js`.
Adding a board is a new entry in `BOARDS` plus its files copied the same way.
