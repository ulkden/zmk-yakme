// Keyboard diagram and palette by keyboard and screen reader (docs/ACCESSIBILITY.md, PR 3).
import { test, expect, key, keys, loadExample } from './helpers.js';

const focusedKey = (page) => page.evaluate(() => document.activeElement?.dataset.focus ?? null);

test('the diagram is one Tab stop, and arrows move focus and selection by position', async ({ page }) => {
  await loadExample(page);
  await expect(keys(page).and(page.locator('[tabindex="0"]'))).toHaveCount(1);
  await key(page, 13).click();
  await page.keyboard.press('ArrowRight');
  expect(await focusedKey(page)).toBe('key-14');
  await expect(key(page, 14)).toHaveAttribute('aria-selected', 'true');
  await expect(key(page, 13)).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('ArrowUp');
  expect(await focusedKey(page)).toBe('key-2');
  await page.keyboard.press('End');
  expect(await focusedKey(page)).toBe('key-41');
  await page.keyboard.press('Home');
  expect(await focusedKey(page)).toBe('key-0');
  // Tab leaves the diagram for the keycode filter.
  await page.keyboard.press('Tab');
  await expect(page.getByRole('searchbox', { name: 'Filter keycodes' })).toBeFocused();
});

test('keys are a listbox of options named legend first, then position', async ({ page }) => {
  await loadExample(page);
  await expect(page.getByRole('listbox', { name: 'Keys on layer Base' })).toBeVisible();
  await expect(key(page, 13)).toHaveAccessibleName('A, key 13');
  await expect(key(page, 12)).toHaveAccessibleName('Esc, hold Ctrl, key 12');
  await expect(key(page, 37)).toHaveAccessibleName('Lower layer while held, key 37');
  await expect(key(page, 0)).toHaveAccessibleName('Tab, key 0');
  // Every text legend starts its key's name, so speech input ("click Esc") finds the key.
  const mismatched = await keys(page).evaluateAll((els) =>
    els
      .map((el) => [el.querySelector('.tap').textContent, el.getAttribute('aria-label')])
      .filter(([tap]) => /^[\p{L}\p{N}]/u.test(tap))
      .filter(([tap, name]) => !name.startsWith(tap)),
  );
  expect(mismatched).toEqual([]);
});

test('typing, Delete and Esc act on a key only while it has focus', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await page.getByRole('button', { name: 'Save Project' }).focus();
  await page.keyboard.press('z');
  await expect(key(page, 1).locator('.tap')).toHaveText('Q');
  await key(page, 1).focus();
  await page.keyboard.press('z');
  await expect(key(page, 1).locator('.tap')).toHaveText('Z');
  await page.keyboard.press('Delete');
  await expect(key(page, 1)).toHaveAccessibleName('None, key 1');
  await page.keyboard.press('Escape');
  await expect(key(page, 1)).toHaveAttribute('aria-selected', 'false');
});

test('Enter on the selected key moves to the side panel to edit it', async ({ page }) => {
  await loadExample(page);
  await key(page, 5).click();
  await key(page, 5).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#inspector select[name=behavior]')).toBeFocused();
  await expect(key(page, 5)).toHaveAttribute('aria-selected', 'true');
});

test('in Combos, arrows move focus and Space adds or removes the key', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: /^Combos/ }).click();
  await page.locator('.combo-item').first().click();
  const list = page.getByRole('listbox', { name: 'Keys in combo combo_esc' });
  await expect(list).toHaveAttribute('aria-multiselectable', 'true');
  await key(page, 2).focus();
  await page.keyboard.press('ArrowRight');
  expect(await focusedKey(page)).toBe('key-3');
  await expect(key(page, 3)).toHaveAttribute('aria-selected', 'false');
  await page.keyboard.press('Space');
  await expect(key(page, 3)).toHaveAttribute('aria-selected', 'true');
  expect(await focusedKey(page)).toBe('key-3');
});

test('the keycode palette is one Tab stop with arrow keys and group headings', async ({ page }) => {
  await loadExample(page);
  await expect(page.getByRole('heading', { level: 3, name: 'Letters' })).toBeVisible();
  const pk = page.locator('.palette .pk');
  await expect(pk.and(page.locator('[tabindex="0"]'))).toHaveCount(1);
  await page.getByRole('searchbox', { name: 'Filter keycodes' }).focus();
  await page.keyboard.press('Tab');
  await expect(page.getByRole('button', { name: 'A', exact: true }).last()).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(page.locator('.palette .pk[data-code="B"]')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(page.locator('.palette .pk[data-code="P"]')).toBeFocused();
  await expect(page.locator('.palette .pk[data-code="TAB"]')).toHaveAccessibleName('Tab');
  await expect(page.locator('.palette .pk[data-code="RSHIFT"]')).toHaveAccessibleName('R Shift');
});

test('in high-contrast mode the selected key fills with the highlight colour', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await loadExample(page);
  await key(page, 5).click();
  const bg = (i) => key(page, i).evaluate((el) => getComputedStyle(el).backgroundColor);
  expect(await bg(5)).not.toBe(await bg(6));
});
