// Check the editor against a ZMK checkout (normally zmkfirmware/zmk main), to notice when ZMK
// changes in ways the editor doesn't handle yet. Run by .github/workflows/zmk-drift.yml.
// Usage: node scripts/zmk-drift.mjs <path-to-zmk-checkout>
// Prints a Markdown report and exits with 1 when something needs attention.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, relative } from 'node:path';
import { parseDts, findNodes, propString } from '../src/dts/parse.js';
import { BEHAVIORS } from '../src/data/behaviors.js';
import { BOARDS, checkBoard, checkKeymapFile, checkLayoutFile, definesPhysicalLayout } from '../tests/zmk-checks.js';

// Built-in ZMK behaviors the editor deliberately leaves as raw bindings (they keep working).
const NOT_EDITABLE = new Set([
  'bl', // backlight
  'inc_dec_cp', // encoder rotation (sensor-bindings, not key bindings)
  'inc_dec_kp',
]);

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(path);
    else yield path;
  }
}

function zmkCommit(zmk) {
  try {
    return execFileSync('git', ['-C', zmk, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unknown';
  }
}

function boardSection(zmk) {
  const rows = [];
  const problems = [];
  for (const board of BOARDS) {
    const paths = [...board.layouts, board.keymap];
    const missing = paths.filter((p) => !existsSync(join(zmk, p)));
    const result = missing.length
      ? { problems: missing.map((p) => `${p} was moved or removed`) }
      : checkBoard(board, Object.fromEntries(paths.map((p) => [p, readFileSync(join(zmk, p), 'utf8')])));
    rows.push(
      `| ${board.name} | ${result.keys ?? '–'} | ${result.layers ?? '–'} | ${result.problems.length ? '❌' : '✅'} |`,
    );
    problems.push(...result.problems.map((p) => `${board.name}: ${p}`));
  }
  const table = ['| Board | Keys | Layers | Result |', '| --- | --- | --- | --- |', ...rows];
  return { title: 'Pinned boards', lines: table, problems };
}

const listNames = (names, max = 6) =>
  names
    .slice(0, max)
    .map((n) => `\`&${n}\``)
    .join(', ') + (names.length > max ? ` and ${names.length - max} more` : '');

function sweepSection(zmk) {
  const problems = [];
  const unknown = [];
  let keymaps = 0;
  let layouts = 0;
  for (const path of walk(join(zmk, 'app'))) {
    const rel = relative(zmk, path);
    const text = path.endsWith('.keymap') || /\.(dtsi|dts|overlay)$/.test(path) ? readFileSync(path, 'utf8') : '';
    if (path.endsWith('.keymap')) {
      const result = checkKeymapFile(text);
      if (result.skipped) continue;
      keymaps++;
      problems.push(...result.problems.map((p) => `${rel}: ${p}`));
      if (result.unknown.length) unknown.push(`- \`${rel}\`: ${listNames(result.unknown)}`);
    } else if (text && definesPhysicalLayout(text)) {
      layouts++;
      problems.push(...checkLayoutFile(text).problems.map((p) => `${rel}: ${p}`));
    }
  }
  const lines = [`Checked ${keymaps} keymaps and ${layouts} physical layout files.`];
  if (unknown.length)
    lines.push('', 'Behaviors neither built in nor defined in the file (they stay as raw bindings):', ...unknown);
  return { title: 'All keymaps and layouts', lines, problems };
}

// ZMK's own behavior definitions, to spot behaviors added since the editor last caught up.
function behaviorSection(zmk) {
  const dir = join(zmk, 'app/dts/behaviors');
  const known = new Set([...BEHAVIORS.map((b) => b.name), ...NOT_EDITABLE]);
  const labels = [];
  for (const path of walk(dir)) {
    const root = parseDts(readFileSync(path, 'utf8'));
    const nodes = findNodes(root, (n) => (propString(n, 'compatible') ?? '').startsWith('zmk,behavior-'));
    labels.push(...nodes.flatMap((n) => n.labels));
  }
  const added = labels.filter((l) => !known.has(l));
  const lines = [`Found ${labels.length} built-in behaviors; ${added.length} new to the editor.`];
  return { title: 'Built-in behaviors', lines, problems: added.map((l) => `new built-in behavior \`&${l}\``) };
}

function report(zmk, sections) {
  const problems = sections.flatMap((s) => s.problems);
  const out = [
    '# ZMK drift check',
    '',
    `ZMK commit: \`${zmkCommit(zmk)}\``,
    '',
    problems.length ? `**${problems.length} problem(s) need attention.**` : 'Everything passed.',
  ];
  for (const s of sections) {
    out.push('', `## ${s.title}`, '', ...s.lines);
    if (s.problems.length) out.push('', ...s.problems.map((p) => `- ❌ ${p}`));
  }
  return { text: out.join('\n') + '\n', failed: problems.length > 0 };
}

const zmk = process.argv[2];
if (!zmk || !existsSync(join(zmk, 'app'))) {
  console.error('Usage: node scripts/zmk-drift.mjs <path-to-zmk-checkout>');
  process.exit(2);
}
const { text, failed } = report(zmk, [boardSection(zmk), sweepSection(zmk), behaviorSection(zmk)]);
process.stdout.write(text);
process.exit(failed ? 1 : 0);
