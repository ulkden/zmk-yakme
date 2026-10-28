import { test, expect, keys, key, loadExample, pick } from './helpers.js';

test('welcome screen, then example loads with layers and status', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'ZMK Keymap Editor' })).toBeVisible();
  await expect(page.locator('#inspector')).toBeHidden();
  await loadExample(page);
  await expect(page.locator('.tab-list .tab:not(.add)')).toHaveText(['0Base', '1Lower', '2Raise']);
  await expect(page.locator('#status')).toContainText('42 keys · 3 layers · 1 combos');
  await expect(page.locator('#status')).toContainText('No issues');
  await expect(key(page, 1).locator('.tap')).toHaveText('Q');
  await expect(key(page, 12).locator('.hold')).toHaveText('Ctrl');
});

test('select a key and assign a keycode from the palette', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await expect(key(page, 1)).toHaveClass(/selected/);
  await expect(page.locator('#inspector h3')).toContainText('Key 1');
  await pick(page, 'Esc');
  await expect(key(page, 1).locator('.tap')).toHaveText('Esc');
  await expect(page.locator('#inspector input.raw')).toHaveValue('&kp ESC');
});

test('change behavior and params in the side panel', async ({ page }) => {
  await loadExample(page);
  await key(page, 2).click();
  await page.locator('#inspector select.behavior').selectOption('mt');
  await expect(page.locator('#inspector input.raw')).toHaveValue('&mt LSHIFT W');
  await page.locator('#inspector .field', { hasText: 'Modifier' }).locator('select').selectOption('LALT');
  await expect(page.locator('#inspector input.raw')).toHaveValue('&mt LALT W');
  await expect(key(page, 2).locator('.hold')).toHaveText('Alt');
  await page.locator('#inspector input.raw').fill('&lt 1 TAB');
  await page.locator('#inspector input.raw').press('Enter');
  await expect(key(page, 2).locator('.hold')).toHaveText('Lower');
});

test('keyboard shortcuts: arrows, delete, undo, redo', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await page.keyboard.press('ArrowRight');
  await expect(key(page, 2)).toHaveClass(/selected/);
  await page.keyboard.press('Delete');
  await expect(key(page, 2)).toHaveClass(/kind-none/);
  await page.keyboard.press('Control+z');
  await expect(key(page, 2).locator('.tap')).toHaveText('W');
  await page.keyboard.press('Control+Shift+z');
  await expect(key(page, 2)).toHaveClass(/kind-none/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#keyboard .key.selected')).toHaveCount(0);
});

test('layer add, rename, move and delete', async ({ page }) => {
  await loadExample(page);
  await page.getByTitle('Add layer').click();
  await expect(page.locator('.tab-list .tab.active')).toHaveText('3Layer 3');
  page.once('dialog', (d) => d.accept('Nav'));
  await page.getByTitle('Rename layer').click();
  await expect(page.locator('.tab-list .tab.active')).toHaveText('3Nav');
  await page.getByTitle('Move left').click();
  await expect(page.locator('.tab-list .tab.active')).toHaveText('2Nav');
  page.once('dialog', (d) => d.accept());
  await page.getByTitle('Delete layer').click();
  await expect(page.locator('.tab-list .tab:not(.add)')).toHaveText(['0Base', '1Lower', '2Raise']);
});

test('combos: create by clicking keys and assign a keycode', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: /Combos/ }).click();
  await key(page, 13).click();
  await key(page, 14).click();
  await pick(page, '⇥');
  await expect(key(page, 13)).toHaveClass(/combo-on/);
  await expect(page.locator('.combo-item.active')).toContainText('13 + 14');
  await expect(page.locator('.combo-item.active .combo-out')).toHaveText('⇥');
  await page.locator('.combo-editor .field', { hasText: 'Timeout' }).locator('input').fill('40');
  await page.locator('.combo-editor .field', { hasText: 'Timeout' }).locator('input').press('Enter');
  await page.locator('.combo-editor .chip', { hasText: 'Base' }).click();
  await expect(page.locator('.combo-editor .chip.on')).toHaveText('Base');
  await expect(page.locator('#status')).toContainText('2 combos');
  await page.getByRole('button', { name: 'Delete combo' }).click();
  await expect(page.locator('#status')).toContainText('1 combos');
});

test('autosave survives a reload', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await pick(page, 'Z');
  await page.waitForTimeout(500);
  await page.reload();
  await expect(key(page, 1).locator('.tap')).toHaveText('Z');
});

test('new keymap from rows', async ({ page }) => {
  await page.getByRole('button', { name: 'Start blank' }).click();
  await page.locator('dialog .field', { hasText: 'Keys per row' }).locator('input').fill('5, 5, 2');
  await page.locator('dialog .field', { hasText: 'Layers' }).locator('input').fill('2');
  await page.getByRole('button', { name: 'Create grid' }).click();
  await expect(keys(page)).toHaveCount(12);
  await expect(page.locator('.tab-list .tab:not(.add)')).toHaveCount(2);
});
