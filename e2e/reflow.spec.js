// Reflow at 320 CSS px (WCAG 1.4.10; docs/ACCESSIBILITY.md, PR 9): the page never scrolls sideways.
// The keyboard diagram needs two dimensions, so it may scroll inside its own box.
import { test, expect, loadExample } from './helpers.js';

test('at 320 px wide the page does not scroll sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  for (const step of [async () => {}, () => loadExample(page)]) {
    await step();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(0);
  }
  for (const name of ['Import', 'Export…']) {
    await page.getByRole('button', { name, exact: true }).click();
    const dialogOverflow = await page
      .locator('dialog[open]')
      .evaluate((d) => d.getBoundingClientRect().right - innerWidth);
    expect(dialogOverflow, name).toBeLessThanOrEqual(0);
    await page.keyboard.press('Escape');
  }
});

test('at 320 px keys keep a 24 px target size, and the diagram scrolls inside its box', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await loadExample(page);
  const size = await page
    .locator('#keyboard .key')
    .first()
    .evaluate((el) => el.getBoundingClientRect().width);
  expect(size).toBeGreaterThanOrEqual(24);
  const kb = await page.locator('#keyboard').evaluate((el) => ({
    scroll: el.scrollWidth > el.clientWidth,
    h: el.clientHeight,
    board: el.querySelector('.board').offsetHeight,
  }));
  expect(kb.scroll).toBe(true);
  expect(kb.h).toBeGreaterThanOrEqual(kb.board);
});
