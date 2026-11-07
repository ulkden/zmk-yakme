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

test('warnings a keymap already has are not read out when it opens', async ({ page }) => {
  await loadExample(page);
  await addEmptyCombo(page);
  await expect(announcer(page)).toHaveText(/New warning/);
  await page.reload();
  await expect(warnButton(page)).toBeVisible();
  await expect(announcer(page)).toHaveText('');
});

test('fixing the last warning of its kind keeps focus in the status bar', async ({ page }) => {
  await loadExample(page);
  // A two-key layout leaves the example's layers with extra bindings, which Trim fixes.
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.getByLabel('Or paste file contents').fill('["Q","W"]');
  await page.getByRole('button', { name: 'Load' }).click();
  await warnButton(page).click();
  await page.getByRole('button', { name: 'Trim Extra Bindings' }).first().focus();
  await page.keyboard.press('Enter');
  await expect(announcer(page)).toHaveText(/Extra bindings trimmed/);
  expect(await page.evaluate(() => !!document.activeElement.closest('#status'))).toBe(true);
});
