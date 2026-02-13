/**
 * Tests for the plan-vs-summary differ.
 *
 * Covers:
 * - parsePlanContent: extracting files_modified, must_have artifacts/truths, phase/plan
 * - parseSummaryContent: extracting files, accomplishments, deviations
 * - diffPlanVsSummary: scope change detection (on_track, expanded, contracted, shifted)
 */

import { describe, it, expect } from 'vitest';

// Import the module under test (does not exist yet -- RED phase)
import {
  diffPlanVsSummary,
  parsePlanContent,
  parseSummaryContent,
} from './plan-summary-differ.js';

// ============================================================================
// Sample PLAN.md content for tests
// ============================================================================

const SAMPLE_PLAN = `---
phase: 86-wrapper-commands
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - project-claude/commands/wrap/execute.md
  - project-claude/commands/wrap/verify.md
  - project-claude/commands/wrap/wrappers.test.ts
autonomous: true

must_haves:
  truths:
    - "/wrap:execute N loads phase-relevant skills"
    - "Both wrappers read integration config before executing"
  artifacts:
    - path: "project-claude/commands/wrap/execute.md"
      provides: "/wrap:execute wrapper command"
      min_lines: 120
    - path: "project-claude/commands/wrap/verify.md"
      provides: "/wrap:verify wrapper command"
      min_lines: 120
    - path: "project-claude/commands/wrap/wrappers.test.ts"
      provides: "Structural validation tests"
      min_lines: 80
---

<objective>
Build the wrappers.
</objective>
`;

const MINIMAL_PLAN = `---
phase: 85-session-start
plan: 02
type: execute
wave: 1
files_modified:
  - src/commands/status.ts
---

<objective>
Minimal plan.
</objective>
`;

// ============================================================================
// Sample SUMMARY.md content for tests
// ============================================================================

const SAMPLE_SUMMARY = `---
phase: 86-wrapper-commands
plan: 01
subsystem: commands
tags: [wrapper, gsd-integration]
duration: 3min
completed: 2026-02-12
---

# Phase 86 Plan 01: Execute/Verify Wrapper Commands Summary

**Skill-enhanced GSD wrappers**

## Accomplishments
- Replaced stub execute.md with full 224-line wrapper
- Replaced stub verify.md with full 230-line wrapper
- Created 47 structural validation tests

## Files Created/Modified
- \`project-claude/commands/wrap/execute.md\` - Full /wrap:execute wrapper
- \`project-claude/commands/wrap/verify.md\` - Full /wrap:verify wrapper
- \`project-claude/commands/wrap/wrappers.test.ts\` - 47 tests

## Deviations from Plan

None - plan executed exactly as written.
`;

const SUMMARY_WITH_DEVIATIONS = `---
phase: 85-session-start
plan: 03
---

# Phase 85 Plan 03 Summary

## Accomplishments
- Built the feature
- Added extra error handling

## Files Created/Modified
- \`src/commands/status.ts\` - Main command
- \`src/commands/helpers.ts\` - Helper utilities (not planned)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added input validation**
- Found during: Task 2
- Issue: No validation on user input
- Fix: Added Zod schema validation

**2. [Rule 1 - Bug] Fixed null pointer in status parser**
- Found during: Task 1
- Issue: Crashed on empty STATE.md
`;

const MINIMAL_SUMMARY = `---
phase: 85-session-start
plan: 02
---

# Phase 85 Plan 02 Summary

**Minimal summary**
`;

// ============================================================================
// parsePlanContent
// ============================================================================

describe('parsePlanContent', () => {
  it('extracts files_modified from YAML frontmatter', () => {
    const result = parsePlanContent(SAMPLE_PLAN);

    expect(result.files_modified).toEqual([
      'project-claude/commands/wrap/execute.md',
      'project-claude/commands/wrap/verify.md',
      'project-claude/commands/wrap/wrappers.test.ts',
    ]);
  });

  it('extracts must_have artifact paths from frontmatter', () => {
    const result = parsePlanContent(SAMPLE_PLAN);

    expect(result.must_have_artifacts).toEqual([
      'project-claude/commands/wrap/execute.md',
      'project-claude/commands/wrap/verify.md',
      'project-claude/commands/wrap/wrappers.test.ts',
    ]);
  });

  it('extracts must_have truths from frontmatter', () => {
    const result = parsePlanContent(SAMPLE_PLAN);

    expect(result.must_have_truths).toEqual([
      '/wrap:execute N loads phase-relevant skills',
      'Both wrappers read integration config before executing',
    ]);
  });

  it('handles missing must_haves gracefully', () => {
    const result = parsePlanContent(MINIMAL_PLAN);

    expect(result.must_have_artifacts).toEqual([]);
    expect(result.must_have_truths).toEqual([]);
  });

  it('extracts phase and plan numbers', () => {
    const result = parsePlanContent(SAMPLE_PLAN);

    expect(result.phase).toBe('86-wrapper-commands');
    expect(result.plan).toBe(1);
  });
});

