// Turn KLE key legends into starting bindings.
import { LABELS, ALIASES, ALL_CODES } from '../data/keycodes.js';

const WORDS = {
  tab: 'TAB',
  enter: 'RET',
  return: 'RET',
  space: 'SPACE',
  spacebar: 'SPACE',
  backspace: 'BSPC',
  bksp: 'BSPC',
  shift: 'LSHIFT',
  lshift: 'LSHIFT',
  rshift: 'RSHIFT',
  ctrl: 'LCTRL',
  control: 'LCTRL',
  alt: 'LALT',
  option: 'LALT',
  opt: 'LALT',
  win: 'LGUI',
  cmd: 'LGUI',
  command: 'LGUI',
  super: 'LGUI',
  gui: 'LGUI',
  meta: 'LGUI',
  caps: 'CAPS',
  'caps lock': 'CAPS',
  esc: 'ESC',
  escape: 'ESC',
  del: 'DEL',
  delete: 'DEL',
  ins: 'INS',
  insert: 'INS',
  home: 'HOME',
  end: 'END',
  pgup: 'PG_UP',
  'page up': 'PG_UP',
  pgdn: 'PG_DN',
  'page down': 'PG_DN',
  menu: 'K_APP',
  app: 'K_APP',
  prtsc: 'PSCRN',
  'print screen': 'PSCRN',
  'prt sc': 'PSCRN',
};

const BY_LABEL = {};
for (const [code, label] of Object.entries(LABELS)) BY_LABEL[label.toLowerCase()] ??= code;

const clean = (s) =>
  String(s ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

export function legendToCode(legend) {
  const text = clean(legend);
  if (!text) return null;
  if (/^[a-z]$/i.test(text)) return text.toUpperCase();
  if (/^[0-9]$/.test(text)) return `N${text}`;
  const lower = text.toLowerCase();
  const upper = text.toUpperCase();
  if (WORDS[lower]) return WORDS[lower];
  if (ALL_CODES.includes(upper)) return upper;
  if (ALIASES[upper]) return ALIASES[upper];
  return BY_LABEL[lower] ?? null;
}

// KLE stores several legends per key separated by newlines. With two stacked legends
// (e.g. "!\n1") the lower one is the unshifted key, so it is tried first.
export function legendLines(raw) {
  const lines = String(raw ?? '').split('\n');
  const order = lines[0] && lines[1] ? [1, 0, ...lines.keys()] : [...lines.keys()];
  return [...new Set(order)].map((i) => lines[i]).filter((l) => clean(l));
}

export function legendToBinding(raw) {
  for (const line of legendLines(raw)) {
    const code = legendToCode(line);
    if (code) return `&kp ${code}`;
  }
  return '&none';
}
