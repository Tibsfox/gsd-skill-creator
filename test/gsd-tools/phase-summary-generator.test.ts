/**
 * Behavioral tests for phase SUMMARY.md auto-generation in cmdPhaseComplete.
 *
 * Proves that cmdPhaseComplete generates a phase-level SUMMARY.md capturing
 * accomplishments (from plan SUMMARY one-liners), files changed (from plan
 * frontmatter), and test results (from plan SUMMARY task headings).
 *
 * The core gap: inline-executed phases never produce a SUMMARY.md because
 * /gsd:execute-phase generates them but cmdPhaseComplete does not. This
 * breaks milestone ceremony which expects phase summaries to exist.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Test fixtures
// ============================================================================

/** Minimal ROADMAP.md with a phase entry */
function makeRoadmap(phaseNum: string, phaseName: string): string {
  return `# Roadmap

### Phase ${phaseNum}: ${phaseName}
**Goal**: Test goal
**Requirements**: TEST-01
**Plans**: 2 plans

Plans:
- [ ] ${phaseNum}-01-PLAN.md
- [ ] ${phaseNum}-02-PLAN.md

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| ${phaseNum}. ${phaseName} | 0/2 | Not started | - |

---
*Last updated: 2026-03-01*
`;
}

/** Minimal STATE.md */
const STATE_MD = `---
gsd_state_version: 1.0
milestone: v1.50.11
milestone_name: Test Milestone
status: executing
last_updated: "2026-03-03T00:00:00.000Z"
progress:
  total_phases: 1
  completed_phases: 0
  total_plans: 2
  completed_plans: 2
---

# Project State

## Current Position

Phase: 100 of 100 (test-phase)
Plan: 2 of 2
Status: Phase complete
Last activity: 2026-03-03
`;

/** REQUIREMENTS.md with a test requirement */
const REQUIREMENTS_MD = `# Requirements

- [ ] **TEST-01** -- Test requirement

## Traceability

| ID | Phase | Status |
|----|-------|--------|
| TEST-01 | 100 | Pending |
`;

/** Plan file with files_modified frontmatter */
function makePlan(phaseNum: string, planNum: string, filesModified: string[]): string {
  return `---
phase: ${phaseNum}-test-phase
plan: ${planNum}
type: tdd
wave: 1
files_modified: [${filesModified.join(', ')}]
autonomous: true
requirements: [TEST-01]
---

<objective>
Test plan ${planNum} objective.
</objective>

<tasks>
<task type="auto">
  <name>Task 1: Do something</name>
</task>
</tasks>
`;
}

/** Plan SUMMARY file with one-liner and task sections */
function makePlanSummary(phaseNum: string, planNum: string, oneLiner: string, taskCount: number): string {
  const taskSections = Array.from({ length: taskCount }, (_, i) =>
    `## Task ${i + 1}\n\nDid thing ${i + 1}.`
  ).join('\n\n');

  return `---
phase: ${phaseNum}-test-phase
plan: ${planNum}
one-liner: "${oneLiner}"
requirements-completed: [TEST-01]
duration: 5min
completed: 2026-03-03
---

# Phase ${phaseNum} Plan ${planNum}: Test Plan Summary

**${oneLiner}**

## Performance

- **Duration:** 5 min
- **Tasks:** ${taskCount}

${taskSections}

## Deviations from Plan

None - plan executed exactly as written.
`;
}

// ============================================================================
// Test helpers
// ============================================================================

let tempDir: string;

function setupTempDir(phaseNum = '100', phaseName = 'test-phase') {
  tempDir = mkdtempSync(join(tmpdir(), 'phase-summary-'));
  mkdirSync(join(tempDir, '.planning', 'phases', `${phaseNum}-${phaseName}`), { recursive: true });
  writeFileSync(join(tempDir, '.planning', 'ROADMAP.md'), makeRoadmap(phaseNum, phaseName), 'utf-8');
  writeFileSync(join(tempDir, '.planning', 'STATE.md'), STATE_MD, 'utf-8');
  writeFileSync(join(tempDir, '.planning', 'REQUIREMENTS.md'), REQUIREMENTS_MD, 'utf-8');
}

