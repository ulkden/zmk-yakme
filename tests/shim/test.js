// Minimal browser stand-in for `node:test` so the same test files run in
// Node (`npm test`) and in the browser (tests/index.html via an import map).
const registry = [];
const stack = [];

export function describe(name, fn) {
  stack.push(name);
  try {
    fn();
  } finally {
    stack.pop();
  }
}

export function test(name, fn) {
  registry.push({ name: [...stack, name].join(' › '), fn });
}

export const it = test;

export async function run(report) {
  let passed = 0;
  let failed = 0;
  for (const t of registry) {
    try {
      await t.fn();
      passed++;
      report({ name: t.name, ok: true });
    } catch (err) {
      failed++;
      report({ name: t.name, ok: false, err });
    }
  }
  return { passed, failed };
}
