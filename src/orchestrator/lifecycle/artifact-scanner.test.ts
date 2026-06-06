/**
 * Tests for the artifact scanner module.
 *
 * Verifies that scanPhaseArtifacts correctly identifies PLAN, SUMMARY,
 * CONTEXT, RESEARCH, UAT, and VERIFICATION files in a phase directory
 * and computes derived fields like unexecutedPlans.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { scanPhaseArtifacts } from './artifact-scanner.js';
import {
  CapturingAuditSink,
  defaultLoaderContext,
  LoaderContextDenied,
  type LoaderContext,
} from '../../security/loader-context.js';

// ============================================================================
// Fixtures
// ============================================================================

let tempDirs: string[] = [];

function createTempPhasesDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'artifact-scanner-'));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs) {
    rmSync(dir, { recursive: true, force: true });
  }
  tempDirs = [];
});

// ============================================================================
// scanPhaseArtifacts
// ============================================================================

describe('scanPhaseArtifacts', () => {
  it('detects PLAN files and extracts plan IDs', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    mkdtempSync; // just referencing -- we need mkdirSync
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, '39-01-PLAN.md'), '# Plan 1');
    writeFileSync(join(fullDir, '39-02-PLAN.md'), '# Plan 2');
    writeFileSync(join(fullDir, '39-03-PLAN.md'), '# Plan 3');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.planIds).toEqual(['39-01', '39-02', '39-03']);
    expect(result.planCount).toBe(3);
  });

  it('detects SUMMARY files and extracts summary IDs', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, '39-01-PLAN.md'), '# Plan 1');
    writeFileSync(join(fullDir, '39-02-PLAN.md'), '# Plan 2');
    writeFileSync(join(fullDir, '39-01-SUMMARY.md'), '# Summary 1');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.summaryIds).toEqual(['39-01']);
    expect(result.summaryCount).toBe(1);
  });

  it('computes unexecutedPlans as plans without matching summaries', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, '39-01-PLAN.md'), '# Plan 1');
    writeFileSync(join(fullDir, '39-02-PLAN.md'), '# Plan 2');
    writeFileSync(join(fullDir, '39-03-PLAN.md'), '# Plan 3');
    writeFileSync(join(fullDir, '39-01-SUMMARY.md'), '# Summary 1');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.unexecutedPlans).toEqual(['39-02', '39-03']);
  });

  it('detects CONTEXT.md existence', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, '39-CONTEXT.md'), '# Context');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.hasContext).toBe(true);
  });

  it('detects RESEARCH.md existence', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, '39-RESEARCH.md'), '# Research');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.hasResearch).toBe(true);
  });

  it('detects UAT.md and VERIFICATION.md existence', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, '39-UAT.md'), '# UAT');
    writeFileSync(join(fullDir, '39-VERIFICATION.md'), '# Verification');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.hasUat).toBe(true);
    expect(result.hasVerification).toBe(true);
  });

  it('returns zero counts and all false flags for empty directory', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.planIds).toEqual([]);
    expect(result.summaryIds).toEqual([]);
    expect(result.planCount).toBe(0);
    expect(result.summaryCount).toBe(0);
    expect(result.unexecutedPlans).toEqual([]);
    expect(result.hasContext).toBe(false);
    expect(result.hasResearch).toBe(false);
    expect(result.hasUat).toBe(false);
    expect(result.hasVerification).toBe(false);
  });

  it('returns empty artifacts for nonexistent directory (does not throw)', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '99-does-not-exist';

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.planIds).toEqual([]);
    expect(result.summaryIds).toEqual([]);
    expect(result.planCount).toBe(0);
    expect(result.summaryCount).toBe(0);
    expect(result.hasContext).toBe(false);
    expect(result.phaseNumber).toBe('99');
    expect(result.phaseName).toBe('does-not-exist');
    expect(result.phaseDirectory).toBe(phaseDir);
  });

  it('ignores files that do not match artifact patterns', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, 'README.md'), '# Readme');
    writeFileSync(join(fullDir, 'notes.txt'), 'notes');
    writeFileSync(join(fullDir, '.gitkeep'), '');
    writeFileSync(join(fullDir, '39-01-PLAN.md'), '# Plan 1');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.planIds).toEqual(['39-01']);
    expect(result.planCount).toBe(1);
    expect(result.summaryCount).toBe(0);
    expect(result.hasContext).toBe(false);
    expect(result.hasResearch).toBe(false);
  });

  it('handles decimal phase files (e.g., 37.1-01-PLAN.md)', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '37.1-hotfix-phase';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, '37.1-01-PLAN.md'), '# Plan 1');
    writeFileSync(join(fullDir, '37.1-02-PLAN.md'), '# Plan 2');
    writeFileSync(join(fullDir, '37.1-01-SUMMARY.md'), '# Summary 1');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.phaseNumber).toBe('37.1');
    expect(result.phaseName).toBe('hotfix-phase');
    expect(result.planIds).toEqual(['37.1-01', '37.1-02']);
    expect(result.summaryIds).toEqual(['37.1-01']);
    expect(result.unexecutedPlans).toEqual(['37.1-02']);
  });

  it('extracts phaseNumber and phaseName from directory string', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '42-my-awesome-phase';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.phaseNumber).toBe('42');
    expect(result.phaseName).toBe('my-awesome-phase');
    expect(result.phaseDirectory).toBe(phaseDir);
  });

  it('scans a fully populated phase directory', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    writeFileSync(join(fullDir, '39-01-PLAN.md'), '# Plan 1');
    writeFileSync(join(fullDir, '39-02-PLAN.md'), '# Plan 2');
    writeFileSync(join(fullDir, '39-01-SUMMARY.md'), '# Summary 1');
    writeFileSync(join(fullDir, '39-02-SUMMARY.md'), '# Summary 2');
    writeFileSync(join(fullDir, '39-CONTEXT.md'), '# Context');
    writeFileSync(join(fullDir, '39-RESEARCH.md'), '# Research');
    writeFileSync(join(fullDir, '39-UAT.md'), '# UAT');
    writeFileSync(join(fullDir, '39-VERIFICATION.md'), '# Verification');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);

    expect(result.planCount).toBe(2);
    expect(result.summaryCount).toBe(2);
    expect(result.unexecutedPlans).toEqual([]);
    expect(result.hasContext).toBe(true);
    expect(result.hasResearch).toBe(true);
    expect(result.hasUat).toBe(true);
    expect(result.hasVerification).toBe(true);
  });
});

// ============================================================================
// LoaderContext chokepoint integration (v1.49.900 — seventh LoaderContext chip)
// ============================================================================

describe('LoaderContext chokepoint integration (v1.49.900)', () => {
  it('emits exactly one audit record when ctx is provided', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });
    writeFileSync(join(fullDir, '39-01-PLAN.md'), '# Plan 1');

    const sink = new CapturingAuditSink();
    await scanPhaseArtifacts(phasesDir, phaseDir, defaultLoaderContext(sink));

    expect(sink.records).toHaveLength(1);
    const rec = sink.records[0];
    expect(rec.source).toBe('orchestrator/lifecycle/artifact-scanner');
    expect(rec.op).toBe('read-dir');
    expect(rec.target).toBe(fullDir);
    expect(rec.allowed).toBe(true);
  });

  it('throws LoaderContextDenied when phase dir is not in allowList — denial propagates ABOVE ENOENT swallow (#10442)', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '99-does-not-exist';
    const sink = new CapturingAuditSink();
    const restrictedCtx: LoaderContext = {
      allowList: ['/somewhere/that/does/not/match'],
      audit: sink,
    };
    // Directory does not exist (readdir would normally be swallowed and
    // return empty artifacts), but the denial must still throw because
    // ensureAllowed runs BEFORE readdir. This is the #10442 hoist-above-
    // try/catch invariant.
    await expect(
      scanPhaseArtifacts(phasesDir, phaseDir, restrictedCtx),
    ).rejects.toBeInstanceOf(LoaderContextDenied);
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0].allowed).toBe(false);
  });

  it('legacy permissive mode when ctx is undefined (scan works without audit)', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });
    writeFileSync(join(fullDir, '39-01-PLAN.md'), '# Plan 1');

    const result = await scanPhaseArtifacts(phasesDir, phaseDir);
    expect(result.planIds).toEqual(['39-01']);
  });

  it('admits phase dir via prefix-pattern (trailing slash) in allowList', async () => {
    const phasesDir = createTempPhasesDir();
    const phaseDir = '39-lifecycle-coordination';
    const fullDir = join(phasesDir, phaseDir);
    const { mkdirSync } = await import('node:fs');
    mkdirSync(fullDir, { recursive: true });

    const sink = new CapturingAuditSink();
    // Prefix-pattern uses the platform path separator: the audited target is
    // the child `phasesDir/<phaseDir>`, so a literal '/' separator would never
    // match the backslash child path on win32 (matchesAllowList does a raw
    // string startsWith).
    const prefixCtx: LoaderContext = {
      allowList: [`${phasesDir}${sep}`],
      audit: sink,
    };
    await scanPhaseArtifacts(phasesDir, phaseDir, prefixCtx);
    expect(sink.records).toHaveLength(1);
    expect(sink.records[0].allowed).toBe(true);
  });

  it('emits exactly N audit records under N invocations (#10456 module-function direct-call variant)', async () => {
    const phasesDir = createTempPhasesDir();
    const { mkdirSync } = await import('node:fs');
    const dirs = ['39-a', '40-b', '41-c'];
    for (const d of dirs) {
      mkdirSync(join(phasesDir, d), { recursive: true });
    }
    const sink = new CapturingAuditSink();
    const ctx = defaultLoaderContext(sink);
    for (const d of dirs) {
      await scanPhaseArtifacts(phasesDir, d, ctx);
    }
    expect(sink.records).toHaveLength(3);
    expect(sink.records.every((r) => r.op === 'read-dir')).toBe(true);
    expect(sink.records.map((r) => r.target).sort()).toEqual(
      dirs.map((d) => join(phasesDir, d)).sort(),
    );
  });
});
