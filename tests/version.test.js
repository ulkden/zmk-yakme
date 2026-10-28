import { describe, test } from 'node:test';
import assert from 'node:assert/strict';
import { VERSION, BUILD, releaseUrl } from '../src/data/project.js';

// Node reads package.json from disk; the browser test runner fetches it from the dev server.
async function packageJson() {
  const url = new URL('../package.json', import.meta.url);
  if (globalThis.process?.versions?.node)
    return JSON.parse(await (await import('node:fs/promises')).readFile(url, 'utf8'));
  return (await fetch(url)).json();
}

describe('app version', () => {
  test('matches package.json, so a release bumps both', async () => {
    assert.equal(VERSION, (await packageJson()).version);
  });

  test('is SemVer and links to its GitHub release', () => {
    assert.match(VERSION, /^\d+\.\d+\.\d+$/);
    assert.equal(releaseUrl('1.2.3'), 'https://github.com/ulkden/zmk-yakme/releases/tag/v1.2.3');
  });

  test('has no build commit in development', () => {
    assert.equal(BUILD, '');
  });
});
