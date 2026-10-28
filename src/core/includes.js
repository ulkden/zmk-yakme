// Header files needed by the behaviors used in a keymap.
import { parseBinding } from './bindings.js';

const BASE = ['behaviors.dtsi', 'dt-bindings/zmk/keys.h'];

const HEADER_FOR = {
  bt: 'dt-bindings/zmk/bt.h',
  out: 'dt-bindings/zmk/outputs.h',
  rgb_ug: 'dt-bindings/zmk/rgb.h',
  ext_power: 'dt-bindings/zmk/ext_power.h',
  bl: 'dt-bindings/zmk/backlight.h',
  mkp: 'dt-bindings/zmk/pointing.h',
  mmv: 'dt-bindings/zmk/pointing.h',
  msc: 'dt-bindings/zmk/pointing.h',
};

export function requiredIncludes(bindings) {
  const out = [...BASE];
  for (const b of bindings) {
    const header = HEADER_FOR[parseBinding(b).behavior];
    if (header && !out.includes(header)) out.push(header);
  }
  return out;
}

export function ensureIncludes(text, includes) {
  const missing = includes.filter((inc) => !new RegExp(`#include\\s*[<"]${escapeRe(inc)}[>"]`).test(text));
  if (!missing.length) return text;
  const lines = missing.map((inc) => `#include <${inc}>`).join('\n');
  const re = /^[ \t]*#include[^\n]*\n/gm;
  let lastEnd = -1;
  for (let m; (m = re.exec(text)); ) lastEnd = m.index + m[0].length;
  if (lastEnd < 0) return `${lines}\n\n${text}`;
  return text.slice(0, lastEnd) + lines + '\n' + text.slice(lastEnd);
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
}
