// Keyboard focus, skip links and screen-reader announcements (docs/ACCESSIBILITY.md, PR 1).
import { test, expect, key, loadExample } from './helpers.js';

const focused = (page) => page.evaluate(() => document.activeElement?.dataset.focus ?? document.activeElement?.tagName);

test('focus stays on the control that was used when the screen updates', async ({ page }) => {
  await loadExample(page);
  await key(page, 13).focus();
  await page.keyboard.press('Enter');
  await expect(key(page, 13)).toHaveClass(/selected/);
  expect(await focused(page)).toBe('key-13');

  await page.locator('.tab', { hasText: 'Lower' }).focus();
  await page.keyboard.press('Enter');
  expect(await focused(page)).toBe('layer-1');

  await page.getByRole('button', { name: /^Combos/ }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.combo-item')).toHaveCount(1);
  await expect(page.getByRole('button', { name: /^Combos/ })).toBeFocused();

  await page.locator('.combo-item').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.combo-item').first()).toHaveClass(/active/);
  expect(await focused(page)).toBe('combo-0');
});

test('focus moves to a neighbour when its control disappears', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: /^Combos/ }).click();
  await page.getByRole('button', { name: '+ New Combo' }).click();
  await page.getByRole('button', { name: 'Delete Combo' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('.combo-item')).toHaveCount(1);
  await expect(page.getByRole('button', { name: '+ New Combo' })).toBeFocused();
});

test('the focus ring shows for the keyboard, not for mouse clicks', async ({ page }) => {
  await loadExample(page);
  await key(page, 5).click();
  const ring = (el) =>
    el.evaluate((e) => {
      if (!e.matches(':focus-visible')) return 'none';
      const s = getComputedStyle(e);
      return `${s.outlineWidth} ${s.outlineStyle} ${s.outlineColor} offset ${s.outlineOffset}`;
    });
  expect(await ring(key(page, 5))).toBe('none');
  await page.keyboard.press('Tab');
  expect(await ring(page.locator(':focus'))).toBe('2px solid rgb(232, 236, 242) offset 2px');
});

test('skip links appear on the first Tab and move focus', async ({ page }) => {
  await loadExample(page);
  await page.reload(); // the autosaved keymap opens with nothing focused yet
  await page.keyboard.press('Tab');
  const toKeys = page.getByRole('link', { name: 'Skip to keys' });
  await expect(toKeys).toBeFocused();
  await expect(toKeys).toBeInViewport();
  await page.keyboard.press('Enter');
  expect(await focused(page)).toBe('key-0');

  await key(page, 7).click();
  await toKeys.focus();
  await page.keyboard.press('Enter');
  expect(await focused(page)).toBe('key-7');
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('link', { name: 'Skip to keycodes' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('searchbox', { name: 'Filter keycodes' })).toBeFocused();

  await page.getByRole('link', { name: 'Skip to side panel' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#inspector select[name=behavior]')).toBeFocused();
});

test('skip links are not offered on the welcome screen', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Skip to keys' })).toBeHidden();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => !!document.activeElement.closest('.skip-links'))).toBe(false);
});

test('messages are announced to screen readers', async ({ page }) => {
  await loadExample(page);
  const announcer = page.locator('#announcer');
  await expect(announcer).toHaveAttribute('aria-live', 'polite');
  await page.getByRole('button', { name: 'Save Project' }).click();
  await expect(announcer).toHaveText('Project saved: keymap.zmk-project.json');
  await expect(page.locator('#toast')).toHaveAttribute('aria-hidden', 'true');
});

test('an inline delete confirmation keeps focus on its own buttons', async ({ page }) => {
  await loadExample(page);
  await page.locator('.layer-edit').click();
  const del = page.getByRole('button', { name: 'Delete Layer' });
  await del.focus();
  await page.keyboard.press('Enter');
  const cancel = page.locator('.layer-popover').getByRole('button', { name: 'Cancel' });
  await expect(cancel).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(del).toBeFocused();
  await expect(page.locator('.tab', { hasText: 'Base' })).toHaveCount(1);
});

test('mode tabs keep focus when their count changes', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: /^Combos/ }).click();
  await page.getByRole('button', { name: '+ New Combo' }).click();
  const tab = page.getByRole('button', { name: /^Combos/ });
  await tab.focus();
  await page.keyboard.press('Control+z');
  await expect(tab).toHaveText('Combos (1)');
  await expect(tab).toBeFocused();
});

test('messages raised inside a dialog are announced from within it', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'New', exact: true }).click();
  const dialog = page.locator('dialog[open]');
  await dialog.locator('input').first().fill('');
  await dialog.getByRole('button', { name: 'Create Grid' }).click();
  await expect(dialog.locator('.dialog-announcer')).toHaveText(/Enter keys per row/);
});
