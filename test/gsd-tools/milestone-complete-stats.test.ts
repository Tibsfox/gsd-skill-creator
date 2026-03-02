/**
 * Behavioral tests for milestone-complete stat accuracy.
 *
 * Proves that cmdMilestoneComplete uses ROADMAP-parsed plan counts
 * instead of disk-scan counts when generating MILESTONES.md entries
 * and result JSON.
 *
 * The core bug: milestone-complete scans phase directories for *-PLAN.md
 * files, producing 0 plans for inline-executed phases that have no PLAN
 * files on disk. The fix uses parseRoadmapStats to read the authoritative
 * plan counts from ROADMAP.md checklist items.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Test fixtures
// ============================================================================

/** ROADMAP with 4 phases, each (1/1 plans) in checklist items */
const ROADMAP_4_PHASES = `# Roadmap

### v1.50.10 Post-Merge Integration (Phases 536-539)

- [x] Phase 536: Import Path Fixes (1/1 plans) -- completed 2026-03-02
- [x] Phase 537: Version and Stats Alignment (1/1 plans) -- completed 2026-03-02
- [x] Phase 538: Integration Verification (1/1 plans) -- completed 2026-03-02
- [x] Phase 539: Housekeeping (1/1 plans) -- completed 2026-03-02

## Phase Details

### Phase 536: Import Path Fixes
**Goal**: Fix import paths after merge
**Plans**: 1/1 plans complete

### Phase 537: Version and Stats Alignment
**Goal**: Align versioning
**Plans**: 1/1 plans complete

### Phase 538: Integration Verification
**Goal**: Verify integration
**Plans**: 1/1 plans complete

### Phase 539: Housekeeping
**Goal**: Clean up
**Plans**: 1/1 plans complete
`;

/** Minimal STATE.md with frontmatter */
const STATE_MD = `---
gsd_state_version: 1.0
milestone: v1.50.10
milestone_name: Post-Merge Integration
status: active
last_updated: "2026-03-02"
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Current Position

Phase: 539 of 539
Status: Active
`;

/** MILESTONES.md header */
const MILESTONES_MD = `# Milestones

`;

/** Summary file with one-liner and task headings for task counting */
const SUMMARY_WITH_TASKS = `---
one-liner: "Fixed import paths for domain-grouped layout"
---

# Summary

## Task 1: Fix core imports
Done.

## Task 2: Fix test imports
Done.

## Task 3: Update configs
Done.
`;

// ============================================================================
// Test helpers
// ============================================================================

let tempDir: string;
let capturedOutput: any;
let origExit: typeof process.exit;
let origStdoutWrite: typeof process.stdout.write;

function setupTempDir() {
  tempDir = mkdtempSync(join(tmpdir(), 'milestone-stats-'));
  mkdirSync(join(tempDir, '.planning', 'phases'), { recursive: true });
  mkdirSync(join(tempDir, '.planning', 'milestones'), { recursive: true });
}

function writePlanning(filename: string, content: string) {
  writeFileSync(join(tempDir, '.planning', filename), content, 'utf-8');
}

function createPhaseDir(dirName: string, files?: Record<string, string>) {
  const dirPath = join(tempDir, '.planning', 'phases', dirName);
  mkdirSync(dirPath, { recursive: true });
  if (files) {
    for (const [name, content] of Object.entries(files)) {
      writeFileSync(join(dirPath, name), content, 'utf-8');
    }
  }
}

function mockProcessForMilestoneComplete() {
  capturedOutput = null;

  // Mock process.exit to throw instead of exiting
  origExit = process.exit;
  process.exit = vi.fn((code?: number) => {
    throw new Error(`EXIT_${code ?? 0}`);
  }) as any;

  // Mock stdout.write to capture output
  origStdoutWrite = process.stdout.write;
  process.stdout.write = vi.fn((data: any) => {
    if (typeof data === 'string') {
      try {
        capturedOutput = JSON.parse(data);
      } catch {
        capturedOutput = data;
      }
    }
    return true;
  }) as any;
}

function restoreProcess() {
  process.exit = origExit;
  process.stdout.write = origStdoutWrite;
}

// ============================================================================
// Tests
// ============================================================================

