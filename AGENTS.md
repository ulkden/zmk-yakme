# AGENTS.md

Guidance for AI coding agents (and humans) working on **zmk-yakme**: *Yet Another Keymap Editor*
for ZMK firmware. Read this before changing anything. Where this file and a direct request from the
maintainer disagree, the maintainer wins, and this file should then be updated.

## Project in one paragraph

A static, client-side web app that imports a ZMK physical layout and keymap, edits layers, keys,
combos and custom behaviors, and exports a `.keymap` file. It is served from GitHub Pages. It is a
small project, updated "once in a while" when ZMK changes or the community asks. Favour simplicity,
stability and the user's trust over features.

## Commands

```sh
nvm use                   # Node version from .nvmrc (current LTS)
npm ci
npm run check             # lint + format check + unit tests
npm run test:e2e          # browser tests, Chromium (starts its own server)
npm run test:e2e:all      # Chromium, Firefox and WebKit, as CI does
npm run format            # Prettier
npm run build             # deployable site in _site/ (version-stamped URLs)
npm run test:site         # build + smoke-test the built site
npm run serve             # http://localhost:8080
```

Run `npm run check` and the relevant browser tests before every commit. CI runs everything on every PR.

## Architecture rules

- **No build step, no runtime dependencies.** Plain ES modules served as-is. Adding a runtime
  dependency or a build step needs the maintainer's explicit agreement.
- `src/dts/`, `src/core/`, `src/data/`: pure logic, no DOM access, fully unit-tested.
- `src/ui/`: DOM components. They change state only through `src/ui/actions.js`.
- State is immutable and updated through the store, so undo/redo works. Document changes go through
  the undo history; UI-only changes (`ui.*`) do not.
- Browser-only side effects (storage, clipboard, toasts) are injected into actions, so actions stay
  testable in Node.
- **Never lose user data.** Export regenerates only what was edited and preserves everything else in
  an imported file. Saved data (autosave, `.zmk-project.json`) is a public format: change it only
  with a version bump and a tested migration.

## Code style

- **Functions stay under 100 lines.** This is a very strong default, not an absolute. Exceed it only
  when splitting would genuinely make the code worse, and say why inline:
  `// eslint-disable-next-line max-lines-per-function -- <justification>`. Lint enforces the reason.
- Keep files small and focused. One concept per module.
- Match the surrounding code: naming, idioms, comment density. Comments explain *why*, not *what*.
- ESLint and Prettier are the source of truth for style. Don't hand-format against them.
- Prefer clear, boring code over clever code.

## Testing

- Work test-first where practical: define the behaviour, write the test, then make it pass.
- Pure logic gets unit tests (`tests/*.test.js`, `node:test`). User-visible behaviour gets
  Playwright tests (`e2e/`).
- New test files must also be imported in `tests/all.js` (the browser test runner).
- A flaky test is a bug report. Find the root cause (it has found real bugs here, such as Safari not
  committing on Enter); never "fix" flakiness by adding retries or sleeps.
- Verify ZMK-related changes against real ZMK files (zmkfirmware/zmk layouts and keymaps), not only
  hand-written fixtures.
- Never claim something works without running it. Report failures and skipped steps plainly.

## UX rules

- Dark mode only; modern, minimal, quiet visuals that don't distract from the task.
- **No action takes more than three clicks.** Update the click-budget table in `docs/DESIGN.md`
  when adding actions.
- Everything must work in Chromium, Firefox and WebKit (Safari), and by keyboard.
- Destructive or replacing actions confirm first when there is unexported work, and are undoable
  wherever possible (Close keymap deliberately clears history, so it always explains that it does).
- Visual and UX choices are the maintainer's. Prototype with real data (e.g. real keyboards from
  GitHub), show the options side by side with a recommendation, and let them choose.

## Security and privacy

- Treat imported files and fetched content as untrusted. Never put them into `innerHTML`; build DOM
  with `h()` / text nodes.
- Nothing leaves the browser. Network access only on explicit user action (URL / GitHub import), and
  only to GitHub. No analytics, trackers, external fonts or CDNs.
- The Content-Security-Policy in `index.html` enforces this. Keep it in sync with `ALLOWED_HOSTS` in
  `src/core/github.js`, and never loosen it (no `unsafe-inline`, `unsafe-eval` or new hosts) without
  the maintainer's agreement. Lint bans `innerHTML`, `eval` and similar.
- Report vulnerabilities privately (see `SECURITY.md`).
- Pin dependency versions exactly; pin GitHub Actions to commit SHAs; give workflows the least
  permissions they need.

## Workflow (GitHub flow)

- Branch from `main` for every change: `feat/…`, `fix/…`, `docs/…`, `chore/…`. Keep PRs small and focused.
- `main` is protected: changes land only by **squash merge** of a PR with green CI. Never push to `main`.
- Commit in small steps. Messages: imperative subject, a body explaining *why*. AI-assisted commits
  carry a `Co-Authored-By:` trailer.
- Formatting-only or mechanical changes (reformatting, renames) go in their **own PR**, so the squash
  commit can be listed in `.git-blame-ignore-revs` without hiding real changes.
- Merges to `main` deploy to GitHub Pages automatically. Keep `scripts/build-site.mjs` and its smoke
  test working, and never rely on files that aren't copied into `_site/`.
- PR descriptions cover what changed, why, how it was verified, and any settings changed outside the code.
- Merging is the maintainer's call. Don't merge PRs or change repository settings without being asked.
- Keep docs in step with the code in the same PR: README cheatsheet, `docs/DESIGN.md`, `docs/QA.md`.
- Spending stays at zero: public repo, standard GitHub-hosted runners, free GitHub features only.
  No GitHub Copilot or AI review features.

## Decisions and ambiguity

- When something is ambiguous and the maintainer isn't available, make the most reasonable assumption,
  record it in `ASSUMPTIONS.md` (decision + reason), and keep going. Deliver a working result first;
  refine together later.
- Open decisions are resolved **one at a time** with the maintainer, each with a recommended option.
- Record agreed decisions where future work will find them (`ASSUMPTIONS.md`, `docs/`), not only in chat.

## QA and feedback loop

- Every user-facing feature has a QA issue (label `qa`) with: a one-sentence summary, 1–5 test steps
  (≤ 25 words), acceptance criteria, and the feedback comment template from `docs/QA.md`. QA issues are
  ordered along the path a real user takes and double as the user-guide outline.
- New features get a QA issue in the same change. Add it to the "zmk-yakme QA" project with its
  Section and QA order.
- Feedback comments use fixed fields (`Result`, `Step`, `Expected`, `Actual`, `Suggestion`,
  `Severity`). Read them with `gh issue view N --comments`.
- Fix PRs reference feedback with `Refs #N`, not `Closes #N`; issues close only after a passing
  re-test. User-guide sections are written after the feature passes QA.

## Communicating with the maintainer

- Always include the direct link to any PR you open or update.
- Lead with the outcome; keep summaries short and concrete; state what was verified and how.
- Say clearly when you are blocked (e.g. a command that needs `sudo` must be run by the maintainer in
  their own terminal) instead of working around it.
- Stop and check in at agreed checkpoints rather than running ahead.
