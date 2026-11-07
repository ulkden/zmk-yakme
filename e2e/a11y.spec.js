// Automated accessibility checks (axe-core) of every main state and dialog, against WCAG 2.2 A
// and AA. Known gaps from the audit in docs/ACCESSIBILITY.md are listed below; each accessibility
// PR removes the ones it fixes. A new violation fails, and so does a known gap that no longer
// occurs, so the list never goes stale.
import AxeBuilder from '@axe-core/playwright';
import { test, expect, loadExample } from './helpers.js';

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22a', 'wcag22aa'];

// { rule, target: pattern for the element's CSS selector, row: audit row, pr: the PR that fixes it }
const KNOWN = [
  { rule: 'color-contrast', target: /\.idx$/, row: 'A5', pr: 3 },
  { rule: 'color-contrast', target: /\.info-box$/, row: 'A5', pr: 2 },
  { rule: 'color-contrast', target: /\.badge$/, row: 'A5', pr: 6 },
  { rule: 'color-contrast', target: /\.combo-item > \.muted$/, row: 'A5', pr: 6 },
  { rule: 'scrollable-region-focusable', target: /pre/, row: 'A6', pr: 8 },
];

async function scan(page, state, found) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  for (const v of violations)
    for (const node of v.nodes) found.push({ state, rule: v.id, target: node.target.join(' '), help: v.help });
}

const STATES = [
  ['welcome', async () => {}],
  ['editor', (page) => loadExample(page)],
  ['key selected', (page) => page.locator('#keyboard .key').nth(13).click()],
  ['layer settings', (page) => page.locator('.layer-edit').click()],
  [
    'combos',
    async (page) => {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: /^Combos/ }).click();
      await page.locator('.combo-item').first().click();
    },
  ],
  [
    'behaviors',
    async (page) => {
      await page.getByRole('button', { name: /^Behaviors/ }).click();
      await page.getByRole('button', { name: '+ Hold-Tap' }).click();
    },
  ],
  ['import dialog', (page) => page.getByRole('button', { name: 'Import', exact: true }).click()],
  [
    'export dialog',
    async (page) => {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Export…' }).click();
    },
  ],
  [
    'new dialog',
    async (page) => {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'New', exact: true }).click();
    },
  ],
  [
    'close dialog',
    async (page) => {
      await page.keyboard.press('Escape');
      await page.getByRole('button', { name: 'Close Keymap' }).click();
    },
  ],
];

test('no new WCAG 2.2 A/AA violations, and no stale known gaps', async ({ page }) => {
  // Ten full scans in a row: about 20 s alone in Firefox and WebKit, more while other tests run.
  test.slow();
  const found = [];
  for (const [state, enter] of STATES) {
    await test.step(state, async () => {
      await enter(page);
      await scan(page, state, found);
    });
  }
  const isKnown = (f) => KNOWN.some((k) => k.rule === f.rule && k.target.test(f.target));
  const fresh = found.filter((f) => !isKnown(f)).map((f) => `${f.state}: ${f.rule} at ${f.target} (${f.help})`);
  expect(fresh, 'new accessibility violations').toEqual([]);
  const stale = KNOWN.filter((k) => !found.some((f) => f.rule === k.rule && k.target.test(f.target)));
  expect(
    stale.map((k) => `${k.row} ${k.rule} ${k.target}`),
    'fixed: remove these from KNOWN',
  ).toEqual([]);
});
