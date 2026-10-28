import { readFile } from 'node:fs/promises';
import { test, expect, keys, key, loadExample } from './helpers.js';
import { ELVN_KEYMAP, ELVN_LAYOUT } from '../tests/fixtures/elvn.js';
import { FULL_KEYMAP } from '../tests/fixtures/full-keymap.js';

const file = (name, text) => ({ name, mimeType: 'text/plain', buffer: Buffer.from(text) });

async function importFiles(page, files) {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button', { name: 'Choose files…' }).click();
  await (await chooser).setFiles(files);
  await expect(page.locator('dialog[open]')).toHaveCount(0);
}

test('import a keymap file, then its physical layout', async ({ page }) => {
  await importFiles(page, [file('elvn.keymap', ELVN_KEYMAP)]);
  await expect(keys(page)).toHaveCount(11);
  await expect(page.locator('#status')).toContainText('Inferred grid');
  await importFiles(page, [file('elvn-layouts.dtsi', ELVN_LAYOUT)]);
  await expect(keys(page)).toHaveCount(4);
  await expect(page.locator('#status')).toContainText('Default Layout');
  await page.locator('#status button.warn').click();
  await expect(page.locator('#status .warnings')).toContainText('7 binding(s) beyond');
});

test('paste import detects keymap with combos and custom behaviors', async ({ page }) => {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog textarea').fill(FULL_KEYMAP);
  await page.locator('dialog').getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('.tab-list .tab:not(.add)')).toHaveText(['0Base', '1Lower']);
  await key(page, 1).click();
  await expect(page.locator('#inspector select.behavior')).toHaveValue('hm');
  await expect(page.locator('#status')).toContainText('2 combos');
});

test('import shows an error for unrecognized text', async ({ page }) => {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog textarea').fill('hello world');
  await page.locator('dialog').getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('dialog .dialog-msg')).toContainText('No physical layout or keymap');
});

test('drag and drop a file imports it', async ({ page }) => {
  const dt = await page.evaluateHandle((text) => {
    const d = new DataTransfer();
    d.items.add(new File([text], 'elvn.keymap', { type: 'text/plain' }));
    return d;
  }, ELVN_KEYMAP);
  await page.dispatchEvent('body', 'dragenter', { dataTransfer: dt });
  await expect(page.locator('#drop-overlay')).toHaveClass(/show/);
  await page.dispatchEvent('body', 'drop', { dataTransfer: dt });
  await expect(keys(page)).toHaveCount(11);
  await expect(page.locator('#drop-overlay')).not.toHaveClass(/show/);
});

test('download produces a valid keymap with edits', async ({ page }) => {
  await importFiles(page, [file('elvn.keymap', ELVN_KEYMAP)]);
  await key(page, 0).click();
  await page.locator('#inspector input.raw').fill('&kp ESC');
  await page.locator('#inspector input.raw').press('Enter');
  const dl = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download .keymap' }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toBe('elvn.keymap');
  const text = await readFile(await download.path(), 'utf8');
  expect(text).toContain('#include <behaviors.dtsi>');
  expect(text).toMatch(/&kp ESC\s+&kp B\n/);
  expect(text).toContain('display-name = "default_layer";');
});

test('preview dialog shows the generated keymap', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Preview' }).click();
  const pre = page.locator('dialog pre.preview');
  await expect(pre).toContainText('compatible = "zmk,keymap";');
  await expect(pre).toContainText('combo_esc {');
  await expect(pre).toContainText('#include <dt-bindings/zmk/bt.h>');
  await page.getByRole('button', { name: 'Close' }).click();
  await expect(page.locator('dialog[open]')).toHaveCount(0);
});

test('browser unit-test page passes', async ({ page }) => {
  await page.goto('/tests/');
  await expect(page.locator('#summary')).toHaveText(/\d+ passed, 0 failed/);
});

test('screenshots for visual review', async ({ page }, info) => {
  await page.screenshot({ path: info.outputPath('01-welcome.png') });
  await loadExample(page);
  await key(page, 12).click();
  await page.screenshot({ path: info.outputPath('02-editor.png'), fullPage: true });
  await page.getByRole('button', { name: /Combos/ }).click();
  await page.locator('.combo-item').first().click();
  await page.screenshot({ path: info.outputPath('03-combos.png'), fullPage: true });
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.screenshot({ path: info.outputPath('04-import.png') });
});
