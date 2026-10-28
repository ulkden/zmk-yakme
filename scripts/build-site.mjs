// Assemble the deployable site in _site/: only the files the app needs, with cache-busting
// version stamps. Usage: node scripts/build-site.mjs [outDir]
// Version: package.json version plus the short commit SHA (GITHUB_SHA in CI, else git HEAD).
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { join } from 'node:path';
import { stampFile } from './stamp.js';

const SITE_FILES = ['index.html', 'css', 'src', 'fonts', 'LICENSE'];
const TEXT = /\.(html|css|js)$/;

function siteVersion() {
  const { version } = JSON.parse(readFileSync('package.json', 'utf8'));
  let sha = process.env.GITHUB_SHA;
  if (!sha) {
    try {
      sha = execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim();
    } catch {
      sha = 'local';
    }
  }
  return `${version}+${sha.slice(0, 7)}`;
}

function* files(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) yield* files(path);
    else yield path;
  }
}

const out = process.argv[2] ?? '_site';
const version = siteVersion();
rmSync(out, { recursive: true, force: true });
mkdirSync(out, { recursive: true });
for (const entry of SITE_FILES) cpSync(entry, join(out, entry), { recursive: true });
let stamped = 0;
for (const path of files(out)) {
  if (!TEXT.test(path)) continue;
  const source = readFileSync(path, 'utf8');
  const next = stampFile(path, source, version);
  if (next !== source) {
    writeFileSync(path, next);
    stamped++;
  }
}
writeFileSync(join(out, '.nojekyll'), '');
console.log(`Built ${out}/ (version ${version}, ${stamped} files stamped)`);
