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

test('icon buttons have names, and the mode buttons say which view is current', async ({ page }) => {
  await loadExample(page);
  await expect(page.getByRole('button', { name: 'Undo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Redo' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Add layer' })).toBeVisible();
  const combos = page.getByRole('button', { name: /^Combos/ });
  await expect(combos).not.toHaveAttribute('aria-current');
  await combos.click();
  await expect(combos).toHaveAttribute('aria-current', 'true');
  await expect(tab(page, '0 Base')).toHaveAttribute('aria-controls', 'keyboard');
  await expect(tab(page, '0 Base')).toHaveAttribute('aria-selected', 'false');
});

test('a click elsewhere closes the layer settings without moving focus to ✎', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Layer settings' }).click();
  await page.locator('#status').click({ position: { x: 5, y: 5 } });
  await expect(page.getByRole('dialog', { name: 'Layer settings' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Layer settings' })).not.toBeFocused();
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
  const highlight = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement('div'));
    probe.style.cssText = 'forced-color-adjust: none; background: Highlight';
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  });
  expect(await bg('0 Base')).toBe(highlight);
  expect(await bg('1 Lower')).not.toBe(highlight);
});
