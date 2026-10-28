// Smoke test for the deployable site. In CI it also runs against the built _site/
// (SITE_DIR=_site), where every local file must be requested with the version stamp.
import { test, expect, key, loadExample, pick } from './helpers.js';
import { VERSION, releaseUrl } from '../src/data/project.js';

const built = !!process.env.SITE_DIR;

test('@smoke the app loads, edits and exports', async ({ page }) => {
  const unstamped = [];
  page.on('request', (req) => {
    const url = new URL(req.url());
    if (url.hostname === '127.0.0.1' && /\.(js|css|woff2)$/.test(url.pathname) && !url.searchParams.has('v'))
      unstamped.push(url.pathname);
  });
  await page.reload();
  await loadExample(page);
  await key(page, 1).click();
  await pick(page, 'Z');
  await page.getByRole('button', { name: 'Export…' }).click();
  await expect(page.locator('dialog pre.preview')).toContainText('&kp Z');
  if (built) expect(unstamped, `requested without ?v=: ${unstamped.join(', ')}`).toEqual([]);
});

test('@smoke the version is shown and links to its release notes', async ({ page }) => {
  const welcome = page.locator('.version-line');
  await expect(welcome).toHaveText(`v${VERSION} · Release notes`);
  await expect(welcome.getByRole('link')).toHaveAttribute('href', releaseUrl());
  await loadExample(page);
  const status = page.locator('#status a.version');
  await expect(status).toHaveText(`v${VERSION}`);
  await expect(status).toHaveAttribute('href', releaseUrl());
  // The deployed site also names the commit it was built from.
  await expect(status).toHaveAttribute('title', built ? /\(build [0-9a-f]{7}\)$/ : `Release notes for v${VERSION}`);
});
