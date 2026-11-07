// Reflow at 320 CSS px (WCAG 1.4.10; docs/ACCESSIBILITY.md, PR 9): nothing scrolls sideways except
// the keyboard diagram, which needs two dimensions and scrolls inside its own box.
import { test, expect, loadExample } from './helpers.js';

// Every element that scrolls sideways, other than the keyboard diagram.
const sidewaysScrollers = (page) =>
  page.evaluate(() =>
    [document.documentElement, ...document.querySelectorAll('body *')]
      .filter((el) => el.id !== 'keyboard' && el.scrollWidth > el.clientWidth + 1)
      .filter((el) => el === document.documentElement || /auto|scroll/.test(getComputedStyle(el).overflowX))
      .map((el) => el.id || el.className || el.tagName),
  );

test('at 320 px only the keyboard diagram scrolls sideways', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  expect(await sidewaysScrollers(page)).toEqual([]);
  await loadExample(page);
  expect(await sidewaysScrollers(page)).toEqual([]);
  for (const name of ['Import', 'Export…']) {
    await page.getByRole('button', { name, exact: true }).click();
    const dialog = page.locator('dialog[open]');
    expect(await dialog.evaluate((d) => d.getBoundingClientRect().right - innerWidth), name).toBeLessThanOrEqual(0);
    // The export preview may scroll sideways: it is code, which WCAG exempts like the diagram.
    expect(
      (await sidewaysScrollers(page)).filter((s) => !/preview/.test(s)),
      name,
    ).toEqual([]);
    await page.keyboard.press('Escape');
  }
});

test('at 320 px every key keeps its size, and the diagram scrolls inside its box', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await loadExample(page);
  const sizes = await page.locator('#keyboard .key').evaluateAll((els) => els.map((el) => el.offsetWidth));
  expect(Math.min(...sizes)).toBeGreaterThanOrEqual(36);
  const kb = await page.locator('#keyboard').evaluate((el) => ({
    scrolls: el.scrollWidth > el.clientWidth,
    fits: el.clientHeight >= el.querySelector('.board').offsetHeight,
  }));
  expect(kb).toEqual({ scrolls: true, fits: true });
});

test('a key selected from the side panel is scrolled into view', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 });
  await loadExample(page);
  await page.getByRole('button', { name: /^Combos/ }).click();
  await page.locator('.combo-item').first().click();
  await page.getByRole('tab', { name: '0 Base' }).click();
  await page.locator('#keyboard').evaluate((el) => (el.scrollLeft = el.scrollWidth));
  await page
    .locator('#keyboard .key')
    .nth(1)
    .evaluate((el) => el.click());
  const visible = await page
    .locator('#keyboard .key')
    .nth(1)
    .evaluate((key) => {
      const box = key.getBoundingClientRect();
      const view = document.getElementById('keyboard').getBoundingClientRect();
      return box.left >= view.left && box.right <= view.right;
    });
  expect(visible).toBe(true);
});

test('wider windows still shrink a wide board to fit', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await loadExample(page);
  const kb = await page.locator('#keyboard').evaluate((el) => el.scrollWidth <= el.clientWidth);
  expect(kb).toBe(true);
  expect(await sidewaysScrollers(page)).toEqual([]);
});
