import { test, expect, keys, loadExample } from './helpers.js';
import { V1_PROJECT } from '../tests/fixtures/saved/v1-project.js';

const DOC_KEY = 'zmk-keymap-editor:v1';
const BACKUP_KEY = 'zmk-keymap-editor:v1:unreadable';

async function seedAutosave(page, raw) {
  await page.evaluate(([k, v]) => localStorage.setItem(k, v), [DOC_KEY, raw]);
  await page.reload();
}

test('an autosave in the old (version 1) format still opens', async ({ page }) => {
  await seedAutosave(page, JSON.stringify({ ...V1_PROJECT, dirty: false }));
  await expect(keys(page)).toHaveCount(4);
  await expect(page.locator('#status')).toContainText('4 keys · 1 layers · 1 combos');
  await expect(page.getByRole('button', { name: /^Behaviors \(0\)/ })).toBeVisible();
});

test('an autosave from a newer version is explained and never overwritten', async ({ page }) => {
  const newer = JSON.stringify({ ...V1_PROJECT, version: 99 });
  await seedAutosave(page, newer);
  const notice = page.locator('dialog.notice');
  await expect(notice).toContainText('saved by a newer version');
  await notice.getByRole('button', { name: 'OK' }).click();
  await loadExample(page);
  await page.locator('#toolbar').getByRole('button', { name: 'Close Keymap' }).click();
  await page.locator('dialog.close-keymap').getByRole('button', { name: 'Close Keymap' }).click();
  await page.waitForTimeout(500);
  expect(await page.evaluate((k) => localStorage.getItem(k), DOC_KEY)).toBe(newer);
});

test('an unreadable autosave is backed up before starting fresh', async ({ page }) => {
  const damaged = JSON.stringify({ app: 'zmk-keymap-editor', version: 2, layouts: 'oops' });
  await seedAutosave(page, damaged);
  await expect(page.locator('dialog.notice')).toContainText('could not be read');
  expect(await page.evaluate((k) => localStorage.getItem(k), BACKUP_KEY)).toBe(damaged);
});

test('importing a project from a newer version shows why it cannot open', async ({ page }) => {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog textarea').fill(JSON.stringify({ ...V1_PROJECT, version: 99 }));
  await page.locator('dialog').getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('dialog .dialog-msg')).toContainText('newer version of zmk-yakme');
});
