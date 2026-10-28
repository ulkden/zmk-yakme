// TEMPORARY diagnostic (removed before merge): which step makes WebKit report CSP style errors?
import { test as base } from '@playwright/test';

async function setup(page, errors) {
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 60)));
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: 'Try the example' }).click();
  await page.locator('#keyboard .key').nth(41).waitFor();
}

base('diag A: select a key (behavior select appears)', async ({ page }) => {
  const errors = [];
  await setup(page, errors);
  await page.locator('#keyboard .key').nth(1).click();
  await page.waitForTimeout(500);
  console.log(`DIAG A after key click: ${errors.length} errors`);
  await page.locator('#inspector select.behavior').evaluate((el) => el.value);
  await page.waitForTimeout(300);
  console.log(`DIAG A after evaluate value: ${errors.length} errors`);
  await page.locator('#inspector input.raw').inputValue();
  await page.waitForTimeout(300);
  console.log(`DIAG A after inputValue: ${errors.length} errors`);
  await page.locator('#inspector select.behavior').focus();
  await page.waitForTimeout(300);
  console.log(`DIAG A after focus select: ${errors.length} errors`);
});

base('diag B: plain select vs optgroup inside the app page', async ({ page }) => {
  const errors = [];
  await setup(page, errors);
  await page.evaluate(() => {
    const s = document.createElement('select');
    const g = document.createElement('optgroup');
    g.label = 'G';
    g.append(new Option('x', 'x'));
    s.append(g);
    document.getElementById('inspector').append(s);
  });
  await page.waitForTimeout(500);
  console.log(`DIAG B optgroup select in inspector: ${errors.length} errors`);
  await page.evaluate(() => {
    const s = document.createElement('select');
    s.append(new Option('y', 'y'));
    document.getElementById('status').append(s);
  });
  await page.waitForTimeout(500);
  console.log(`DIAG B plain select in status: ${errors.length} errors`);
});
