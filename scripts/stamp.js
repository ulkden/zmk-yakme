// Cache-busting for the deployed site: append `?v=<version>` to every local module, stylesheet
// and font URL, so a new deploy never mixes freshly fetched files with browser-cached old ones.
// Pure string functions; scripts/build-site.mjs applies them to the copied files.

const withVersion = (url, version) => `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`;
const isLocal = (url) => !/^([a-z]+:)?\/\//i.test(url) && !url.startsWith('data:') && !url.startsWith('#');

// import … from './x.js' / import './x.js' / export … from './x.js'
export function stampJs(source, version) {
  return source.replace(
    /(\b(?:import|from)\s*)(['"])(\.{1,2}\/[^'"]+?\.js)\2/g,
    (_, kw, q, url) => `${kw}${q}${withVersion(url, version)}${q}`,
  );
}

// url('../fonts/x.woff2') in stylesheets
export function stampCss(source, version) {
  return source.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, url) =>
    isLocal(url) ? `url(${q}${withVersion(url, version)}${q})` : m,
  );
}

// <script src> and <link href> pointing at local files
export function stampHtml(source, version) {
  return source.replace(/(<(?:script|link)\b[^>]*?\s(?:src|href)=)(["'])([^"']+)\2/g, (m, head, q, url) =>
    isLocal(url) ? `${head}${q}${withVersion(url, version)}${q}` : m,
  );
}

export function stampFile(path, source, version) {
  if (path.endsWith('.js')) return stampJs(source, version);
  if (path.endsWith('.css')) return stampCss(source, version);
  if (path.endsWith('.html')) return stampHtml(source, version);
  return source;
}