// ============================================================================
// parseSummaryContent
// ============================================================================

describe('parseSummaryContent', () => {
  it('extracts files from Files Created/Modified section', () => {
    const result = parseSummaryContent(SAMPLE_SUMMARY);

    const allFiles = [...result.files_created, ...result.files_modified];
    expect(allFiles).toContain('project-claude/commands/wrap/execute.md');
    expect(allFiles).toContain('project-claude/commands/wrap/verify.md');
    expect(allFiles).toContain('project-claude/commands/wrap/wrappers.test.ts');
  });

  it('extracts accomplishments from Accomplishments section', () => {
    const result = parseSummaryContent(SAMPLE_SUMMARY);

    expect(result.accomplishments.length).toBeGreaterThanOrEqual(3);
    expect(result.accomplishments[0]).toContain('execute.md');
  });

  it('extracts deviations from Deviations from Plan section', () => {
    const result = parseSummaryContent(SUMMARY_WITH_DEVIATIONS);

    expect(result.deviations.length).toBeGreaterThanOrEqual(1);
    expect(result.deviations.some((d) => d.includes('validation') || d.includes('null pointer'))).toBe(true);
  });

  it('handles "None" deviations', () => {
    const result = parseSummaryContent(SAMPLE_SUMMARY);

    expect(result.deviations).toEqual([]);
  });

  it('handles missing sections gracefully', () => {
    const result = parseSummaryContent(MINIMAL_SUMMARY);

    expect(result.accomplishments).toEqual([]);
    expect(result.deviations).toEqual([]);
    expect(result.files_created).toEqual([]);
    expect(result.files_modified).toEqual([]);
  });
});

// ============================================================================
// diffPlanVsSummary
// ============================================================================

describe('diffPlanVsSummary', () => {
  it('detects on_track when plan matches summary', () => {
    const diff = diffPlanVsSummary(SAMPLE_PLAN, SAMPLE_SUMMARY);

    expect(diff.scope_change).toBe('on_track');
  });

  it('detects emergent work (files in summary not in plan)', () => {
    const diff = diffPlanVsSummary(MINIMAL_PLAN, SUMMARY_WITH_DEVIATIONS);

    expect(diff.emergent_work.length).toBeGreaterThan(0);
    // helpers.ts is in summary but not in the minimal plan
    expect(diff.emergent_work.some((e) => e.includes('helpers.ts'))).toBe(true);
  });

  it('detects dropped items (files in plan not in summary)', () => {
    // Plan expects wrappers.test.ts but summary only has status.ts
    const diff = diffPlanVsSummary(SAMPLE_PLAN, SUMMARY_WITH_DEVIATIONS);

    expect(diff.dropped_items.length).toBeGreaterThan(0);
  });

  it('detects expanded scope', () => {
    // Summary has more files than plan
    const diff = diffPlanVsSummary(MINIMAL_PLAN, SUMMARY_WITH_DEVIATIONS);

    expect(diff.scope_change).toBe('expanded');
  });

  it('detects contracted scope', () => {
    // Plan has 3 files, summary only has status.ts
    const contractedSummary = `---
phase: 86-wrapper-commands
plan: 01
---

# Summary

## Accomplishments
- Built one file

## Files Created/Modified
- \`project-claude/commands/wrap/execute.md\` - Built

## Deviations from Plan

None
`;

    const diff = diffPlanVsSummary(SAMPLE_PLAN, contractedSummary);

    expect(diff.scope_change).toBe('contracted');
  });

  it('detects shifted scope', () => {
    // Same number of files but different ones
    const shiftedSummary = `---
phase: 86-wrapper-commands
plan: 01
---

# Summary

## Accomplishments
- Built different files

## Files Created/Modified
- \`src/totally/different/file-a.ts\` - New file
- \`src/totally/different/file-b.ts\` - New file
- \`src/totally/different/file-c.ts\` - New file

## Deviations from Plan

None
`;

    const diff = diffPlanVsSummary(SAMPLE_PLAN, shiftedSummary);

    expect(diff.scope_change).toBe('shifted');
  });

  it('captures explicit deviations from SUMMARY', () => {
    const diff = diffPlanVsSummary(MINIMAL_PLAN, SUMMARY_WITH_DEVIATIONS);

    expect(diff.deviations.length).toBeGreaterThan(0);
  });

  it('returns correct phase and plan numbers', () => {
    const diff = diffPlanVsSummary(SAMPLE_PLAN, SAMPLE_SUMMARY);

    expect(diff.phase).toBe(86);
    expect(diff.plan).toBe(1);
  });
});
