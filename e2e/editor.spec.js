import { test, expect, keys, key, loadExample, pick } from './helpers.js';

test('welcome screen, then example loads with layers and status', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'ZMK Keymap Editor' })).toBeVisible();
  await expect(page.locator('#inspector')).toBeHidden();
  await loadExample(page);
  await expect(page.locator('.tab-list .tab:not(.add)')).toHaveText(['0Base', '1Lower', '2Raise']);
  await expect(page.locator('#status')).toContainText('42 keys · 3 layers · 1 combos');
  await expect(page.locator('#status .status-layout')).toContainText('Physical Layouts:');
  await expect(page.locator('#status')).toContainText('No issues');
  await expect(key(page, 1).locator('.tap')).toHaveText('Q');
  await expect(key(page, 12).locator('.hold')).toHaveText('Ctrl');
});

test('bundled monospace font loads for key labels', async ({ page }) => {
  await loadExample(page);
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('600 13px "JetBrains Mono"'))).toBe(true);
  // A retrying assertion, not a one-off read: WebKit re-renders the keyboard once just after it first
  // appears (its width changes), and a read that lands on the replaced key sees an empty font-family.
  await expect(key(page, 1).locator('.tap')).toHaveCSS('font-family', /JetBrains Mono/);
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

test('tabbing between combo fields keeps focus', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: /Combos/ }).click();
  await page.locator('.combo-item').first().click();
  await page.locator('[name="combo-timeout"]').fill('35');
  await page.keyboard.press('Tab');
  await expect(page.locator('[name="combo-idle"]')).toBeFocused();
  await expect(page.locator('[name="combo-timeout"]')).toHaveValue('35');
});

test('keyboard shortcuts: spatial arrows, delete, undo, redo', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await page.keyboard.press('ArrowRight');
  await expect(key(page, 2)).toHaveClass(/selected/);
  await page.keyboard.press('ArrowDown');
  await expect(key(page, 14)).toHaveClass(/selected/);
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('Delete');
  await expect(key(page, 2)).toHaveClass(/kind-none/);
  await page.keyboard.press('Control+z');
  await expect(key(page, 2).locator('.tap')).toHaveText('W');
  await page.keyboard.press('Control+Shift+z');
  await expect(key(page, 2)).toHaveClass(/kind-none/);
  await page.keyboard.press('Escape');
  await expect(page.locator('#keyboard .key.selected')).toHaveCount(0);
});

test('type-to-assign follows the auto-advance setting', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await page.keyboard.press('x');
  await expect(key(page, 1).locator('.tap')).toHaveText('X');
  await expect(key(page, 1)).toHaveClass(/selected/);
  await page.getByLabel('Advance to next key after picking a keycode').check();
  await key(page, 3).click();
  await page.keyboard.press('7');
  await expect(key(page, 3).locator('.tap')).toHaveText('7');
  await expect(key(page, 4)).toHaveClass(/selected/);
});

test('layer settings popover: rename, node name, move and delete', async ({ page }) => {
  await loadExample(page);
  await page.getByTitle('Add layer').click();
  await expect(page.locator('.tab-list .tab.active')).toHaveText('3Layer 3');
  await page.getByTitle('Layer settings', { exact: true }).click();
  const pop = page.locator('.layer-popover');
  await pop.locator('[name="layer-name"]').fill('Nav');
  await pop.locator('[name="layer-id"]').click();
  await expect(page.locator('.tab-list .tab.active')).toHaveText('3Nav');
  await expect(pop.locator('[name="layer-id"]')).toBeFocused();
  await pop.locator('[name="layer-id"]').fill('Nav Layer!');
  await pop.locator('[name="layer-id"]').press('Enter');
  await expect(pop.locator('[name="layer-id"]')).toHaveValue('nav_layer');
  await pop.getByRole('button', { name: '‹ Move Left' }).click();
  await expect(page.locator('.tab-list .tab.active')).toHaveText('2Nav');
  await pop.getByRole('button', { name: 'Delete Layer' }).click();
  await expect(pop).toContainText('Delete "Nav"?');
  await pop.getByRole('button', { name: 'Delete', exact: true }).click();
  await expect(page.locator('.tab-list .tab:not(.add)')).toHaveText(['0Base', '1Lower', '2Raise']);
  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(page.locator('dialog pre.preview')).not.toContainText('nav_layer');
});

