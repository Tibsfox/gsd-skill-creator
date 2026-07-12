// Ratchet drift-guard for the knip dead-code ceiling.
// Mirrors the module-reachability orphan ratchet: the meaningful dead-code
// count (unused source files + unused deps, barrel re-exports ignored in
// knip.ts) may only shrink. A NEW dead file/dep pushes the count over the
// seeded ceiling and fails here — forcing a wire-or-delete decision instead of
// silent accumulation (the failure mode of `npm run deadcode`'s --no-exit-code).
// Runs under vitest.tools.config.mjs (pre-tag-gate step "tools-suite" + CI).
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DEFAULT_CEILING } from '../check-deadcode-ceiling.mjs';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TOOL = join(REPO, 'tools', 'check-deadcode-ceiling.mjs');

function runJson(extraArgs = []) {
  const out = execFileSync('node', [TOOL, '--json', ...extraArgs], {
    cwd: REPO,
    encoding: 'utf8',
    maxBuffer: 32 * 1024 * 1024,
  });
  return JSON.parse(out);
}

describe('deadcode ceiling — knip ratchet', () => {
  // One knip run at describe scope (runJson uses execFileSync, which THROWS on a
  // non-zero exit — so this line also proves the CLI exits 0 within the default
  // ceiling today). Reused across the count assertions to keep knip runs cheap.
  const report = runJson();

  it('meaningful dead-code count stays at or below the seeded ceiling', () => {
    // The ratchet floor. If this fails, either wire/delete the new dead code or
    // (if it is legitimately parked) raise DEFAULT_CEILING with a note.
    expect(report.count).toBeLessThanOrEqual(DEFAULT_CEILING);
  });

  it('the barrel-ignore is effective — count is small, not the ~66 raw findings', () => {
    // A knip.ts regression that dropped the src/*/**/index.ts barrel-ignore
    // would balloon this back toward 66. Sanity ceiling well below that.
    expect(report.count).toBeLessThan(20);
  });

  it('exits non-zero when the ceiling is set below the current count', () => {
    const tight = Math.max(0, report.count - 1);
    expect(() =>
      execFileSync('node', [TOOL, '--ceiling', String(tight)], {
        cwd: REPO,
        stdio: 'ignore',
      }),
    ).toThrow();
  });
});