describe('milestone-complete stat accuracy', () => {
  beforeEach(() => {
    setupTempDir();
    mockProcessForMilestoneComplete();
  });

  afterEach(() => {
    restoreProcess();
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('reports ROADMAP-derived plan counts (not 0 from empty disk dirs)', () => {
    // Set up ROADMAP with 4 phases, each 1/1 plans
    writePlanning('ROADMAP.md', ROADMAP_4_PHASES);
    writePlanning('STATE.md', STATE_MD);

    // Create EMPTY phase directories (no *-PLAN.md files — simulates inline execution)
    createPhaseDir('536-import-path-fixes');
    createPhaseDir('537-version-stats');
    createPhaseDir('538-integration-verification');
    createPhaseDir('539-housekeeping');

    // Run milestone complete
    const { cmdMilestoneComplete } = require('../../.claude/get-shit-done/bin/lib/milestone.cjs');
    try {
      cmdMilestoneComplete(tempDir, 'v1.50.10', { name: 'Post-Merge Integration' }, false);
    } catch (e: any) {
      if (!e.message.includes('EXIT_')) throw e;
    }

    // The result JSON should have ROADMAP-derived counts, not 0
    expect(capturedOutput).toBeTruthy();
    expect(capturedOutput.phases).toBe(4);
    expect(capturedOutput.plans).toBe(4);  // Was 0 before fix
  });

  it('writes accurate plan counts in MILESTONES.md entry', () => {
    writePlanning('ROADMAP.md', ROADMAP_4_PHASES);
    writePlanning('STATE.md', STATE_MD);
    writePlanning('MILESTONES.md', MILESTONES_MD);

    // Empty phase dirs (no PLAN files)
    createPhaseDir('536-import-path-fixes');
    createPhaseDir('537-version-stats');
    createPhaseDir('538-integration-verification');
    createPhaseDir('539-housekeeping');

    const { cmdMilestoneComplete } = require('../../.claude/get-shit-done/bin/lib/milestone.cjs');
    try {
      cmdMilestoneComplete(tempDir, 'v1.50.10', { name: 'Post-Merge Integration' }, false);
    } catch (e: any) {
      if (!e.message.includes('EXIT_')) throw e;
    }

    // Read the generated MILESTONES.md entry
    const milestones = readFileSync(join(tempDir, '.planning', 'MILESTONES.md'), 'utf-8');

    // Should contain "4 phases, 4 plans" not "4 phases, 0 plans"
    expect(milestones).toContain('4 phases, 4 plans');
    expect(milestones).not.toContain('0 plans');
  });

  it('still counts tasks from disk SUMMARY files (preserved behavior)', () => {
    writePlanning('ROADMAP.md', ROADMAP_4_PHASES);
    writePlanning('STATE.md', STATE_MD);

    // Phase 536 has a SUMMARY with 3 task headings, others are empty
    createPhaseDir('536-import-path-fixes', {
      '536-01-SUMMARY.md': SUMMARY_WITH_TASKS,
    });
    createPhaseDir('537-version-stats');
    createPhaseDir('538-integration-verification');
    createPhaseDir('539-housekeeping');

    const { cmdMilestoneComplete } = require('../../.claude/get-shit-done/bin/lib/milestone.cjs');
    try {
      cmdMilestoneComplete(tempDir, 'v1.50.10', { name: 'Post-Merge Integration' }, false);
    } catch (e: any) {
      if (!e.message.includes('EXIT_')) throw e;
    }

    // Tasks should be counted from SUMMARY files on disk (3 task headings)
    expect(capturedOutput).toBeTruthy();
    expect(capturedOutput.tasks).toBe(3);

    // Plans should still come from ROADMAP (not disk)
    expect(capturedOutput.plans).toBe(4);
  });

  it('result JSON reports real phase and plan counts matching ROADMAP data', () => {
    writePlanning('ROADMAP.md', ROADMAP_4_PHASES);
    writePlanning('STATE.md', STATE_MD);

    // Only 2 phase dirs on disk (some were deleted/archived)
    createPhaseDir('536-import-path-fixes');
    createPhaseDir('539-housekeeping');

    const { cmdMilestoneComplete } = require('../../.claude/get-shit-done/bin/lib/milestone.cjs');
    try {
      cmdMilestoneComplete(tempDir, 'v1.50.10', { name: 'Post-Merge Integration' }, false);
    } catch (e: any) {
      if (!e.message.includes('EXIT_')) throw e;
    }

    // Phase count should come from ROADMAP (4), not disk dirs (2)
    expect(capturedOutput).toBeTruthy();
    expect(capturedOutput.phases).toBe(4);
    expect(capturedOutput.plans).toBe(4);
  });
});
