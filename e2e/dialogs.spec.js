import { test, expect, key, loadExample, pick } from './helpers.js';

const open = (page) => page.locator('dialog[open]');
const DIALOGS = ['Import', 'New', 'Export…', 'Close keymap'];

test('every dialog closes with its ✕, a click outside, or Esc', async ({ page }) => {
  await loadExample(page);
  for (const name of DIALOGS) {
    for (const how of ['x', 'outside', 'escape']) {
      await page.getByRole('button', { name, exact: true }).click();
      await expect(open(page), name).toHaveCount(1);
      if (how === 'x') await open(page).getByRole('button', { name: 'Close dialog' }).click();
      else if (how === 'outside') await page.mouse.click(5, 5);
      else await page.keyboard.press('Escape');
      await expect(open(page), `${name} / ${how}`).toHaveCount(0);
    }
  }
  await expect(page.locator('#keyboard .key')).toHaveCount(42);
});

test('a confirmation closed by clicking outside counts as Cancel', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await pick(page, 'Z');
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await page.getByRole('button', { name: 'Load example' }).click();
  await expect(page.locator('dialog.confirm')).toBeVisible();
  await page.mouse.click(5, 5);
  await expect(page.locator('dialog.confirm')).toHaveCount(0);
  await expect(key(page, 1).locator('.tap')).toHaveText('Z');
});

test('clicks inside a dialog, or a drag that ends outside it, keep it open', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Export…' }).click();
  await open(page).locator('h2').click();
  await expect(open(page)).toHaveCount(1);
  const box = await open(page).locator('pre.preview').boundingBox();
  await page.mouse.move(box.x + 20, box.y + 20);
  await page.mouse.down();
  await page.mouse.move(5, 5, { steps: 5 });
  await page.mouse.up();
  await expect(open(page)).toHaveCount(1);
});

test('the ✕ is not focused when a dialog opens', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(open(page).locator('input.filename')).toBeFocused();
});
