// GitHub URL handling and repository file listing for "import from repo".

const EXT = /\.(keymap|dtsi|overlay|json)$/i;

// The only hosts the app may contact (also enforced by the Content-Security-Policy in index.html).
export const ALLOWED_HOSTS = [
  'github.com',
  'api.github.com',
  'raw.githubusercontent.com',
  'gist.githubusercontent.com',
];

// True for https URLs on an allowed GitHub host.
export function isAllowedUrl(url) {
  try {
    const u = new URL(String(url).trim());
    return u.protocol === 'https:' && ALLOWED_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}

// Returns { kind: 'file' | 'repo', owner, repo, ref, path } or null for non-GitHub URLs.
export function parseGithubUrl(url) {
  const u = String(url ?? '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\.git$/, '');
  let m = /^https?:\/\/raw\.githubusercontent\.com\/([^/]+)\/([^/]+)\/([^/]+)\/(.+)$/.exec(u);
  if (m) return { kind: 'file', owner: m[1], repo: m[2], ref: m[3], path: m[4] };
  m = /^https?:\/\/github\.com\/([^/]+)\/([^/]+)(?:\/(blob|tree)\/([^/]+)(?:\/(.*))?)?$/.exec(u);
  if (!m) return null;
  const [, owner, repo, mode, ref = null, path = ''] = m;
  return { kind: mode === 'blob' ? 'file' : 'repo', owner, repo, ref, path };
}

export const rawUrl = ({ owner, repo, ref, path }) =>
  `https://raw.githubusercontent.com/${owner}/${repo}/${ref}/${path}`;

function isLayoutCandidate(path) {
  const name = path.split('/').pop().toLowerCase();
  return /layouts?\.dtsi$/.test(name) || name.includes('physical') || name === 'info.json' || name === 'keyboard.json';
}

// tree: GitHub git-tree entries. Returns [{ path, kind, selected }] for importable files under `base`.
export function repoFiles(tree, base = '') {
  const prefix = base ? `${base.replace(/\/$/, '')}/` : '';
  const files = tree
    .filter((e) => e.type === 'blob' && e.path.startsWith(prefix) && EXT.test(e.path))
    .map((e) => ({ path: e.path, kind: e.path.endsWith('.keymap') ? 'keymap' : 'layout' }));
  const keymaps = files.filter((f) => f.kind === 'keymap');
  const preferred = keymaps.filter((f) => f.path.startsWith('config/'));
  const pickKeymap = (preferred.length ? preferred : keymaps)[0]?.path;
  return files.map((f) => ({
    ...f,
    selected: f.path === pickKeymap || (f.kind === 'layout' && isLayoutCandidate(f.path)),
  }));
}

// Layouts first, so a keymap imported afterwards keeps the real layout instead of a grid.
export const importOrder = (paths) =>
  [...paths].sort((a, b) => (a.endsWith('.keymap') ? 1 : 0) - (b.endsWith('.keymap') ? 1 : 0));

async function getJson(fetchFn, url) {
  const res = await fetchFn(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (res.status === 403 || res.status === 429)
    throw new Error('GitHub API rate limit reached (60 requests/hour without sign-in). Try again later.');
  if (!res.ok)
    throw new Error(
      res.status === 404
        ? 'Repository or branch not found (only public repos are supported)'
        : `GitHub API error ${res.status}`,
    );
  return res.json();
}

// Lists the repository tree; resolves the default branch when no ref is given.
export async function listRepo(info, fetchFn = fetch) {
  const api = `https://api.github.com/repos/${info.owner}/${info.repo}`;
  const ref = info.ref ?? (await getJson(fetchFn, api)).default_branch;
  const tree = await getJson(fetchFn, `${api}/git/trees/${encodeURIComponent(ref)}?recursive=1`);
  return { ref, files: repoFiles(tree.tree ?? [], info.path), truncated: !!tree.truncated };
}