function addPlan(phaseNum: string, planNum: string, filesModified: string[]) {
  const phaseName = 'test-phase';
  writeFileSync(
    join(tempDir, '.planning', 'phases', `${phaseNum}-${phaseName}`, `${phaseNum}-${planNum}-PLAN.md`),
    makePlan(phaseNum, planNum, filesModified),
    'utf-8'
  );
}

function addPlanSummary(phaseNum: string, planNum: string, oneLiner: string, taskCount: number) {
  const phaseName = 'test-phase';
  writeFileSync(
    join(tempDir, '.planning', 'phases', `${phaseNum}-${phaseName}`, `${phaseNum}-${planNum}-SUMMARY.md`),
    makePlanSummary(phaseNum, planNum, oneLiner, taskCount),
    'utf-8'
  );
}

function readPhaseSummary(phaseNum: string): string | null {
  const phaseName = 'test-phase';
  const summaryPath = join(tempDir, '.planning', 'phases', `${phaseNum}-${phaseName}`, 'SUMMARY.md');
  if (existsSync(summaryPath)) {
    return readFileSync(summaryPath, 'utf-8');
  }
  return null;
}

function phaseSummaryExists(phaseNum: string): boolean {
  const phaseName = 'test-phase';
  return existsSync(join(tempDir, '.planning', 'phases', `${phaseNum}-${phaseName}`, 'SUMMARY.md'));
}

// ============================================================================
// Tests
// ============================================================================

