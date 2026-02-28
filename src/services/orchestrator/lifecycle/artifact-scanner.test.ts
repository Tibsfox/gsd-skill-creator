/**
 * Tests for the artifact scanner module.
 *
 * Verifies that scanPhaseArtifacts correctly identifies PLAN, SUMMARY,
 * CONTEXT, RESEARCH, UAT, and VERIFICATION files in a phase directory
 * and computes derived fields like unexecutedPlans.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { scanPhaseArtifacts } from './artifact-scanner.js';

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
