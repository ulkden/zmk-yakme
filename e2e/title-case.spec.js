import { test, expect, key, loadExample } from './helpers.js';

// APA title case: capitalize every word except minor words of three letters or fewer (unless
// first); both parts of a hyphenated word are capitalized.
const MINOR = new Set('a an the and but for nor or so yet as at by in of off on per to up via'.split(' '));

function isTitleCase(text) {
  const words = text
    .split(/\s+/)
    .map((w) => w.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''))
    .filter(Boolean);
  return words.every((w, i) =>
    i > 0 && MINOR.has(w.toLowerCase()) ? w === w.toLowerCase() : w.split('-').every((p) => /^[A-Z0-9]/.test(p)),
  );
}

// Button labels only: keys, palette keycodes, tabs and chips show the user's data.
const labels = (page) =>
  page.locator('button:visible').evaluateAll((els) =>
    els
      .filter((el) => !el.matches('.key, .pk, .tab, .chip, .combo-item, .icon'))
      .map((el) => el.textContent.trim())
      .filter((t) => /[A-Za-z]/.test(t)),
  );

test('the title-case check itself', () => {
  for (const ok of ['Try the Example', 'Blank on Current Layout', '+ Hold-Tap', 'Export…', 'OK', '‹ Move Left'])
    expect(isTitleCase(ok), ok).toBe(true);
  for (const bad of ['Try the example', 'Close keymap', '+ Hold-tap', 'Open An Issue'])
    expect(isTitleCase(bad), bad).toBe(false);
});

test('every button label is in Title Case', async ({ page }) => {
  const seen = new Set();
  const collect = async () => (await labels(page)).forEach((t) => seen.add(t));
  const openAndClose = async (name, closeName = 'Cancel') => {
    await page.getByRole('button', { name, exact: true }).click();
    await collect();
    await page.locator('dialog').getByRole('button', { name: closeName, exact: true }).click();
  };

  await collect();
  await loadExample(page);
  await key(page, 1).click();
  await collect();
  await page.locator('.layer-edit').click();
  await page.getByRole('button', { name: 'Delete Layer' }).click();
  await collect();
  await page.keyboard.press('Escape');
  await page.locator('.tab.combos').click();
  await page.locator('.combo-item').first().click();
  await collect();
  await page.getByRole('button', { name: /^Behaviors \(/ }).click();
  await page.getByRole('button', { name: '+ Hold-Tap' }).click();
  await page.getByRole('button', { name: 'Delete Behavior' }).click();
  await collect();
  await openAndClose('Import');
  await page.getByRole('button', { name: 'New', exact: true }).click();
  await collect();
  await page.keyboard.press('Escape');
  await openAndClose('Export…', 'Close');
  await openAndClose('Close Keymap');

  const wrong = [...seen].filter((t) => !isTitleCase(t));
  expect(wrong, `Not in Title Case: ${wrong.join(' | ')}`).toEqual([]);
  expect(seen.size).toBeGreaterThan(20);
});
