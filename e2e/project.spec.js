import { readFile } from 'node:fs/promises';
import { test, expect, keys, key, loadExample, pick } from './helpers.js';

test('save a project and open it again', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await pick(page, 'Z');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save Project' }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toBe('keymap.zmk-project.json');
  const json = await readFile(await download.path(), 'utf8');
  expect(JSON.parse(json).app).toBe('zmk-keymap-editor');

  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('button', { name: 'Create Grid' }).click();
  await expect(keys(page)).toHaveCount(42);
  await expect(key(page, 1)).toHaveClass(/kind-none/);

  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Open Project' }).click();
  await (await chooser).setFiles({ name: 'p.json', mimeType: 'application/json', buffer: Buffer.from(json) });
  await expect(key(page, 1).locator('.tap')).toHaveText('Z');
});

test('replacing unexported work asks first', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await pick(page, 'Z');
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('button', { name: 'Create Grid' }).click();
  const confirm = page.locator('dialog.confirm');
  await expect(confirm).toContainText('Replace current keymap?');
  await confirm.getByRole('button', { name: 'Cancel' }).click();
  await expect(key(page, 1).locator('.tap')).toHaveText('Z');
  await page.locator('dialog').getByRole('button', { name: 'Create Grid' }).click();
  await page.locator('dialog.confirm').getByRole('button', { name: 'Replace' }).click();
  await expect(key(page, 1)).toHaveClass(/kind-none/);
});

test('no confirmation right after an export', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await pick(page, 'Z');
  await page.getByRole('button', { name: 'Export…' }).click();
  const dl = page.waitForEvent('download');
  await page.locator('dialog').getByRole('button', { name: 'Download' }).click();
  await dl;
  await page.getByRole('button', { name: 'New' }).click();
  await page.getByRole('button', { name: 'Load Example' }).click();
  await expect(page.locator('dialog.confirm')).toHaveCount(0);
  await expect(key(page, 1).locator('.tap')).toHaveText('Q');
});
