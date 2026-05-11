/**
 * Tests for scripts/sweep-old-slot-label.sh (v1.49.636 C8 Option B rebuild).
 *
 * Exercises the line-level pattern allowlist against synthetic fixtures
 * with mixed substrate + cosmetic v1.49.650 references. Asserts the
 * sweep preserves substrate lines and rewrites cosmetic lines.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { execSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const SCRIPT_PATH = join(process.cwd(), 'scripts', 'sweep-old-slot-label.sh');

describe('sweep-old-slot-label.sh — line-level pattern allowlist', () => {
  let tmp;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'sweep-test-'));
    // Initialize a git repo so the script's `git rev-parse --show-toplevel`
    // succeeds. The sweep script cd's to repo root; we work around by
    // staging fixtures under SCAN_ROOTS-like subdirs inside this tmp repo.
    execSync('git init -q', { cwd: tmp });
    execSync('git config user.email t@t.io', { cwd: tmp });
    execSync('git config user.name t', { cwd: tmp });
    for (const dir of ['src', 'desktop', 'src-tauri', 'scripts', 'tests', 'tools']) {
      mkdirSync(join(tmp, dir), { recursive: true });
    }
    // The sweep tool itself MUST be present at scripts/sweep-old-slot-label.sh
    // because the file-allowlist references it by relative path.
    writeFileSync(
      join(tmp, 'scripts', 'sweep-old-slot-label.sh'),
      readFileSync(SCRIPT_PATH, 'utf8'),
    );
    execSync('chmod +x scripts/sweep-old-slot-label.sh', { cwd: tmp });
  });

  afterEach(() => {
    if (tmp && existsSync(tmp)) {
      rmSync(tmp, { recursive: true, force: true });
    }
  });

  function runScript(args = '', cwd = tmp) {
    const path = join(cwd, 'scripts', 'sweep-old-slot-label.sh');
    return execSync(`bash "${path}" ${args}`, {
      cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  }

  it('PRESERVES substrate-citation lines (phase-(g) Option 2 — file headers)', () => {
    writeFileSync(
      join(tmp, 'desktop', 'fixture.ts'),
      [
        '/**',
        ' * State machine for the v1.49.650 keystore UI.',
        ' *',
        ' * STUB STATUS (v1.49.650 phase-(g) Option 2):',
        ' *   No DOM rendering wired here.',
        ' */',
      ].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'desktop', 'fixture.ts'), 'utf8');
    expect(after).toContain('v1.49.650 keystore UI');
    expect(after).toContain('v1.49.650 phase-(g) Option 2');
  });

  it('PRESERVES substrate-citation lines (Renamed from X at v1.49.650)', () => {
    writeFileSync(
      join(tmp, 'src-tauri', 'fixture.rs'),
      [
        '//! Keystore wrapper.',
        '//!',
        '//! Renamed from `insecure-plaintext-keystore` at v1.49.650.',
      ].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src-tauri', 'fixture.rs'), 'utf8');
    expect(after).toContain('Renamed from `insecure-plaintext-keystore` at v1.49.650');
  });

  it('PRESERVES substrate-citation lines (Extended at v1.49.650)', () => {
    writeFileSync(
      join(tmp, 'src-tauri', 'fixture.rs'),
      ['//! Phase 369. Extended at v1.49.650 with the unified API.'].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src-tauri', 'fixture.rs'), 'utf8');
    expect(after).toContain('Extended at v1.49.650');
  });

  it('PRESERVES substrate-citation lines (legacy format from before v1.49.650)', () => {
    writeFileSync(
      join(tmp, 'src-tauri', 'fixture.rs'),
      ['//! credentials in legacy format from before v1.49.650 are migrated.'].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src-tauri', 'fixture.rs'), 'utf8');
    expect(after).toContain('legacy format from before v1.49.650');
  });

  it('PRESERVES substrate-citation lines (v1.49.650 C1 file provenance)', () => {
    writeFileSync(
      join(tmp, 'src-tauri', 'fixture.rs'),
      ['//! v1.49.650 C1 — keyring backend unit tests.'].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src-tauri', 'fixture.rs'), 'utf8');
    expect(after).toContain('v1.49.650 C1');
  });

  it('PRESERVES substrate-citation lines (at v1.49.650 pre-tag-gate)', () => {
    writeFileSync(
      join(tmp, 'src', 'perf.test.ts'),
      [
        '// observed 211.52ms mean at v1.49.650 pre-tag-gate (isolated ~120ms).',
      ].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src', 'perf.test.ts'), 'utf8');
    expect(after).toContain('at v1.49.650 pre-tag-gate');
  });

  it('SWEEPS cosmetic file-header titles ("v1.49.650 unified keystore" current-state)', () => {
    // This is the WRONG kind of header — a current-state claim that
    // v1.49.650 owns the unified keystore surface. The unified keystore
    // is now in the v1.49.636 wiring milestone.
    writeFileSync(
      join(tmp, 'src', 'fixture.ts'),
      ['/** CLI command group for the v1.49.650 unified keystore. */'].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src', 'fixture.ts'), 'utf8');
    // The "unified keystore" header is generic ownership, not substrate.
    // Pattern set does NOT preserve this — gets swept.
    expect(after).toContain('v1.49.636 unified keystore');
    expect(after).not.toContain('v1.49.650 unified keystore');
  });

  it('SWEEPS cosmetic section markers ("// v1.49.636 — Unified Keystore API")', () => {
    // Wait — "v1.49.650 — " IS in the substrate list (em-dash + space marker).
    // Use a non-em-dash form for the cosmetic check.
    writeFileSync(
      join(tmp, 'src-tauri', 'fixture.rs'),
      ['// Working on v1.49.650 right now.'].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src-tauri', 'fixture.rs'), 'utf8');
    expect(after).toContain('Working on v1.49.636 right now.');
  });

  it('mixed file: PRESERVES substrate lines + SWEEPS cosmetic lines in same file', () => {
    writeFileSync(
      join(tmp, 'src', 'mixed.ts'),
      [
        '/**',
        ' * Current state: v1.49.650.', // cosmetic — sweep
        ' *',
        ' * Renamed from foo at v1.49.650.', // substrate — preserve
        ' *',
        ' * The v1.49.650 unified keystore covers this.', // cosmetic — sweep
        ' *',
        ' * Extended at v1.49.650 with new features.', // substrate — preserve
        ' */',
      ].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src', 'mixed.ts'), 'utf8');
    // Substrate citations preserved
    expect(after).toContain('Renamed from foo at v1.49.650');
    expect(after).toContain('Extended at v1.49.650');
    // Cosmetic refs swept
    expect(after).toContain('Current state: v1.49.636');
    expect(after).toContain('v1.49.636 unified keystore covers this');
  });

  it('--dry mode does NOT write any file', () => {
    writeFileSync(
      join(tmp, 'src', 'fixture.ts'),
      ['// Working on v1.49.650 right now.'].join('\n'),
    );
    runScript('--dry');
    const after = readFileSync(join(tmp, 'src', 'fixture.ts'), 'utf8');
    // Unchanged — dry-run.
    expect(after).toContain('v1.49.650 right now');
  });

  it('--diff mode emits the line-pair diff without writing files', () => {
    writeFileSync(
      join(tmp, 'src', 'fixture.ts'),
      ['// Working on v1.49.650 right now.'].join('\n'),
    );
    const out = runScript('--diff');
    expect(out).toContain('WOULD be swept');
    expect(out).toContain('-// Working on v1.49.650 right now.');
    expect(out).toContain('+// Working on v1.49.636 right now.');
    // File should not have been modified.
    const after = readFileSync(join(tmp, 'src', 'fixture.ts'), 'utf8');
    expect(after).toContain('v1.49.650 right now');
  });

  it('also handles dash form (v1-49-650 → v1-49-636)', () => {
    writeFileSync(
      join(tmp, 'src', 'fixture.ts'),
      ['// directory: v1-49-650-housekeeping.'].join('\n'),
    );
    runScript('');
    const after = readFileSync(join(tmp, 'src', 'fixture.ts'), 'utf8');
    expect(after).toContain('v1-49-636-housekeeping');
  });

  it('reports swept + preserved counts correctly', () => {
    writeFileSync(
      join(tmp, 'src', 'mixed.ts'),
      [
        '// cosmetic v1.49.650 ref',
        '// Renamed from X at v1.49.650 — substrate',
      ].join('\n'),
    );
    const out = runScript('');
    expect(out).toContain('swept=1 preserved=1');
    expect(out).toContain('total lines swept:     1');
    expect(out).toContain('total lines preserved: 1');
  });
});
