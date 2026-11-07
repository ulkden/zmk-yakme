// Accessibility of the welcome screen, dialogs and import (docs/ACCESSIBILITY.md, PR 2).
import { test, expect, loadExample } from './helpers.js';

test('the page has one top-level heading, the app name', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/ZMK Keymap Editor/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
  await loadExample(page);
  await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
});

test('dialogs are named by their title, and short ones read their message', async ({ page }) => {
  await page.getByRole('button', { name: 'Import Files' }).click();
  await expect(page.getByRole('dialog', { name: 'Import' })).toBeVisible();
  await page.keyboard.press('Escape');
  await loadExample(page);
  await page.getByRole('button', { name: 'Close Keymap' }).click();
  const close = page.getByRole('dialog', { name: 'Close keymap?' });
  await expect(close).toHaveAccessibleDescription(/clears the layout, keymap/);
});

test('the import fields have visible labels', async ({ page }) => {
  await page.getByRole('button', { name: 'Import Files' }).click();
  await expect(page.getByLabel('Or paste file contents')).toBeVisible();
  await expect(page.getByLabel('Or load from a link')).toBeVisible();
});

test('import errors are read out inside the dialog', async ({ page }) => {
  await page.getByRole('button', { name: 'Import Files' }).click();
  await page.getByLabel('Or paste file contents').fill('not a keymap');
  await page.getByRole('button', { name: 'Load' }).click();
  const dialog = page.getByRole('dialog', { name: 'Import' });
  await expect(dialog.locator('.dialog-msg')).toHaveText(/No physical layout or keymap/);
  await expect(dialog.locator('.dialog-announcer')).toHaveText(/No physical layout or keymap/);
});

test('opening a keymap moves focus to the first key, closing it to Import Files', async ({ page }) => {
  await page.getByRole('button', { name: 'Try the Example' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#keyboard .key').first()).toBeFocused();
  await expect(page.locator('#announcer')).toHaveText('Example loaded: 42 keys, 3 layers');

  await page.getByRole('button', { name: 'Close Keymap' }).focus();
  await page.keyboard.press('Enter');
  await page.getByRole('dialog', { name: 'Close keymap?' }).getByRole('button', { name: 'Close Keymap' }).click();
  await expect(page.getByRole('button', { name: 'Import Files' })).toBeFocused();
});

test('a blank keymap from the New dialog is announced', async ({ page }) => {
  await page.getByRole('button', { name: 'Start Blank' }).click();
  await page.getByRole('button', { name: 'Create Grid' }).click();
  await expect(page.locator('#announcer')).toHaveText('Blank keymap created: 42 keys, 3 layers');
  await expect(page.locator('#keyboard .key').first()).toBeFocused();
});

test('a successful import from the Import dialog is read out after it closes', async ({ page }) => {
  await page.getByRole('button', { name: 'Import Files' }).click();
  const keymap = '/ { keymap { compatible = "zmk,keymap"; base { bindings = <&kp A &kp B>; }; }; };';
  await page.getByLabel('Or paste file contents').fill(keymap);
  await page.getByRole('button', { name: 'Load' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
  await expect(page.locator('#announcer')).toHaveText('Imported keymap');
});

test('the welcome screen links to the accessibility statement', async ({ page }) => {
  await expect(page.getByRole('link', { name: 'Accessibility' })).toHaveAttribute('href', /docs\/ACCESSIBILITY\.md$/);
});
