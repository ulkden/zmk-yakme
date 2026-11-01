// Local static server for `npm run serve` and the Playwright tests; never used in production.
// Usage: node scripts/serve.mjs [port] [dir]   (defaults: 8080, the current folder)
// Replaces `python3 -m http.server`, whose listen backlog of 5 made macOS reset connections when
// several test browsers loaded the app's modules at once. Listens on 127.0.0.1 only.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { contentType, directoryRedirect, requestPath } from './serve-paths.js';

const HOST = '127.0.0.1';
const port = Number(process.argv[2] ?? 8080);
const root = resolve(process.argv[3] ?? '.');

const fileStat = async (path) => {
  const info = await stat(path).catch(() => null);
  return info?.isFile() ? info : null;
};

// The file to serve for a checked path (a folder serves its index.html), or null.
async function locate(path) {
  const full = resolve(root, path);
  // requestPath already refuses '..'; this keeps the server safe even if it ever changes.
  if (full !== root && !full.startsWith(root + sep)) return null;
  const info = await stat(full).catch(() => null);
  if (info?.isDirectory()) {
    const index = join(full, 'index.html');
    const indexInfo = await fileStat(index);
    return indexInfo ? { file: index, size: indexInfo.size, folder: true } : null;
  }
  return info?.isFile() ? { file: full, size: info.size, folder: false } : null;
}

function reply(res, status, headers = {}) {
  res.writeHead(status, { 'content-type': 'text/plain; charset=utf-8', 'cache-control': 'no-store', ...headers });
  res.end(status === 301 ? '' : `${status}\n`);
}

async function handle(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') return reply(res, 405, { allow: 'GET, HEAD' });
  const path = requestPath(req.url);
  const found = path === null ? null : await locate(path);
  if (!found) return reply(res, 404);
  const redirect = found.folder ? directoryRedirect(req.url, path) : null;
  if (redirect) return reply(res, 301, { location: redirect });
  // no-store: edits show up on a plain reload, as they would after a deploy's version stamps.
  res.writeHead(200, {
    'content-type': contentType(found.file),
    'content-length': found.size,
    'cache-control': 'no-store',
  });
  if (req.method === 'HEAD') return res.end();
  createReadStream(found.file)
    .on('error', () => res.destroy())
    .pipe(res);
}

createServer((req, res) =>
  handle(req, res).catch(() => {
    if (res.headersSent) res.destroy();
    else reply(res, 500);
  }),
).listen(port, HOST, () => console.log(`Serving ${root} at http://${HOST}:${port}/`));
