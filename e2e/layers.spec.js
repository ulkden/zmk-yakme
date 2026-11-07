// Layer tabs and layer settings by keyboard and screen reader (docs/ACCESSIBILITY.md, PR 4).
import { test, expect, loadExample } from './helpers.js';

const tab = (page, name) => page.getByRole('tab', { name });

test('layer tabs are a tablist with one Tab stop; arrows switch layers and wrap', async ({ page }) => {
  await loadExample(page);
  const list = page.getByRole('tablist', { name: 'Layers' });
  await expect(list.getByRole('tab')).toHaveCount(3);
  await expect(tab(page, '0 Base')).toHaveAttribute('aria-selected', 'true');
  await expect(list.locator('[tabindex="0"]')).toHaveCount(1);
  await tab(page, '0 Base').focus();
  await page.keyboard.press('ArrowRight');
  await expect(tab(page, '1 Lower')).toBeFocused();
  await expect(tab(page, '1 Lower')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('listbox', { name: 'Keys on layer Lower' })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowLeft');
  await expect(tab(page, '2 Raise')).toBeFocused();
  await page.keyboard.press('Home');
  await expect(tab(page, '0 Base')).toBeFocused();
  await page.keyboard.press('End');
  await expect(tab(page, '2 Raise')).toBeFocused();
});

test('icon buttons have names, and mode buttons say whether they are pressed', async ({ page }) => {
  await loadExample(page);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Redo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add layer' })).toBeVisible();
  const combos = page.getByRole('button', { name: /^Combos/ });
  await expect(combos).toHaveAttribute('aria-pressed', 'false');
  await combos.click();
  await expect(combos).toHaveAttribute('aria-pressed', 'true');
  await expect(tab(page, '0 Base')).toHaveAttribute('aria-selected', 'false');
});

test('layer settings take focus when opened and give it back to ✎ on Esc', async ({ page }) => {
  await loadExample(page);
  const edit = page.getByRole('button', { name: 'Layer settings' });
  await expect(edit).toHaveAttribute('aria-expanded', 'false');
  await edit.focus();
  await page.keyboard.press('Enter');
  await expect(edit).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('dialog', { name: 'Layer settings' }).getByLabel('Display name')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'Layer settings' })).toHaveCount(0);
  await expect(edit).toBeFocused();
});

test('in high-contrast mode the active layer tab fills with the highlight colour', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await loadExample(page);
  const bg = (name) => tab(page, name).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bg('0 Base')).not.toBe(await bg('1 Lower'));
});
