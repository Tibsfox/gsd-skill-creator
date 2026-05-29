/**
 * Test surface for `tools/security/check-stale-known-unwired.mjs` —
 * Lesson #10443 (Inverse-audit: stale-entry detection).
 *
 * The tool implements two stale-shape checks (Shape A wired-but-still-in-
 * allowlist, Shape B import-without-use) against the ProcessContext and
 * EgressContext KNOWN_UNWIRED allowlists. This test surface verifies that:
 *
 *   1. The tool exits clean against the real audit-test files (sanity
 *      check; the tool's primary user is pre-tag-gate, so this protects
 *      against false-positive regressions).
 *   2. The tool detects Shape A — a file in KNOWN_UNWIRED that calls
 *      ensureProcessAllowed.
 *   3. The tool detects Shape B — a file in KNOWN_UNWIRED that imports
 *      child_process but never uses any of the imported names.
 *   4. The tool emits structured JSON via `--json` for machine consumption.
 *
 * Tests 2-3 use a fixture-based approach: a temp src tree + a fabricated
 * audit-test file pointing at the temp tree's KNOWN_UNWIRED entries. The
 * tool is invoked via `execFileSync` with a `STALE_TOOL_ROOT_OVERRIDE`
 * env var so the temp tree is the resolved root.
 *
 * @module tests/security/check-stale-known-unwired
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';

const REPO_ROOT = resolve(__dirname, '..', '..');
const TOOL = resolve(REPO_ROOT, 'tools', 'security', 'check-stale-known-unwired.mjs');

describe('check-stale-known-unwired tool', () => {
  it('exits clean (code 0) against the real audit-test files', () => {
    const result = spawnSync('node', [TOOL], { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('all allowlists clean');
  });

  it('emits structured JSON when invoked with --json', () => {
    const result = spawnSync('node', [TOOL, '--json'], { cwd: REPO_ROOT, encoding: 'utf8' });
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.stale).toBe(false);
    expect(Array.isArray(parsed.reports)).toBe(true);
    // v1.49.885: LoaderContext added as third audit.
    expect(parsed.reports.length).toBe(3);
    const processReport = parsed.reports.find((r) => r.audit === 'ProcessContext');
    expect(processReport).toBeDefined();
    // Both chokepoints fully wired at v881; KNOWN_UNWIRED entryCount may be 0.
    expect(typeof processReport.entryCount).toBe('number');
    expect(processReport.entryCount).toBeGreaterThanOrEqual(0);
    const loaderReport = parsed.reports.find((r) => r.audit === 'LoaderContext');
    expect(loaderReport).toBeDefined();
    // v1.49.909: LoaderContext ratchet closed to 0 entries (was 15 at v885).
    // Assertion relaxed to "non-negative" to match the closed-ledger state.
    expect(loaderReport.entryCount).toBeGreaterThanOrEqual(0);
  });
});

describe('check-stale-known-unwired tool — fixture detection', () => {
  // Fabricate a fake repo that the tool can scan. We override the tool's
  // ROOT by invoking it from inside the temp dir; the tool resolves ROOT
  // relative to its own __dirname, so we copy the tool into the temp tree
  // at the same relative path.

  let tmpRoot;

  beforeEach(() => {
    tmpRoot = mkdtempSync(join(tmpdir(), 'stale-unwired-test-'));
    mkdirSync(join(tmpRoot, 'src', 'security'), { recursive: true });
    mkdirSync(join(tmpRoot, 'tools', 'security'), { recursive: true });
    // Copy the tool itself so paths resolve correctly.
    const toolContent = execFileSync('cat', [TOOL], { encoding: 'utf8' });
    writeFileSync(join(tmpRoot, 'tools', 'security', 'check-stale-known-unwired.mjs'), toolContent);
  });

  afterEach(() => {
    if (tmpRoot) rmSync(tmpRoot, { recursive: true, force: true });
  });

  function writeAuditFile(name, knownUnwired, ensureName) {
    const entries = knownUnwired.map((p) => `  '${p}',`).join('\n');
    const content = `
import { describe, expect, it } from 'vitest';

const KNOWN_UNWIRED: ReadonlySet<string> = new Set([
${entries}
]);

const ENSURE = '${ensureName}';
`;
    writeFileSync(join(tmpRoot, 'src', 'security', name), content);
  }

  function writeSrcFile(relPath, body) {
    const abs = join(tmpRoot, relPath);
    mkdirSync(resolve(abs, '..'), { recursive: true });
    writeFileSync(abs, body);
  }

  it('detects Shape A — KNOWN_UNWIRED entry calls ensureProcessAllowed', () => {
    writeAuditFile(
      'process-context-audit.test.ts',
      ['src/wired-but-listed.ts'],
      'ensureProcessAllowed',
    );
    writeAuditFile('egress-context-audit.test.ts', [], 'ensureEgressAllowed');
    writeAuditFile('loader-context-audit.test.ts', [], 'ensureAllowed');
    writeSrcFile(
      'src/wired-but-listed.ts',
      `import { execFileSync } from 'node:child_process';
import { ensureProcessAllowed } from './security/process-context.js';
export function run(ctx) {
  ensureProcessAllowed(ctx, 'src/wired-but-listed', 'spawn', 'git', []);
  return execFileSync('git', ['status']);
}
`,
    );

    const tool = join(tmpRoot, 'tools', 'security', 'check-stale-known-unwired.mjs');
    const result = spawnSync('node', [tool, '--json'], { cwd: tmpRoot, encoding: 'utf8' });
    expect(result.status).toBe(1);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.stale).toBe(true);
    const proc = parsed.reports.find((r) => r.audit === 'ProcessContext');
    expect(proc.findings.shapeA).toEqual(['src/wired-but-listed.ts']);
    expect(proc.findings.shapeB).toEqual([]);
  });

  it('detects Shape B — KNOWN_UNWIRED entry imports child_process but never uses it', () => {
    writeAuditFile(
      'process-context-audit.test.ts',
      ['src/import-without-use.ts'],
      'ensureProcessAllowed',
    );
    writeAuditFile('egress-context-audit.test.ts', [], 'ensureEgressAllowed');
    writeAuditFile('loader-context-audit.test.ts', [], 'ensureAllowed');
    writeSrcFile(
      'src/import-without-use.ts',
      `import { execFileSync } from 'node:child_process';
export function run() {
  return 42;
}
`,
    );

    const tool = join(tmpRoot, 'tools', 'security', 'check-stale-known-unwired.mjs');
    const result = spawnSync('node', [tool, '--json'], { cwd: tmpRoot, encoding: 'utf8' });
    expect(result.status).toBe(1);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.stale).toBe(true);
    const proc = parsed.reports.find((r) => r.audit === 'ProcessContext');
    expect(proc.findings.shapeB.length).toBe(1);
    expect(proc.findings.shapeB[0].path).toBe('src/import-without-use.ts');
    expect(proc.findings.shapeB[0].unusedNames).toEqual(['execFileSync']);
    expect(proc.findings.shapeA).toEqual([]);
  });

  it('passes clean when entry imports AND uses child_process without calling ensureProcessAllowed', () => {
    writeAuditFile(
      'process-context-audit.test.ts',
      ['src/legit-unwired.ts'],
      'ensureProcessAllowed',
    );
    writeAuditFile('egress-context-audit.test.ts', [], 'ensureEgressAllowed');
    writeAuditFile('loader-context-audit.test.ts', [], 'ensureAllowed');
    writeSrcFile(
      'src/legit-unwired.ts',
      `import { execFileSync } from 'node:child_process';
export function run() {
  return execFileSync('git', ['status']);
}
`,
    );

    const tool = join(tmpRoot, 'tools', 'security', 'check-stale-known-unwired.mjs');
    const result = spawnSync('node', [tool, '--json'], { cwd: tmpRoot, encoding: 'utf8' });
    expect(result.status).toBe(0);
    const parsed = JSON.parse(result.stdout);
    expect(parsed.stale).toBe(false);
  });

  it('reports missing files separately from stale entries', () => {
    writeAuditFile(
      'process-context-audit.test.ts',
      ['src/does-not-exist.ts'],
      'ensureProcessAllowed',
    );
    writeAuditFile('egress-context-audit.test.ts', [], 'ensureEgressAllowed');
    writeAuditFile('loader-context-audit.test.ts', [], 'ensureAllowed');

    const tool = join(tmpRoot, 'tools', 'security', 'check-stale-known-unwired.mjs');
    const result = spawnSync('node', [tool, '--json'], { cwd: tmpRoot, encoding: 'utf8' });
    expect(result.status).toBe(1);
    const parsed = JSON.parse(result.stdout);
    const proc = parsed.reports.find((r) => r.audit === 'ProcessContext');
    expect(proc.findings.missing).toEqual(['src/does-not-exist.ts']);
  });
});
