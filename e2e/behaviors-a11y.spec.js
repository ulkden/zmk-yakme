// Behaviors by keyboard and screen reader (docs/ACCESSIBILITY.md, PR 6).
import { test, expect, key, loadExample } from './helpers.js';

test('the behaviors list says which behavior is selected', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: /^Behaviors/ }).click();
  await page.getByRole('button', { name: '+ Hold-Tap' }).click();
  await expect(page.locator('#inspector .combo-item').first()).toHaveAttribute('aria-pressed', 'true');
});

test('behavior delete confirmations read their question, and the mod chips are labelled groups', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: /^Behaviors/ }).click();
  await page.getByRole('button', { name: '+ Mod-Morph' }).click();
  await expect(
    page.getByRole('group', { name: 'Mods', exact: true }).getByRole('button', { name: 'LShift' }),
  ).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('group', { name: 'Keep mods' })).toBeVisible();
  await page.getByRole('button', { name: 'Delete Behavior' }).focus();
  await page.keyboard.press('Enter');
  const cancel = page.locator('#inspector').getByRole('button', { name: 'Cancel' });
  await expect(cancel).toBeFocused();
  await expect(cancel).toHaveAccessibleDescription(/^Delete &mm\?/);
});

test('Save Behavior returns focus to the Behavior list of the key being edited', async ({ page }) => {
  await loadExample(page);
  await key(page, 3).click();
  await page.getByRole('button', { name: /^Behaviors/ }).click();
  await page.getByRole('button', { name: '+ Hold-Tap' }).click();
  await page.getByRole('button', { name: 'Save Behavior' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#inspector select[name=behavior]')).toBeFocused();
  await expect(page.locator('#inspector')).toContainText('Key 3');
});

test('an abandoned delete confirmation does not come back', async ({ page }) => {
  await loadExample(page);
  await key(page, 3).click();
  await page.getByRole('button', { name: /^Behaviors/ }).click();
  await page.getByRole('button', { name: '+ Mod-Morph' }).click();
  await page.getByRole('button', { name: 'Delete Behavior' }).click();
  await page.getByRole('button', { name: 'Save Behavior' }).click();
  await page.getByRole('button', { name: /^Behaviors/ }).click();
  // The behavior is still selected, so its editor opens with a plain Delete button, not the question.
  await expect(page.locator('#inspector .combo-item').first()).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Delete Behavior' })).toBeVisible();
  await expect(page.locator('#inspector .confirm-row')).toHaveCount(0);
});

test('leaving Behaviors by a layer tab does not pull focus to the Behavior list', async ({ page }) => {
  await loadExample(page);
  await key(page, 3).click();
  await page.getByRole('button', { name: /^Behaviors/ }).click();
  await page.getByRole('button', { name: '+ Hold-Tap' }).click();
  await page.getByLabel('Label').focus();
  // A click that doesn't move focus, as in WebKit.
  await page.getByRole('tab', { name: '1 Lower' }).evaluate((el) => el.click());
  await expect(page.locator('#inspector select[name=behavior]')).not.toBeFocused();
});

test('Ctrl+Z still undoes while a select has focus', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await page.keyboard.press('z');
  await expect(key(page, 1)).toHaveAccessibleName('Z, key 1');
  await page.locator('#inspector select[name=behavior]').focus();
  await page.keyboard.press('Control+z');
  await expect(key(page, 1)).toHaveAccessibleName('Q, key 1');
});
