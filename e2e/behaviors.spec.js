import { test, expect, key, loadExample } from './helpers.js';
import { FULL_KEYMAP } from '../tests/fixtures/full-keymap.js';

const behaviorsTab = (page) => page.getByRole('button', { name: /^Behaviors \(/ });

async function exportText(page) {
  await page.getByRole('button', { name: 'Export…' }).click();
  const text = await page.locator('dialog pre.preview').textContent();
  await page.getByRole('button', { name: 'Close' }).click();
  return text;
}

test('create a hold-tap, use it on a key, and export it', async ({ page }) => {
  await loadExample(page);
  await behaviorsTab(page).click();
  await page.getByRole('button', { name: '+ Hold-tap' }).click();
  await expect(behaviorsTab(page)).toHaveText('Behaviors (1)');
  const panel = page.locator('#inspector');
  await panel.locator('[name="bh-label"]').fill('hm');
  await panel.locator('[name="bh-label"]').press('Enter');
  await panel.locator('[name="bh-term"]').fill('180');
  await panel.locator('[name="bh-term"]').press('Enter');
  await panel.locator('[name="bh-flavor"]').selectOption('tap-preferred');
  await expect(panel.locator('.combo-item.active')).toContainText('&hm');

  await page.locator('.tab-list .tab', { hasText: 'Base' }).click();
  await key(page, 13).click();
  await panel.locator('select.behavior').selectOption('hm');
  await expect(panel.locator('input.raw')).toHaveValue('&hm A A');
  await panel.locator('[name="param-0"]').fill('LSHIFT');
  await panel.locator('[name="param-0"]').press('Enter');
  await expect(panel.locator('input.raw')).toHaveValue('&hm LSHIFT A');

  await behaviorsTab(page).click();
  await expect(panel.locator('.combo-item.active')).toContainText('&hm');
  await expect(key(page, 13)).toHaveClass(/combo-on/);

  const text = await exportText(page);
  expect(text).toMatch(/hm: hm \{\s+compatible = "zmk,behavior-hold-tap";\s+#binding-cells = <2>;\s+flavor = "tap-preferred";\s+tapping-term-ms = <180>;\s+bindings = <&kp>, <&kp>;/);
  expect(text).toContain('&hm LSHIFT A');
});

test('edit an imported macro and mod-morph, rename updates references, delete clears uses', async ({ page }) => {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog textarea').fill(FULL_KEYMAP);
  await page.locator('dialog').getByRole('button', { name: 'Import', exact: true }).click();
  await behaviorsTab(page).click();
  const panel = page.locator('#inspector');
  await expect(panel.locator('.combo-item')).toHaveCount(2);
  await panel.locator('.combo-item', { hasText: '&hello' }).click();
  await panel.locator('[name="bh-steps"]').fill('&macro_tap\n&kp H\n&kp E\n&kp Y');
  await panel.locator('[name="bh-wait"]').click();
  await panel.locator('[name="bh-label"]').fill('hey');
  await panel.locator('[name="bh-label"]').press('Enter');
  let text = await exportText(page);
  expect(text).toContain('bindings = <&macro_tap &kp H &kp E &kp Y>;');
  expect(text).toContain('&hey');
  expect(text).not.toContain('&hello');

  await panel.getByRole('button', { name: '+ Mod-morph' }).click();
  const modsRow = panel.locator('.field', { has: page.locator('span', { hasText: /^Mods$/ }) });
  await modsRow.locator('.chip', { hasText: 'RShift' }).click();
  await expect(panel.locator('.chip.on')).toHaveText(['LShift']);

  await panel.locator('.combo-item', { hasText: '&hey' }).click();
  await panel.getByRole('button', { name: 'Delete behavior' }).click();
  await expect(panel).toContainText('Its 1 use(s) become &none.');
  await panel.getByRole('button', { name: 'Delete', exact: true }).click();
  text = await exportText(page);
  expect(text).not.toContain('hey');
  expect(text).toContain('mods = <(MOD_LSFT)>;');
});