describe('cmdPhaseComplete SUMMARY.md generation', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTempDir();
    // cmdPhaseComplete calls output() which calls process.exit(0).
    // Mock it to prevent the test runner from exiting.
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('generates SUMMARY.md when none exists in phase directory', () => {
    // Given: Phase with 2 plans and 2 summaries but no phase-level SUMMARY.md
    addPlan('100', '01', ['src/foo.ts', 'src/bar.ts']);
    addPlan('100', '02', ['src/baz.ts']);
    addPlanSummary('100', '01', 'Implemented foo and bar modules', 2);
    addPlanSummary('100', '02', 'Added baz integration', 1);

    expect(phaseSummaryExists('100')).toBe(false);

    // When: cmdPhaseComplete runs
    const { cmdPhaseComplete } = require('../../.claude/get-shit-done/bin/lib/phase.cjs');
    cmdPhaseComplete(tempDir, '100', true);

    // Then: Phase-level SUMMARY.md is created
    expect(phaseSummaryExists('100')).toBe(true);
  });

  it('includes phase name and completion date in generated SUMMARY.md', () => {
    // Given: Phase with plan summaries
    addPlan('100', '01', ['src/foo.ts']);
    addPlanSummary('100', '01', 'Implemented foo module', 2);

    // When: cmdPhaseComplete runs
    const { cmdPhaseComplete } = require('../../.claude/get-shit-done/bin/lib/phase.cjs');
    cmdPhaseComplete(tempDir, '100', true);

    // Then: SUMMARY.md contains phase name and date
    const summary = readPhaseSummary('100');
    expect(summary).not.toBeNull();
    expect(summary).toContain('test phase');  // phase name with dashes replaced by spaces
    expect(summary).toContain('**Status:** Complete');
    expect(summary).toContain('**Date:**');
    expect(summary).toContain('**Plans:**');
  });

  it('lists accomplishments from plan SUMMARY one-liners', () => {
    // Given: Phase with 2 plan summaries containing one-liners
    addPlan('100', '01', ['src/foo.ts']);
    addPlan('100', '02', ['src/bar.ts']);
    addPlanSummary('100', '01', 'Implemented foo validation logic', 2);
    addPlanSummary('100', '02', 'Added bar caching layer', 3);

    // When: cmdPhaseComplete runs
    const { cmdPhaseComplete } = require('../../.claude/get-shit-done/bin/lib/phase.cjs');
    cmdPhaseComplete(tempDir, '100', true);

    // Then: Accomplishments section lists both one-liners
    const summary = readPhaseSummary('100');
    expect(summary).toContain('## Accomplishments');
    expect(summary).toContain('Implemented foo validation logic');
    expect(summary).toContain('Added bar caching layer');
  });

  it('lists files changed from plan frontmatter', () => {
    // Given: Phase with plans listing files_modified
    addPlan('100', '01', ['src/foo.ts', 'src/bar.ts']);
    addPlan('100', '02', ['src/baz.ts']);
    addPlanSummary('100', '01', 'Foo work', 1);
    addPlanSummary('100', '02', 'Baz work', 1);

    // When: cmdPhaseComplete runs
    const { cmdPhaseComplete } = require('../../.claude/get-shit-done/bin/lib/phase.cjs');
    cmdPhaseComplete(tempDir, '100', true);

    // Then: Files Changed section lists all files from plan frontmatter
    const summary = readPhaseSummary('100');
    expect(summary).toContain('## Files Changed');
    expect(summary).toContain('src/bar.ts');
    expect(summary).toContain('src/baz.ts');
    expect(summary).toContain('src/foo.ts');
  });

  it('includes test results with task count from SUMMARY files', () => {
    // Given: Phase with summaries containing Task headings
    addPlan('100', '01', ['src/foo.ts']);
    addPlan('100', '02', ['src/bar.ts']);
    addPlanSummary('100', '01', 'Foo work', 2);  // 2 tasks
    addPlanSummary('100', '02', 'Bar work', 3);  // 3 tasks

    // When: cmdPhaseComplete runs
    const { cmdPhaseComplete } = require('../../.claude/get-shit-done/bin/lib/phase.cjs');
    cmdPhaseComplete(tempDir, '100', true);

    // Then: Test Results section shows task count
    const summary = readPhaseSummary('100');
    expect(summary).toContain('## Test Results');
    expect(summary).toContain('5 tasks');   // 2 + 3 = 5
    expect(summary).toContain('2 plans');   // across 2 plan summaries
  });

  it('does NOT overwrite an existing SUMMARY.md', () => {
    // Given: Phase directory already has a SUMMARY.md
    addPlan('100', '01', ['src/foo.ts']);
    addPlanSummary('100', '01', 'Foo work', 1);

    const existingSummary = '# Existing Summary\n\nThis was created by execute-phase.\n';
    writeFileSync(
      join(tempDir, '.planning', 'phases', '100-test-phase', 'SUMMARY.md'),
      existingSummary,
      'utf-8'
    );

    // When: cmdPhaseComplete runs
    const { cmdPhaseComplete } = require('../../.claude/get-shit-done/bin/lib/phase.cjs');
    cmdPhaseComplete(tempDir, '100', true);

    // Then: Existing SUMMARY.md is preserved
    const summary = readPhaseSummary('100');
    expect(summary).toBe(existingSummary);
  });

  it('works when phase has no plan SUMMARY files (empty phase)', () => {
    // Given: Phase with plans but NO plan summaries
    addPlan('100', '01', ['src/foo.ts']);
    addPlan('100', '02', ['src/bar.ts']);
    // No summaries added

    // When: cmdPhaseComplete runs
    const { cmdPhaseComplete } = require('../../.claude/get-shit-done/bin/lib/phase.cjs');
    cmdPhaseComplete(tempDir, '100', true);

    // Then: SUMMARY.md is still generated with fallback text
    expect(phaseSummaryExists('100')).toBe(true);
    const summary = readPhaseSummary('100');
    expect(summary).toContain('## Accomplishments');
    // Files Changed should still list files from PLAN frontmatter
    expect(summary).toContain('## Files Changed');
    expect(summary).toContain('src/foo.ts');
  });
});
