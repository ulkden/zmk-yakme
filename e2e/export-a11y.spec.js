// Export and saving by keyboard and screen reader (docs/ACCESSIBILITY.md, PR 8).
import { test, expect, loadExample } from './helpers.js';

test('the export preview is reached with Tab and scrolls by keyboard', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Export…' }).click();
  await page.getByRole('checkbox', { name: /layer diagram/ }).focus();
  await page.keyboard.press('Tab');
  const preview = page.getByRole('region', { name: 'Keymap preview' });
  await expect(preview).toBeFocused();
  await page.keyboard.press('PageDown');
  await expect.poll(() => preview.evaluate((el) => el.scrollTop)).toBeGreaterThan(0);
});

test('toggling layer diagrams keeps focus on the checkbox', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Export…' }).click();
  const box = page.getByRole('checkbox', { name: /layer diagram/ });
  await box.focus();
  await page.keyboard.press('Space');
  await expect(box).not.toBeChecked();
  await expect(box).toBeFocused();
});

test('starting a download is read out', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Export…' }).click();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  await download;
  await expect(page.locator('#announcer')).toHaveText('Download started: keymap.keymap');
});
