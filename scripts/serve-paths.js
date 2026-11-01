// Request-to-file mapping for scripts/serve.mjs, the local dev and test server.
// Pure string functions with no Node imports, so the unit tests also run in the browser test page.

const TEXT = 'text/plain; charset=utf-8';
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  // Browsers only run module scripts served with a JavaScript type.
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': TEXT,
  '.md': TEXT,
  '.keymap': TEXT,
  '.dtsi': TEXT,
  '.overlay': TEXT,
};

export function contentType(path) {
  const ext = /\.[^./]+$/.exec(path)?.[0].toLowerCase();
  return TYPES[ext] ?? 'application/octet-stream';
}

const pathnameOf = (target) => target.split(/[?#]/)[0];

// The path below the served folder that a request target names ('' for the folder itself), or null
// when it must not be served: outside the folder, hidden (.git, .env), malformed or not a local path.
export function requestPath(target) {
  let decoded;
  try {
    decoded = decodeURIComponent(pathnameOf(target));
  } catch {
    return null;
  }
  if (!decoded.startsWith('/') || decoded.includes('\0') || decoded.includes('\\')) return null;
  const segments = decoded.split('/').filter((s) => s !== '' && s !== '.');
  if (segments.some((s) => s.startsWith('.'))) return null;
  return segments.join('/');
}

// Where to redirect a folder requested without its trailing slash (relative URLs in its index.html
// resolve against it), or null when no redirect is needed. Built from the checked path, never from the
// raw target, so '//host' can't become an off-site redirect.
export function directoryRedirect(target, path) {
  if (pathnameOf(target).endsWith('/')) return null;
  const query = /\?[^#]*/.exec(target)?.[0] ?? '';
  const encoded = path.split('/').map(encodeURIComponent).join('/');
  return `/${encoded}/${query}`;
}
