// Screenshots for the user guide (docs/guide/img). Not part of the normal test run:
// `npm run screenshots` regenerates them after UI changes. Button names are matched
// case-insensitively so the script keeps working when labels change case.
import { test, expect, key } from './helpers.js';

const OUT = 'docs/guide/img';
const button = (scope, name) => scope.getByRole('button', { name: new RegExp(`^${name}$`, 'i') });

test.skip(!process.env.SCREENSHOTS, 'run with `npm run screenshots`');

test('user guide screenshots', async ({ page }) => {
  const shot = (name, target = page) => target.screenshot({ path: `${OUT}/${name}.png`, animations: 'disabled' });
  await shot('welcome', page.locator('.welcome'));

  await button(page, 'Try the Example').click();
  await key(page, 12).click();
  await shot('editor');
  await shot('key-panel', page.locator('#inspector'));

  await page.getByTitle('Layer settings', { exact: true }).click();
  await shot('layer-settings', page.locator('.layer-popover'));
  await page.keyboard.press('Escape');

  await page.locator('.tab.combos').click();
  await page.locator('.combo-item').first().click();
  await shot('combo');

  await page.getByRole('button', { name: /^Behaviors \(/ }).click();
  await button(page, '\\+ Hold-Tap').click();
  await shot('hold-tap', page.locator('#inspector'));

  await page.locator('.tab.combos').click();
  await button(page, '\\+ New Combo').click();
  await page.locator('#status button.warn').click();
  await shot('warnings', page.locator('#status'));

  await button(page, 'Import').click();
  await shot('import', page.locator('dialog'));
  await page.keyboard.press('Escape');

  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(page.locator('dialog pre.preview')).toBeVisible();
  await shot('export', page.locator('dialog'));
});
