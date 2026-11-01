import { test, expect, keys, key } from './helpers.js';
import { ELVN_KEYMAP, ELVN_LAYOUT } from '../tests/fixtures/elvn.js';

async function pasteImport(page, text) {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog textarea').fill(text);
  await page.locator('dialog').getByRole('button', { name: 'Load', exact: true }).click();
}

test('KLE paste seeds the base layer from legends', async ({ page }) => {
  await pasteImport(page, '["Esc","!\\n1","Q","W"],\n[{w:2},"Shift","Fn"]');
  await expect(keys(page)).toHaveCount(6);
  await expect(key(page, 0).locator('.tap')).toHaveText('Esc');
  await expect(key(page, 1).locator('.tap')).toHaveText('1');
  await expect(key(page, 4).locator('.tap')).toHaveText('⇧');
  await expect(key(page, 5)).toHaveClass(/kind-none/);
});

test('helper-macro keymaps get a specific message with an issue link', async ({ page }) => {
  await pasteImport(page, '#include <zmk-helpers/helper.h>\nZMK_LAYER(base, &kp A)\n');
  const msg = page.locator('dialog .dialog-msg');
  await expect(msg).toContainText('helper macros');
  await expect(msg.getByRole('link', { name: 'Open an issue on GitHub' })).toHaveAttribute('href', /\/issues\/new$/);
});

