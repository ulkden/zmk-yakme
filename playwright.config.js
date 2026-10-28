import { defineConfig } from '@playwright/test';

// SITE_DIR serves a built site (e.g. _site from scripts/build-site.mjs) instead of the source tree.
const siteDir = process.env.SITE_DIR ?? '.';

export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1400, height: 900 },
    acceptDownloads: true,
  },
  webServer: {
    command: `python3 -m http.server 4173 --bind 127.0.0.1 --directory ${siteDir}`,
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    stdout: 'ignore',
    stderr: 'ignore',
  },
  // CI runs every browser; `npm run test:e2e` runs Chromium only, `npm run test:e2e:all` runs all three.
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
    { name: 'firefox', use: { browserName: 'firefox' } },
    { name: 'webkit', use: { browserName: 'webkit' } },
  ],
});
