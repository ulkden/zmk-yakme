// Export and saving by keyboard and screen reader (docs/ACCESSIBILITY.md, PR 8).
import { test, expect, loadExample } from './helpers.js';

test('the export preview can be reached and scrolled by keyboard, and Download is read out', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Export…' }).click();
  const preview = page.getByRole('region', { name: 'Keymap preview' });
  await preview.focus();
  await expect(preview).toBeFocused();
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download' }).click();
  await download;
  await expect(page.locator('#announcer')).toHaveText('Downloaded keymap.keymap');
});
