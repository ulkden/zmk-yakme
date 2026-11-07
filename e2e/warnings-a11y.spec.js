// Warnings by keyboard and screen reader (docs/ACCESSIBILITY.md, PR 7).
import { test, expect, loadExample } from './helpers.js';

const announcer = (page) => page.locator('#announcer');
const warnButton = (page) => page.locator('#status button.warn');

async function addEmptyCombo(page) {
  await page.getByRole('button', { name: /^Combos/ }).click();
  await page.getByRole('button', { name: '+ New Combo' }).click();
}

test('a new warning is read out', async ({ page }) => {
  await loadExample(page);
  await addEmptyCombo(page);
  await expect(announcer(page)).toHaveText('New warning: Combo "combo_2" needs at least 2 keys.');
});

test('the warnings button says whether its list is open', async ({ page }) => {
  await loadExample(page);
  await addEmptyCombo(page);
  await expect(warnButton(page)).toHaveAttribute('aria-expanded', 'false');
  await warnButton(page).click();
  await expect(warnButton(page)).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('list', { name: 'Warnings' })).toBeVisible();
  await expect(page.locator(`#${await warnButton(page).getAttribute('aria-controls')}`)).toBeVisible();
});

test('Clear Warnings and "N hidden" hand focus to what replaces them', async ({ page }) => {
  await loadExample(page);
  await addEmptyCombo(page);
  await warnButton(page).click();
  await page.getByRole('button', { name: 'Clear Warnings' }).focus();
  await page.keyboard.press('Enter');
  const hidden = page.getByRole('button', { name: '1 hidden' });
  await expect(hidden).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(warnButton(page)).toBeFocused();
  await expect(warnButton(page)).toHaveAttribute('aria-expanded', 'true');
});
