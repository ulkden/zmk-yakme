import { test as base, expect } from '@playwright/test';

// Fails the test on any uncaught page error or console error.
export const test = base.extend({
  page: async ({ page }, use) => {
    const errors = [];
    page.on('pageerror', (err) => errors.push(`pageerror: ${err.message}`));
    // Network status lines ("Failed to load resource") are logged by the browser itself,
    // e.g. for mocked 404s; script errors still fail the test.
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !msg.text().startsWith('Failed to load resource')) errors.push(`console: ${msg.text()}`);
    });
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    await use(page);
    expect(errors, errors.join('\n')).toEqual([]);
  },
});

export { expect };

export const keys = (page) => page.locator('#keyboard .key');
export const key = (page, i) => keys(page).nth(i);

export async function loadExample(page) {
  await page.getByRole('button', { name: 'Try the example' }).click();
  await expect(keys(page)).toHaveCount(42);
}

export async function pick(page, label) {
  await page.locator('.palette .pk', { hasText: new RegExp(`^${label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`) }).first().click();
}
