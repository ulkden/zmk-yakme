// Combos by keyboard and screen reader (docs/ACCESSIBILITY.md, PR 5).
import { test, expect, key, loadExample } from './helpers.js';

const openCombos = (page) => page.getByRole('button', { name: /^Combos/ }).click();
const combo = (page) => page.getByRole('button', { name: 'combo_esc Esc 1 + 2' });

test('the selected combo and its layer chips say whether they are on', async ({ page }) => {
  await loadExample(page);
  await openCombos(page);
  await expect(combo(page)).toHaveAttribute('aria-pressed', 'false');
  await combo(page).click();
  await expect(combo(page)).toHaveAttribute('aria-pressed', 'true');
  const layers = page.getByRole('group', { name: 'Layers' });
  const base = layers.getByRole('button', { name: 'Base' });
  await expect(base).toHaveAttribute('aria-pressed', 'false');
  await base.click();
  await expect(base).toHaveAttribute('aria-pressed', 'true');
});

test('a combo can be built from the keyboard alone', async ({ page }) => {
  await loadExample(page);
  await openCombos(page);
  await page.getByRole('button', { name: '+ New Combo' }).click();
  await expect(page.locator('#inspector')).toContainText('move with the arrow keys and press Space');
  await key(page, 20).focus();
  await page.keyboard.press('Space');
  await page.keyboard.press('ArrowRight');
  await page.keyboard.press('Space');
  await expect(page.getByRole('button', { name: /^combo_2 .*20 \+ 21$/ })).toBeVisible();
});

test('Save Combo returns focus to that combo in the list', async ({ page }) => {
  await loadExample(page);
  await openCombos(page);
  await combo(page).click();
  await page.getByRole('button', { name: 'Save Combo' }).focus();
  await page.keyboard.press('Enter');
  await expect(combo(page)).toBeFocused();
  await expect(combo(page)).toHaveAttribute('aria-pressed', 'false');
});

test('in high-contrast mode the selected combo and on-chips fill with the highlight colour', async ({ page }) => {
  await page.emulateMedia({ forcedColors: 'active' });
  await loadExample(page);
  await openCombos(page);
  await combo(page).click();
  await page.getByRole('group', { name: 'Layers' }).getByRole('button', { name: 'Base' }).click();
  const highlight = await page.evaluate(() => {
    const probe = document.body.appendChild(document.createElement('div'));
    probe.style.cssText = 'forced-color-adjust: none; background: Highlight';
    const colour = getComputedStyle(probe).backgroundColor;
    probe.remove();
    return colour;
  });
  // The side panel re-renders a frame after the chip click, so a style read can hit the element being
  // replaced (an empty string): poll until the rendered state settles.
  const bg = (loc) => () => loc.evaluate((el) => getComputedStyle(el).backgroundColor);
  await expect.poll(bg(combo(page))).toBe(highlight);
  await expect.poll(bg(page.getByRole('button', { name: 'Base', pressed: true }))).toBe(highlight);
  await expect.poll(bg(page.getByRole('button', { name: 'Lower', pressed: false }))).not.toBe(highlight);
});

test('Esc from the combo editor also returns focus to the combo', async ({ page }) => {
  await loadExample(page);
  await openCombos(page);
  await combo(page).click();
  await page.getByRole('group', { name: 'Layers' }).getByRole('button', { name: 'Lower' }).focus();
  await page.keyboard.press('Escape');
  await expect(combo(page)).toBeFocused();
});
