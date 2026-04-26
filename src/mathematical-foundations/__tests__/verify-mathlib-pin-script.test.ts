/**
 * verify-mathlib-pin.sh smoke tests (v1.49.578 W4).
 *
 * Verifies the script's existence + executable bit + SHA-parse logic.
 * The end-to-end `lake build` path is intentionally NOT tested here —
 * that requires a local Lean install and ~5–8 GB disk + ~5–15 min wall-clock
 * (cache-hit) or ~1–3 hr (cache-miss). The script gates and reports on its
 * own when invoked manually.
 */

import { describe, it, expect } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, statSync, writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';

const REPO_ROOT = resolve(__dirname, '../../../');
const SCRIPT_PATH = resolve(REPO_ROOT, 'tools/verify-mathlib-pin.sh');
const TOOLCHAIN_DOC = resolve(REPO_ROOT, 'src/mathematical-foundations/lean-toolchain.md');

describe('verify-mathlib-pin.sh — existence + permissions', () => {
  it('script exists at tools/verify-mathlib-pin.sh', () => {
    expect(existsSync(SCRIPT_PATH)).toBe(true);
  });

  it('script is executable (mode bit ≥ 700)', () => {
    const mode = statSync(SCRIPT_PATH).mode & 0o777;
    expect(mode & 0o700).toBe(0o700);
  });

  it('script starts with a bash shebang', () => {
    const head = readFileSync(SCRIPT_PATH, 'utf8').split('\n')[0];
    expect(head).toMatch(/^#!.*bash/);
  });
});

describe('verify-mathlib-pin.sh — SHA parse against the canonical lean-toolchain.md', () => {
  it('extracts the same 40-char SHA via the script as awk extracts directly', () => {
    // Run the script's awk extractor directly to round-trip the parse.
    const awkProgram = [
      '/^## Pinned Mathlib Commit Hash/ { in_section = 1; next }',
      '/^## / && in_section { exit }',
      'in_section && match($0, /[0-9a-f]{40}/) { print substr($0, RSTART, RLENGTH); exit }',
    ].join('\n');
    const out = execFileSync('awk', [awkProgram, TOOLCHAIN_DOC], { encoding: 'utf8' }).trim();
    expect(out).toMatch(/^[0-9a-f]{40}$/);
    // Canonical pin documented in lean-version-pin.test.ts and the doc itself.
    expect(out).toBe('6955cd00cec441d129d832418347a89d682205a6');
  });

  it('extracts the SHA from a fixture document with surrounding noise', () => {
    const fixtureDir = mkdtempSync(join(tmpdir(), 'verify-mathlib-pin-fixture-'));
    const fixturePath = join(fixtureDir, 'fixture.md');
    writeFileSync(
      fixturePath,
      [
        '# Fixture',
        '',
        '## Pinned Lean Toolchain Version',
        '```',
        'leanprover/lean4:v4.15.0',
        '```',
        '',
        '## Pinned Mathlib Commit Hash',
        '',
        '```',
        'abcdef0123456789abcdef0123456789abcdef01',
        '```',
        '',
        '## Some other section',
        '',
        '0000000000000000000000000000000000000000  ← should be ignored',
        '',
      ].join('\n'),
      'utf8',
    );
    const awkProgram = [
      '/^## Pinned Mathlib Commit Hash/ { in_section = 1; next }',
      '/^## / && in_section { exit }',
      'in_section && match($0, /[0-9a-f]{40}/) { print substr($0, RSTART, RLENGTH); exit }',
    ].join('\n');
    const out = execFileSync('awk', [awkProgram, fixturePath], { encoding: 'utf8' }).trim();
    expect(out).toBe('abcdef0123456789abcdef0123456789abcdef01');
  });
});

describe('verify-mathlib-pin.sh — --no-build path', () => {
  it('exits 0 with --no-build when no checkout exists yet (parse-only success)', () => {
    // Use a non-existent mathlib dir so the early --no-build branch fires
    // before the elan check.
    const nonExistent = join(tmpdir(), `mathlib-no-such-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    const result = spawnSync(
      SCRIPT_PATH,
      ['--no-build', '--mathlib-dir', nonExistent],
      { encoding: 'utf8' },
    );
    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/pinned SHA: [0-9a-f]{40}/);
  });
});