test('layer popover opens on double-click and closes with Escape or outside click', async ({ page }) => {
  await loadExample(page);
  await page.locator('.tab-list .tab.active').dblclick();
  await expect(page.locator('.layer-popover')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.layer-popover')).toHaveCount(0);
  await page.getByTitle('Layer settings', { exact: true }).click();
  await key(page, 5).click();
  await expect(page.locator('.layer-popover')).toHaveCount(0);
});

test('combos: create by clicking keys and assign a keycode', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: /Combos/ }).click();
  await key(page, 13).click();
  await expect(page.locator('#status')).toContainText('1 combos');
  await page.getByRole('button', { name: '+ New Combo' }).click();
  await key(page, 13).click();
  await key(page, 14).click();
  await pick(page, '⇥');
  await expect(key(page, 13)).toHaveClass(/combo-on/);
  await expect(page.locator('.combo-item.active .key-chip')).toHaveText(['13', '14']);
  await expect(page.locator('.combo-item.active .combo-keys')).toHaveText('13+14');
  await expect(page.locator('.combo-item.active .combo-plus')).toHaveCount(1);
  await expect(page.locator('.combo-item.active .combo-out')).toHaveText('⇥');
  await page.locator('.combo-editor .field', { hasText: 'Timeout' }).locator('input').fill('40');
  await page.locator('.combo-editor .field', { hasText: 'Timeout' }).locator('input').press('Enter');
  await page.locator('.combo-editor [name="combo-idle"]').fill('150');
  await page.locator('.combo-editor [name="combo-idle"]').press('Enter');
  await page.getByLabel('Slow release').check();
  await page.locator('.combo-editor .chip', { hasText: 'Base' }).click();
  await expect(page.locator('.combo-editor .chip.on')).toHaveText('Base');
  await page.getByRole('button', { name: 'Export…' }).click();
  const pre = page.locator('dialog pre.preview');
  await expect(pre).toContainText('require-prior-idle-ms = <150>;');
  await expect(pre).toContainText('slow-release;');
  await expect(pre).toContainText('timeout-ms = <40>;');
  await page.locator('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await expect(page.locator('#status')).toContainText('2 combos');
  await page.getByRole('button', { name: 'Delete Combo' }).click();
  await expect(page.locator('#status')).toContainText('1 combos');
});

test('auto-advance preference survives a reload', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  await page.getByLabel('Advance to next key after picking a keycode').check();
  await page.reload();
  await key(page, 1).click();
  await expect(page.getByLabel('Advance to next key after picking a keycode')).toBeChecked();
  await pick(page, 'Z');
  await expect(key(page, 2)).toHaveClass(/selected/);
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
  await page.getByRole('button', { name: 'Start Blank' }).click();
  await page.locator('dialog .field', { hasText: 'Keys per row' }).locator('input').fill('5, 5, 2');
  await page.locator('dialog .field', { hasText: 'Layers' }).locator('input').fill('2');
  await page.getByRole('button', { name: 'Create Grid' }).click();
  await expect(keys(page)).toHaveCount(12);
  await expect(page.locator('.tab-list .tab:not(.add)')).toHaveCount(2);
});

test('the mouse wheel steps a focused number field, as one undo step', async ({ page }) => {
  await loadExample(page);
  await page.locator('.tab.combos').click();
  await page.locator('.combo-item').first().click();
  const timeout = page.locator('[name="combo-timeout"]');
  await timeout.hover();
  await page.mouse.wheel(0, -100);
  await expect(timeout).toHaveValue('50'); // not focused: left alone
  await timeout.focus();
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, -100);
  await page.mouse.wheel(0, 100);
  await expect(timeout).toHaveValue('60');

  const idle = page.locator('[name="combo-idle"]');
  await idle.focus();
  await idle.hover();
  await page.mouse.wheel(0, -100);
  await expect(idle).toHaveValue(''); // empty means "off": left alone

  await page.locator('#inspector h3').click();
  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(page.locator('dialog pre.preview')).toContainText('timeout-ms = <60>;');
  await page.keyboard.press('Escape');
  await page.keyboard.press('Control+z');
  await expect(timeout).toHaveValue('50');
});

