import { test, expect, keys, key } from './helpers.js';
import { ELVN_KEYMAP, ELVN_LAYOUT } from '../tests/fixtures/elvn.js';

async function pasteImport(page, text) {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog textarea').fill(text);
  await page.locator('dialog').getByRole('button', { name: 'Import', exact: true }).click();
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
  await page.locator('dialog').getByRole('button', { name: 'Import', exact: true }).click();
  const rows = page.locator('dialog .repo-file');
  await expect(rows).toHaveCount(3);
  await expect(rows.filter({ hasText: 'elvn.overlay' }).locator('input')).not.toBeChecked();
  await expect(rows.filter({ hasText: 'elvn.keymap' }).locator('input')).toBeChecked();
  await page.getByRole('button', { name: 'Import selected' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(keys(page)).toHaveCount(4);
  await expect(page.locator('#status')).toContainText('Default Layout');
  await expect(page.locator('#status')).toContainText('1 layers');
});

test('repository listing errors are shown', async ({ page }) => {
  await page.route('https://api.github.com/**', (r) => r.fulfill({ status: 404, json: {} }));
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog [name="import-url"]').fill('https://github.com/me/missing');
  await page.locator('dialog').getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('dialog .repo-panel')).toContainText('not found');
});
