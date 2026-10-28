import { test as base } from '@playwright/test';
import { test, expect } from './helpers.js';

test('URL import refuses non-GitHub hosts with a clear message', async ({ page }) => {
  await page.getByRole('button', { name: 'Import', exact: true }).click();
  await page.locator('dialog [name="import-url"]').fill('https://example.com/my.keymap');
  await page.locator('dialog').getByRole('button', { name: 'Import', exact: true }).click();
  await expect(page.locator('dialog .dialog-msg')).toContainText('only https links to GitHub');
});

// Uses plain Playwright: this test triggers CSP violations on purpose, which the shared
// fixture would report as console errors.
base('the Content-Security-Policy blocks other network hosts and inline scripts', async ({ page }) => {
  await page.goto('/');
  const result = await page.evaluate(async () => {
    const violated = [];
    // Browsers differ on script-src vs script-src-elem, so compare the base directive.
    document.addEventListener('securitypolicyviolation', (e) =>
      violated.push(e.effectiveDirective.replace(/-elem$/, '')),
    );
    // no-cors: without a CSP this would succeed (opaque response), so a rejection means the CSP blocked it.
    const blocked = await fetch('https://example.com/', { mode: 'no-cors' }).then(
      () => false,
      () => true,
    );
    const script = document.createElement('script');
    script.textContent = 'window.__inlineRan = true';
    document.body.append(script);
    await new Promise((r) => setTimeout(r, 100));
    return { blocked, inlineRan: !!window.__inlineRan, violated: [...new Set(violated)].sort() };
  });
  expect(result).toEqual({ blocked: true, inlineRan: false, violated: ['connect-src', 'script-src'] });
});