test('the New dialog layer count steps by one with the wheel', async ({ page }) => {
  await page.getByRole('button', { name: 'New', exact: true }).click();
  const layers = page.locator('dialog [name="layers"]');
  await layers.focus();
  await layers.hover();
  await page.mouse.wheel(0, -100);
  await expect(layers).toHaveValue('4');
  await layers.fill('32');
  await page.mouse.wheel(0, -100);
  await expect(layers).toHaveValue('32');
});

test('Save Combo keeps a value typed without pressing Enter', async ({ page }) => {
  await loadExample(page);
  await page.locator('.tab.combos').click();
  await page.locator('.combo-item').first().click();
  await page.locator('#inspector [name="combo-timeout"]').fill('70');
  await page.getByRole('button', { name: 'Save Combo' }).click();
  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(page.locator('dialog pre.preview')).toContainText('timeout-ms = <70>;');
});

test('Save Combo and Esc finish editing a combo', async ({ page }) => {
  await loadExample(page);
  await page.locator('.tab.combos').click();
  await page.locator('.combo-item').first().click();
  await page.getByRole('button', { name: 'Save Combo' }).click();
  await expect(page.locator('.combo-item.active')).toHaveCount(0);
  await expect(page.locator('#inspector')).toContainText('Select a combo');
  await page.locator('.combo-item').first().click();
  await expect(page.locator('.combo-item.active')).toHaveCount(1);
  await page.keyboard.press('Escape');
  await expect(page.locator('.combo-item.active')).toHaveCount(0);
});

test('with reduced motion, new warnings get a brief highlight instead of the pulse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await loadExample(page);
  await page.locator('.tab.combos').click();
  await page.getByRole('button', { name: '+ New Combo' }).click();
  const warn = page.locator('#status button.warn');
  await expect(warn).toHaveCSS('animation-name', 'warn-highlight');
  await expect(warn).not.toHaveClass(/pulse/, { timeout: 3000 });
});

test('new warnings pulse once; Clear Warnings hides them until a new one appears', async ({ page }) => {
  await loadExample(page);
  const status = page.locator('#status');
  await expect(status).toContainText('No issues');
  await page.locator('.tab.combos').click();
  await page.getByRole('button', { name: '+ New Combo' }).click();
  await expect(status.locator('button.warn')).toHaveText('⚠ 1 warning');
  await expect(status.locator('button.warn')).toHaveClass(/pulse/);
  await expect(status.locator('button.warn')).not.toHaveClass(/pulse/, { timeout: 3000 });

  await status.locator('button.warn').click();
  await status.getByRole('button', { name: 'Clear Warnings' }).click();
  await expect(status).toContainText('No new issues');
  await expect(status.getByRole('button', { name: '1 hidden' })).toBeVisible();
  await key(page, 5).click(); // the same warning still applies: it stays hidden
  await expect(status.locator('button.warn')).toHaveCount(0);

  await page.getByRole('button', { name: '+ New Combo' }).click();
  await expect(status.locator('button.warn')).toHaveText('⚠ 1 warning');
  await expect(status.locator('button.warn')).toHaveClass(/pulse/);
  await status.getByRole('button', { name: '1 hidden' }).click();
  await expect(status.locator('button.warn')).toHaveText('⚠ 2 warnings');
  await expect(status.locator('ul.warnings li')).toHaveCount(2);
});

test('the keycode filter clears with its ✕ or Esc, keeping the selected key', async ({ page }) => {
  await loadExample(page);
  await key(page, 1).click();
  const filter = page.getByLabel('Filter keycodes');
  const clear = page.getByRole('button', { name: 'Clear filter' });
  await expect(clear).toBeHidden();
  const all = await page.locator('.palette .pk').count();
  await filter.fill('vol');
  await expect(clear).toBeVisible();
  expect(await page.locator('.palette .pk').count()).toBeLessThan(all);
  await clear.click();
  await expect(filter).toHaveValue('');
  await expect(filter).toBeFocused();
  await expect(page.locator('.palette .pk')).toHaveCount(all);
  await filter.fill('vol');
  await filter.press('Escape');
  await expect(filter).toHaveValue('');
  await expect(clear).toBeHidden();
  await expect(page.locator('.palette .pk')).toHaveCount(all);
  await expect(key(page, 1)).toHaveClass(/selected/);
});
