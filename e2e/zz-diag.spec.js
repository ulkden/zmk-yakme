// TEMPORARY diagnostic (removed before merge): which elements make WebKit report CSP style errors?
import { test as base } from '@playwright/test';

const CASES = {
  select: '<select><option>a</option><option>b</option></select>',
  'input-list': '<input list="dl"><datalist id="dl"><option value="A"></option></datalist>',
  dialog: '<dialog open>x</dialog>',
  'input-number': '<input type="number" value="1">',
  'input-checkbox': '<input type="checkbox">',
  'input-file': '<input type="file">',
  textarea: '<textarea>x</textarea>',
  'details-summary': '<details><summary>s</summary>x</details>',
};

for (const [name, html] of Object.entries(CASES)) {
  base(`diag ${name}`, async ({ page }) => {
    const errors = [];
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.goto('/');
    await page.evaluate((markup) => {
      const t = document.createElement('template');
      t.innerHTML = markup; // eslint-disable-line no-restricted-properties -- temporary diagnostic with constant markup
      document.body.append(t.content);
    }, html);
    await page.waitForTimeout(300);
    console.log(`DIAG ${name}: ${errors.length ? 'CSP-ERROR ' + errors[0].slice(0, 80) : 'ok'}`);
  });
}
