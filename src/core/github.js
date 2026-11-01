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

// ZMK's standard zmk-config folders (config/ for keymaps, boards/ for custom shields) belong to one
// keyboard, so they never start a group of their own.
const SHARED_FOLDERS = new Set(['config', 'boards']);

// The top-level folder (below the listed one) a path belongs to, or '' for shared and loose files.
function topFolder(path, prefix) {
  const rel = path.slice(prefix.length);
  const top = rel.includes('/') ? rel.slice(0, rel.indexOf('/')) : '';
  return SHARED_FOLDERS.has(top) ? '' : top;
}

// tree: GitHub git-tree entries. Returns [{ path, kind, folder, label, selected, relevant }] for importable
// files under `base`. `relevant` marks keymaps and likely layouts: the picker lists only those at
// first, since the rest (split-half overlays, shield .dtsi, editor settings) are rarely wanted.
// When keymaps sit in two or more top-level folders, the repository holds several keyboards:
// `folder` names each file's keyboard (`label` is the path inside it), and only the chosen keymap's own
// layouts are preselected.
export function repoFiles(tree, base = '') {
  const prefix = base ? `${base.replace(/\/$/, '')}/` : '';
  const files = tree
    .filter((e) => e.type === 'blob' && e.path.startsWith(prefix) && EXT.test(e.path))
    .map((e) => ({
      path: e.path,
      kind: e.path.endsWith('.keymap') ? 'keymap' : 'layout',
      folder: topFolder(e.path, prefix),
    }));
  const keymaps = files.filter((f) => f.kind === 'keymap');
  const grouped = new Set(keymaps.map((f) => f.folder).filter(Boolean)).size > 1;
  if (!grouped) files.forEach((f) => (f.folder = ''));
  const preferred = keymaps.filter((f) => f.path.startsWith('config/'));
  const pick = (preferred.length ? preferred : keymaps)[0];
  const isPickedLayout = (f) => isLayoutCandidate(f.path) && (!grouped || f.folder === pick.folder);
  return files.map((f) => ({
    ...f,
    label: f.folder ? f.path.slice(prefix.length + f.folder.length + 1) : f.path,
    selected: f === pick || (f.kind === 'layout' && isPickedLayout(f)),
    relevant: f.kind === 'keymap' || isLayoutCandidate(f.path),
  }));
}

// Files in display order: loose and shared files first (folder ''), then one group per keyboard folder.
export function groupRepoFiles(files) {
  const groups = new Map([['', []]]);
  for (const f of files) {
    if (!groups.has(f.folder)) groups.set(f.folder, []);
    groups.get(f.folder).push(f);
  }
  return [...groups].filter(([, list]) => list.length).map(([folder, list]) => ({ folder, files: list }));
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
