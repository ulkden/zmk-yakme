import { test, expect, key, loadExample, pick } from './helpers.js';

const closeBtn = (page) => page.locator('#toolbar').getByRole('button', { name: 'Close Keymap' });

test('close returns to the welcome screen and stays closed after reload', async ({ page }) => {
  await expect(closeBtn(page)).toBeDisabled();
  await loadExample(page);
  await closeBtn(page).click();
  const dlg = page.locator('dialog.close-keymap');
  await expect(dlg).not.toContainText('will be lost');
  await dlg.getByRole('button', { name: 'Close Keymap' }).click();
  await expect(page.getByRole('heading', { name: 'ZMK Keymap Editor' })).toBeVisible();
  await expect(page.getByRole('button', { name: '↶' })).toBeDisabled();
  await page.reload();
  await expect(page.getByRole('button', { name: 'Try the Example' })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('zmk-keymap-editor:v1'))).toBeNull();
});

test('close warns about unexported changes and can be cancelled', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await pick(page, 'Z');
  await closeBtn(page).click();
  const dlg = page.locator('dialog.close-keymap');
  await expect(dlg).toContainText('will be lost');
  await dlg.getByRole('button', { name: 'Cancel' }).click();
  await expect(key(page, 1).locator('.tap')).toHaveText('Z');
});

test('close can reset preferences too', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await page.getByLabel('Advance to next key after picking a keycode').check();
  await closeBtn(page).click();
  await page.getByLabel('Also reset preferences (auto-advance, layer diagrams)').check();
  await page.locator('dialog.close-keymap').getByRole('button', { name: 'Close Keymap' }).click();
  expect(await page.evaluate(() => localStorage.getItem('zmk-keymap-editor:prefs'))).toBeNull();
  await page.getByRole('button', { name: 'Try the Example' }).click();
  await key(page, 1).click();
  await expect(page.getByLabel('Advance to next key after picking a keycode')).not.toBeChecked();
});
