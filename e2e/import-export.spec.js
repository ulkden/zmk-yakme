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
  await page.getByRole('button', { name: 'Trim extra bindings' }).click();
  await expect(page.locator('#status')).toContainText('No issues');
});

test('layout files imported together are merged', async ({ page }) => {
  const alt = ELVN_LAYOUT.replace(/default_layout/g, 'alt_layout').replace('Default Layout', 'Alt Layout');
  await importFiles(page, [file('a.dtsi', ELVN_LAYOUT), file('b.dtsi', alt), file('elvn.keymap', ELVN_KEYMAP)]);
  await expect(page.locator('#status select option')).toHaveText(['Default Layout', 'Alt Layout']);
  await expect(keys(page)).toHaveCount(4);
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

test('export dialog downloads a valid keymap with an editable name', async ({ page }) => {
  await importFiles(page, [file('elvn.keymap', ELVN_KEYMAP)]);
  await key(page, 0).click();
  await page.locator('#inspector input.raw').fill('&kp ESC');
  await page.locator('#inspector input.raw').press('Enter');
  await page.getByRole('button', { name: 'Export…' }).click();
  const name = page.locator('dialog input.filename');
  await expect(name).toHaveValue('elvn.keymap');
  await name.fill('my-board');
  const dl = page.waitForEvent('download');
  await page.locator('dialog').getByRole('button', { name: 'Download' }).click();
  const download = await dl;
  expect(download.suggestedFilename()).toBe('my-board.keymap');
  const text = await readFile(await download.path(), 'utf8');
  expect(text).toContain('#include <behaviors.dtsi>');
  expect(text).toMatch(/&kp ESC\s+&kp B\n/);
  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(page.locator('dialog input.filename')).toHaveValue('my-board.keymap');
});

test('export dialog lists includes that will be added', async ({ page }) => {
  await importFiles(page, [file('elvn.keymap', ELVN_KEYMAP)]);
  await key(page, 0).click();
  await page.locator('#inspector input.raw').fill('&bt BT_CLR');
  await page.locator('#inspector input.raw').press('Enter');
  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(page.locator('dialog ul.notices')).toContainText('<dt-bindings/zmk/bt.h>');
  await expect(page.locator('dialog pre.preview')).toContainText('#include <dt-bindings/zmk/bt.h>');
});

test('export dialog previews the example keymap', async ({ page }) => {
  await loadExample(page);
  await page.getByRole('button', { name: 'Export…' }).click();
  const pre = page.locator('dialog pre.preview');
  await expect(pre).toContainText('compatible = "zmk,keymap";');
  await expect(pre).toContainText('combo_esc {');
  await expect(page.locator('dialog ul.notices')).not.toContainText('includes will be added');
  await expect(pre).toContainText('// Base');
  await page.getByLabel('Generate a layer diagram comment above each layer').uncheck();
  await expect(pre).not.toContainText('// Base');
  await expect(page.locator('dialog ul.notices')).toContainText('No comments are written');
  await page.locator('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(page.getByLabel('Generate a layer diagram comment above each layer')).not.toBeChecked();
  await page.locator('dialog').getByRole('button', { name: 'Close', exact: true }).click();
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
  await page.getByTitle('Layer settings', { exact: true }).click();
  await page.screenshot({ path: info.outputPath('05-layer-popover.png') });
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: /Combos/ }).click();
  await page.locator('.combo-item').first().click();
  await page.screenshot({ path: info.outputPath('03-combos.png'), fullPage: true });
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.screenshot({ path: info.outputPath('04-import.png') });
  await page.getByRole('button', { name: 'Cancel' }).click();
  await page.getByRole('button', { name: 'Export…' }).click();
  await page.locator('dialog pre.preview').evaluate((el) => (el.scrollTop = el.scrollHeight * 0.25));
  await page.screenshot({ path: info.outputPath('06-export.png') });
  await page.locator('dialog').getByRole('button', { name: 'Close', exact: true }).click();
  await page.getByRole('button', { name: /^Behaviors/ }).click();
  await page.getByRole('button', { name: '+ Hold-tap' }).click();
  await page.screenshot({ path: info.outputPath('07-behaviors.png') });
});
