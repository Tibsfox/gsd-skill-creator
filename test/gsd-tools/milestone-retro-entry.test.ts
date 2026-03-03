/**
 * Behavioral tests for RETROSPECTIVE.md entry auto-generation in cmdMilestoneComplete.
 *
 * Proves that cmdMilestoneComplete auto-appends a structured entry to
 * RETROSPECTIVE.md during milestone ceremony. The entry follows the same
 * format as manually-written entries: ## Milestone heading, stat line,
 * ### What Was Built with per-phase accomplishments, and placeholder
 * sections for manual review.
 *
 * The core gap: RETROSPECTIVE.md entries are currently written manually
 * after each milestone, leading to inconsistent format and sometimes
 * being forgotten entirely.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

// ============================================================================
// Test fixtures
// ============================================================================

/** Minimal ROADMAP.md with phase entries for milestone stats */
function makeRoadmap(phases: Array<{ num: string; name: string; plans: number }>): string {
  const phaseDetails = phases.map(p =>
    `### Phase ${p.num}: ${p.name}\n**Goal**: Test goal\n**Requirements**: TEST-01\n**Plans**: ${p.plans} plans\n`
  ).join('\n');

  const checklistItems = phases.map(p =>
    `- [x] **Phase ${p.num}: ${p.name}** - ${p.plans}/${p.plans} plans complete (completed 2026-03-03)`
  ).join('\n');

  const tableRows = phases.map(p =>
    `| ${p.num}. ${p.name} | ${p.plans}/${p.plans} | Complete | 2026-03-03 |`
  ).join('\n');

  return `# Roadmap

## Milestones

### v1.50.11 Test Milestone (Phases ${phases[0]?.num}-${phases[phases.length - 1]?.num})

${checklistItems}

## Phase Details

${phaseDetails}

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
${tableRows}

---
*Last updated: 2026-03-03*
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
  total_phases: 2
  completed_phases: 2
  total_plans: 4
  completed_plans: 4
---

# Project State

## Current Position

Phase: 101 of 101
Plan: 2 of 2
Status: Milestone complete
Last activity: 2026-03-03
`;

/** REQUIREMENTS.md */
const REQUIREMENTS_MD = `# Requirements

- [x] **TEST-01** -- Test requirement

## Traceability

| ID | Phase | Status |
|----|-------|--------|
| TEST-01 | 100 | Complete |
`;

/** Existing RETROSPECTIVE.md with one milestone entry */
const EXISTING_RETRO = `# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.50.10 -- Previous Milestone

**Shipped:** 2026-03-02
**Phases:** 4 | **Plans:** 4 | **Tasks:** 8

### What Was Built

- **Import path fixes (536):** Fixed import paths
- **Version alignment (537):** Aligned version numbers

### What Worked

- Parallel execution

### What Was Inefficient

- Nothing major

### Key Lessons

- Keep imports consistent

### Cost Observations
- Model mix: Opus executors
`;

/** Plan SUMMARY file with one-liner */
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

# Phase ${phaseNum} Plan ${planNum}: Test Summary

**${oneLiner}**

${taskSections}
`;
}

// ============================================================================
// Test helpers
// ============================================================================

let tempDir: string;

function setupTempDir(
  phases: Array<{ num: string; name: string; plans: number }> = [
    { num: '100', name: 'First Phase', plans: 2 },
    { num: '101', name: 'Second Phase', plans: 2 },
  ]
) {
  tempDir = mkdtempSync(join(tmpdir(), 'milestone-retro-'));
  mkdirSync(join(tempDir, '.planning', 'phases'), { recursive: true });
  mkdirSync(join(tempDir, '.planning', 'milestones'), { recursive: true });
  writeFileSync(join(tempDir, '.planning', 'ROADMAP.md'), makeRoadmap(phases), 'utf-8');
  writeFileSync(join(tempDir, '.planning', 'STATE.md'), STATE_MD, 'utf-8');
  writeFileSync(join(tempDir, '.planning', 'REQUIREMENTS.md'), REQUIREMENTS_MD, 'utf-8');

  // Create phase directories with plan summaries
  for (const p of phases) {
    const dirName = `${p.num}-${p.name.toLowerCase().replace(/\s+/g, '-')}`;
    mkdirSync(join(tempDir, '.planning', 'phases', dirName), { recursive: true });
    for (let i = 1; i <= p.plans; i++) {
      const planNum = String(i).padStart(2, '0');
      writeFileSync(
        join(tempDir, '.planning', 'phases', dirName, `${p.num}-${planNum}-SUMMARY.md`),
        makePlanSummary(p.num, planNum, `${p.name} plan ${planNum} accomplishment`, 2),
        'utf-8'
      );
    }
  }
}

function readRetro(): string | null {
  const retroPath = join(tempDir, '.planning', 'RETROSPECTIVE.md');
  if (existsSync(retroPath)) {
    return readFileSync(retroPath, 'utf-8');
  }
  return null;
}

function runMilestoneComplete(version = 'v1.50.11', name = 'Test Milestone') {
  const { cmdMilestoneComplete } = require('../../.claude/get-shit-done/bin/lib/milestone.cjs');
  cmdMilestoneComplete(tempDir, version, { name }, true);
}

// ============================================================================
// Tests
// ============================================================================

describe('cmdMilestoneComplete RETROSPECTIVE.md entry generation', () => {
  let exitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setupTempDir();
    exitSpy = vi.spyOn(process, 'exit').mockImplementation((() => {}) as any);
  });

  afterEach(() => {
    exitSpy.mockRestore();
    if (tempDir) {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it('creates RETROSPECTIVE.md with header when it does not exist, and appends a structured entry', () => {
    // Given: No RETROSPECTIVE.md exists
    expect(existsSync(join(tempDir, '.planning', 'RETROSPECTIVE.md'))).toBe(false);

    // When: cmdMilestoneComplete runs
    runMilestoneComplete();

    // Then: RETROSPECTIVE.md is created with header and entry
    const retro = readRetro();
    expect(retro).not.toBeNull();
    expect(retro).toContain('# Project Retrospective');
    expect(retro).toContain('*A living document');
    expect(retro).toContain('## Milestone:');
  });

  it('entry has correct ## Milestone heading format', () => {
    // When: cmdMilestoneComplete runs
    runMilestoneComplete('v1.50.11', 'GSD Tooling Hardening');

    // Then: Heading format matches "## Milestone: {version} -- {name}"
    const retro = readRetro();
    expect(retro).toContain('## Milestone: v1.50.11 -- GSD Tooling Hardening');
  });

  it('entry has correct stat line with Shipped date and phase/plan counts', () => {
    // When: cmdMilestoneComplete runs
    runMilestoneComplete();

    // Then: Stat line includes Shipped date and counts
    const retro = readRetro();
    expect(retro).toContain('**Shipped:**');
    expect(retro).toContain('**Phases:**');
    expect(retro).toContain('**Plans:**');
  });

  it('entry includes ### What Was Built with per-phase accomplishments from SUMMARY one-liners', () => {
    // When: cmdMilestoneComplete runs
    runMilestoneComplete();

    // Then: What Was Built section has per-phase entries
    const retro = readRetro();
    expect(retro).toContain('### What Was Built');
    // Should contain phase names (from directory names)
    expect(retro).toContain('first phase');
    expect(retro).toContain('second phase');
  });

  it('entry includes ### What Worked placeholder section', () => {
    // When: cmdMilestoneComplete runs
    runMilestoneComplete();

    // Then: What Worked section exists with placeholder
    const retro = readRetro();
    expect(retro).toContain('### What Worked');
  });

  it('entry includes ### What Was Inefficient placeholder section', () => {
    // When: cmdMilestoneComplete runs
    runMilestoneComplete();

    // Then: What Was Inefficient section exists with placeholder
    const retro = readRetro();
    expect(retro).toContain('### What Was Inefficient');
  });

  it('entry includes ### Key Lessons placeholder section', () => {
    // When: cmdMilestoneComplete runs
    runMilestoneComplete();

    // Then: Key Lessons section exists with placeholder
    const retro = readRetro();
    expect(retro).toContain('### Key Lessons');
  });

  it('entry includes ### Cost Observations placeholder section', () => {
    // When: cmdMilestoneComplete runs
    runMilestoneComplete();

    // Then: Cost Observations section exists with placeholder
    const retro = readRetro();
    expect(retro).toContain('### Cost Observations');
  });

  it('inserts new entry after header, before existing entries (newest first)', () => {
    // Given: RETROSPECTIVE.md already has a previous milestone entry
    writeFileSync(join(tempDir, '.planning', 'RETROSPECTIVE.md'), EXISTING_RETRO, 'utf-8');

    // When: cmdMilestoneComplete runs
    runMilestoneComplete('v1.50.11', 'GSD Tooling Hardening');

    // Then: New entry appears BEFORE the existing v1.50.10 entry
    const retro = readRetro()!;
    const newEntryPos = retro.indexOf('## Milestone: v1.50.11');
    const oldEntryPos = retro.indexOf('## Milestone: v1.50.10');
    expect(newEntryPos).toBeGreaterThan(-1);
    expect(oldEntryPos).toBeGreaterThan(-1);
    expect(newEntryPos).toBeLessThan(oldEntryPos);
  });

  it('entry format matches manually-written entries (## heading, stat line, ### sub-headings)', () => {
    // When: cmdMilestoneComplete runs
    runMilestoneComplete('v1.50.11', 'GSD Tooling Hardening');

    // Then: Entry follows the canonical format
    const retro = readRetro()!;

    // Check ordering of sections matches the manually-written format
    const headingPos = retro.indexOf('## Milestone: v1.50.11');
    const shippedPos = retro.indexOf('**Shipped:**');
    const phasesPos = retro.indexOf('**Phases:**');
    const whatBuiltPos = retro.indexOf('### What Was Built');
    const whatWorkedPos = retro.indexOf('### What Worked');
    const inefficientPos = retro.indexOf('### What Was Inefficient');
    const lessonsPos = retro.indexOf('### Key Lessons');
    const costPos = retro.indexOf('### Cost Observations');

    // All sections present and in correct order
    expect(headingPos).toBeGreaterThan(-1);
    expect(shippedPos).toBeGreaterThan(headingPos);
    expect(phasesPos).toBeGreaterThan(shippedPos);
    expect(whatBuiltPos).toBeGreaterThan(phasesPos);
    expect(whatWorkedPos).toBeGreaterThan(whatBuiltPos);
    expect(inefficientPos).toBeGreaterThan(whatWorkedPos);
    expect(lessonsPos).toBeGreaterThan(inefficientPos);
    expect(costPos).toBeGreaterThan(lessonsPos);

    // Auto-generated note present
    expect(retro).toContain('Auto-generated by milestone ceremony');
  });
});