test('import from a GitHub repository lists and imports selected files', async ({ page }) => {
  const tree = {
    truncated: false,
    tree: [
      { type: 'blob', path: 'README.md' },
      { type: 'blob', path: 'boards/shields/elvn/elvn.keymap' },
      { type: 'blob', path: 'boards/shields/elvn/elvn-layouts.dtsi' },
      { type: 'blob', path: 'boards/shields/elvn/elvn.overlay' },
      { type: 'blob', path: 'Some/Very/Long/Directory/Names/That/Never/End/boards/shields/scottofly/scottofly.keymap' },
    ],
  };
  await page.route('https://api.github.com/repos/me/zmk-config', (r) =>
    r.fulfill({ json: { default_branch: 'main' } }),
  );
  await page.route('https://api.github.com/repos/me/zmk-config/git/trees/**', (r) => r.fulfill({ json: tree }));
  await page.route('https://raw.githubusercontent.com/me/zmk-config/main/**', (r) => {
    const body = r.request().url().endsWith('.keymap') ? ELVN_KEYMAP : ELVN_LAYOUT;
    return r.fulfill({ body, contentType: 'text/plain' });
  });
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog [name="import-url"]').fill('https://github.com/me/zmk-config');
  await page.locator('dialog').getByRole('button', { name: 'Load', exact: true }).click();
  const rows = page.locator('dialog .repo-file');
  await expect(rows).toHaveCount(4);
  await expect(page.locator('dialog .repo-file:visible')).toHaveCount(3); // elvn.overlay is hidden
  // A long path keeps its file name visible and shows the whole path on hover.
  const long = rows.filter({ hasText: 'scottofly.keymap' });
  await expect(long).toHaveAttribute('title', /^Some\/Very\/.*\/scottofly\/scottofly\.keymap$/);
  await expect(long.locator('.path-tail')).toHaveText('scottofly/scottofly.keymap');
  const head = await long.locator('.path-head').evaluate((el) => el.scrollWidth > el.clientWidth);
  expect(head).toBe(true);
  await long.locator('input').uncheck();
  await expect(rows.filter({ hasText: 'elvn.overlay' }).locator('input')).not.toBeChecked();
  await expect(rows.filter({ hasText: 'elvn.keymap' }).locator('input')).toBeChecked();
  await page.getByRole('button', { name: 'Import Selected' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(keys(page)).toHaveCount(4);
  await expect(page.locator('#status')).toContainText('Default Layout');
  await expect(page.locator('#status')).toContainText('1 layers');
});

async function listRepo(page, paths) {
  const tree = { truncated: false, tree: paths.map((path) => ({ type: 'blob', path })) };
  await page.route('https://api.github.com/repos/me/zmk-config', (r) =>
    r.fulfill({ json: { default_branch: 'main' } }),
  );
  await page.route('https://api.github.com/repos/me/zmk-config/git/trees/**', (r) => r.fulfill({ json: tree }));
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog [name="import-url"]').fill('https://github.com/me/zmk-config');
  await page.locator('dialog').getByRole('button', { name: 'Load', exact: true }).click();
}

test('a repository lists keymaps and likely layouts; Show all and Deselect All', async ({ page }) => {
  await listRepo(page, [
    'config/corne.keymap',
    'boards/shields/elvn/elvn-layouts.dtsi',
    'boards/shields/elvn/elvn_left.overlay',
    '.vscode/settings.json',
  ]);
  const visible = page.locator('dialog .repo-file:visible');
  const row = (name) => page.locator('dialog .repo-file', { hasText: name });
  await expect(visible).toHaveCount(2);
  const showAll = page.getByLabel('Show all files (2 more)');
  await showAll.check();
  await expect(visible).toHaveCount(4);
  await row('elvn_left.overlay').locator('input').check();
  await showAll.uncheck();
  // A ticked file stays visible, so nothing hidden is imported by surprise.
  await expect(visible).toHaveCount(3);
  await expect(row('settings.json')).toBeHidden();
  await expect(row('elvn_left.overlay').locator('input')).toBeChecked();

  await page.getByRole('button', { name: 'Deselect All' }).click();
  await expect(page.locator('dialog .repo-file input:checked')).toHaveCount(0);
  await page.getByRole('button', { name: 'Import Selected' }).click();
  await expect(page.locator('dialog .repo-actions')).toContainText('Select at least one file.');
});

test('a repository with no keymap or likely layout lists all its files', async ({ page }) => {
  await listRepo(page, ['boards/shields/x/x_left.overlay', 'boards/shields/x/x.dtsi']);
  await expect(page.locator('dialog .repo-file:visible')).toHaveCount(2);
  await expect(page.getByLabel(/Show all files/)).toHaveCount(0);
});

test('a multi-keyboard repository is folded by keyboard', async ({ page }) => {
  await listRepo(page, [
    'ScottoFrog/QMK/keyboard.json',
    'ScottoFrog/ZMK/boards/shields/frog/frog.keymap',
    'ScottoWing/QMK/keyboard.json',
    'ScottoWing/ZMK/config/wing.keymap',
    'ScottoWing/ZMK/config/wing_left.overlay',
  ]);
  const group = (name) =>
    page.locator('dialog details.repo-group', { has: page.locator('summary', { hasText: name }) });
  const frog = group('ScottoFrog');
  const wing = group('ScottoWing');
  await expect(page.locator('dialog details.repo-group')).toHaveCount(2);
  // Only the chosen keymap's keyboard is open and ticked.
  await expect(frog).toHaveAttribute('open', '');
  await expect(wing).not.toHaveAttribute('open', '');
  await expect(page.locator('dialog .repo-file input:checked')).toHaveCount(2);
  await expect(frog.locator('summary')).toContainText('1 keymap · 1 layout · 2 selected');
  await expect(wing.locator('summary')).toContainText('1 keymap · 1 layout');
  await expect(wing.locator('summary')).not.toContainText('selected');
  // Folder names are the user's data: shown as they are, not restyled like palette headings.
  await expect(frog.locator('.repo-group-name')).toHaveCSS('text-transform', 'none');
  // Paths show inside their keyboard's folder; the tooltip has the whole path.
  await expect(frog.locator('.repo-file', { hasText: 'frog.keymap' })).toHaveAttribute(
    'title',
    'ScottoFrog/ZMK/boards/shields/frog/frog.keymap',
  );
  await expect(frog.locator('.repo-path').first()).not.toContainText('ScottoFrog/');

  // Unfold by mouse, tick, fold: the folded header still says what is ticked.
  await wing.locator('summary').click();
  await wing.locator('.repo-file', { hasText: 'wing.keymap' }).locator('input').check();
  await wing.locator('summary').click();
  await expect(wing).not.toHaveAttribute('open', '');
  await expect(wing.locator('summary')).toContainText('1 selected');
  // And by keyboard.
  await wing.locator('summary').focus();
  await page.keyboard.press('Enter');
  await expect(wing).toHaveAttribute('open', '');

  await page.getByLabel('Show all files (1 more)').check();
  await expect(wing.locator('.repo-file:visible')).toHaveCount(3);
  await page.getByRole('button', { name: 'Collapse All' }).click();
  await expect(page.locator('dialog details.repo-group[open]')).toHaveCount(0);
  await page.getByRole('button', { name: 'Expand All' }).click();
  await expect(page.locator('dialog details.repo-group[open]')).toHaveCount(2);
});

test('a standard zmk-config is not folded', async ({ page }) => {
  await listRepo(page, ['boards/shields/cygnus/layouts.dtsi', 'config/cygnus.keymap', 'config/hillside_view.keymap']);
  await expect(page.locator('dialog details.repo-group')).toHaveCount(0);
  await expect(page.locator('dialog .repo-file:visible')).toHaveCount(3);
  await expect(page.locator('dialog .repo-file input:checked')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Expand All' })).toHaveCount(0);
});

test('repository listing errors are shown', async ({ page }) => {
  await page.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, json: {} }));
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog [name="import-url"]').fill('https://github.com/me/missing');
  await page.locator('dialog').getByRole('button', { name: 'Load', exact: true }).click();
  await expect(page.locator('dialog .repo-panel')).toContainText('not found');
});
