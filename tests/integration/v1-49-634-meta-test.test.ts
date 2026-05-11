/**
 * v1.49.634 Concerns Cleanup #2 — Integration meta-test.
 *
 * Mirrors the v1.49.585 W4 Phase 3 pattern: subprocess-isolated tests
 * that fire each new gate on intentional violations and assert BLOCK.
 *
 * Spec: .planning/missions/v1-49-634-concerns-cleanup-2/components/08-integration-verify-ship.md
 *
 * Tests:
 *   1. C1 watchdog — surfaces MCPWatchdog error string on dead-server scenario.
 *   2. C2 tauri-boundary audit — exits non-zero on synthetic violation; clean tree exits 0.
 *   3. C4 self-mod-guard — proximity-aware: adjacent BLOCK, non-adjacent ALLOW.
 *   4. pre-tag-gate step 9 (tauri-boundary) — wired into the composite script.
 */

import { afterEach, describe, expect, it } from 'vitest';
import { spawnSync } from 'node:child_process';
import { mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO_ROOT = resolve(import.meta.dirname!, '../..');
const SYNTHETIC_DIR = resolve(REPO_ROOT, 'src/__synthetic_v634__');
const SYNTHETIC_FILE = resolve(SYNTHETIC_DIR, 'violation.ts');
const HOOK_PATH = resolve(REPO_ROOT, '.claude/hooks/self-mod-guard.js');
const AUDIT_PATH = resolve(REPO_ROOT, 'tools/tauri-boundary-audit.mjs');
const PRE_TAG_GATE_PATH = resolve(REPO_ROOT, 'tools/pre-tag-gate.sh');

afterEach(() => {
  // Clean synthetic file + dir if any test left one behind
  try {
    if (existsSync(SYNTHETIC_FILE)) rmSync(SYNTHETIC_FILE);
    if (existsSync(SYNTHETIC_DIR)) rmSync(SYNTHETIC_DIR, { recursive: true });
  } catch {
    /* best effort */
  }
});

describe('v1.49.634 integration meta-test', () => {
  it('C1 watchdog surfaces MCPWatchdog error string for dead-server scenario', async () => {
    // The watchdog is a deterministic in-process unit (no subprocess needed for
    // its surface contract). Import it and verify the dead-server error string
    // surfaces through describeWatchdogError — the same surface the integration
    // layer reads.
    const { CoprocessorWatchdog, describeWatchdogError } = await import(
      '../../src/coprocessor/watchdog.js'
    );
    const wd = new CoprocessorWatchdog({
      pingFn: async () => {
        throw new Error('ECONNREFUSED — server killed');
      },
      deadAfterMissedProbes: 1,
    });
    await wd.probeOnce();
    const status = wd.getStatus();
    expect(status.state).toBe('dead');
    const surface = describeWatchdogError(status);
    expect(surface).not.toBeNull();
    expect(surface).toContain('MCPWatchdog: server dead');
  });

  it('C2 tauri-boundary BLOCKS on synthetic violation in src/', () => {
    mkdirSync(SYNTHETIC_DIR, { recursive: true });
    writeFileSync(
      SYNTHETIC_FILE,
      "import { invoke } from '@tauri-apps/api';\nexport const x = invoke;\n",
      'utf8',
    );

    // --json so we can assert the violation reports the synthetic file path
    const result = spawnSync(
      'node',
      [AUDIT_PATH, '--json'],
      {
        cwd: REPO_ROOT,
        env: { ...process.env, PATH: process.env.PATH ?? '' },
        encoding: 'utf8',
      },
    );

    // Non-zero exit on real violation = exit 10 per tauri-boundary-audit.mjs
    expect(result.status).toBe(10);
    const parsed = JSON.parse(result.stdout || '{}');
    expect(Array.isArray(parsed.violations)).toBe(true);
    const paths = (parsed.violations as Array<{ file: string }>).map((v) => v.file);
    expect(paths.some((p) => p.includes('__synthetic_v634__') || p.endsWith('violation.ts'))).toBe(true);
  });

  it('C2 tauri-boundary PASSES on clean tree (synthetic file removed)', () => {
    // Ensure no synthetic file exists for this test (afterEach cleans between)
    if (existsSync(SYNTHETIC_FILE)) rmSync(SYNTHETIC_FILE);
    if (existsSync(SYNTHETIC_DIR)) rmSync(SYNTHETIC_DIR, { recursive: true });

    const result = spawnSync(
      'node',
      [AUDIT_PATH, '--check'],
      {
        cwd: REPO_ROOT,
        env: { ...process.env, PATH: process.env.PATH ?? '' },
        encoding: 'utf8',
      },
    );
    expect(result.status).toBe(0);
  });

  it('C4 self-mod-guard BLOCKS on adjacent write to .claude/skills/', () => {
    // Adjacent: `cp X .claude/skills/foo/SKILL.md` — write-operator + protected
    // path token are on the same proximity-resolved span. Hook must BLOCK.
    const payload = JSON.stringify({
      tool_name: 'Bash',
      tool_input: { command: 'cp src.md .claude/skills/foo/SKILL.md' },
    });
    const result = spawnSync('node', [HOOK_PATH], {
      cwd: REPO_ROOT,
      input: payload,
      env: { PATH: process.env.PATH ?? '' }, // env -i style: scrub SC_* overrides
      encoding: 'utf8',
    });
    expect(result.status).toBe(0); // hook always exits 0; decision in stdout
    const parsed = JSON.parse(result.stdout || '{}');
    expect(parsed.decision).toBe('block');
    expect(parsed.reason).toMatch(/skills|protected|self-mod/i);
  });

  it('C4 self-mod-guard ALLOWS non-adjacent write (regression for §4.1)', () => {
    // Non-adjacent: write-operator targets a non-protected path; the
    // .claude/skills/... substring appears inside a quoted string (echo body),
    // not as a write target. Hook must ALLOW (this is the §4.1 false-positive
    // fix from v1.49.586 — proximity-aware Bash detection).
    const payload = JSON.stringify({
      tool_name: 'Bash',
      tool_input: {
        command: "echo 'see .claude/skills/foo/SKILL.md for details' > /tmp/notes.txt",
      },
    });
    const result = spawnSync('node', [HOOK_PATH], {
      cwd: REPO_ROOT,
      input: payload,
      env: { PATH: process.env.PATH ?? '' },
      encoding: 'utf8',
    });
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout || '{}');
    expect(parsed.decision).toBeUndefined();
  });

  it('pre-tag-gate step 9 (tauri-boundary) is wired into the composite script', () => {
    // The full pre-tag-gate runs vitest + build + GitHub API + esbuild —
    // running it inside vitest would recurse and take minutes. Instead, this
    // smoke-test asserts step 9 wiring is real: the script references the
    // audit tool, declares exit-code 9, and honors the override env var.
    expect(existsSync(PRE_TAG_GATE_PATH)).toBe(true);
    const body = readFileSync(PRE_TAG_GATE_PATH, 'utf8');
    expect(body).toMatch(/tauri-boundary-audit\.mjs/);
    expect(body).toMatch(/SC_SKIP_TAURI_BOUNDARY_GATE/);
    // The exit-code 9 declaration appears in the script's exit-code legend
    expect(body).toMatch(/9\s+tauri-boundary/);
  });
});
