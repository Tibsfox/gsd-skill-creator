/**
 * Behavioral tests for parseRoadmapStats — extracts real phase/plan
 * counts from ROADMAP.md content.
 *
 * These tests prove that the function correctly parses:
 * - Checklist items with (N/M plans) format
 * - Phase detail headings with **Plans:** N plans format
 * - Shipped milestone <details> blocks are excluded
 * - TBD/missing plan counts return 0
 * - Empty content returns zeroed result
 */

import { describe, it, expect } from 'vitest';

const { parseRoadmapStats } = require('../../.claude/get-shit-done/bin/lib/roadmap.cjs');

// ============================================================================
// Test fixtures — realistic ROADMAP.md content
// ============================================================================

/** v1.50.10-style: 4 phases, each with (1/1 plans) in checklist */
const ROADMAP_V1_50_10 = `# Roadmap

## Milestones

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

/** v1.50.11-style: 4 phases, TBD plan counts */
const ROADMAP_V1_50_11_TBD = `# Roadmap

### v1.50.11 GSD Tooling Hardening (Phases 540-543)

- [ ] **Phase 540: Milestone-Complete Stat Accuracy** - Fix gsd-tools
- [ ] **Phase 541: CLI State Preservation** - Fix STATE.md
- [ ] **Phase 542: Ceremony Automation** - Generate SUMMARY.md
- [ ] **Phase 543: Test Quality Advisory Gates** - Flag shape-only tests

## Phase Details

### Phase 540: Milestone-Complete Stat Accuracy
**Goal**: Fix milestone stats
**Plans**: TBD

### Phase 541: CLI State Preservation
**Goal**: Preserve state
**Plans**: TBD

### Phase 542: Ceremony Automation
**Goal**: Automate ceremonies
**Plans**: TBD

### Phase 543: Test Quality Advisory Gates
**Goal**: Quality gates
**Plans**: TBD
`;

/** v1.55-style: 11 phases with varying plan counts */
const ROADMAP_V1_55_STYLE = `# Roadmap

### v1.55 Full Stack Buildout (Phases 508-518)

- [x] Phase 508: RC Closure Foundation (3/3 plans) -- completed 2026-03-01
- [x] Phase 509: Electronics Gap Analysis (1/1 plans) -- completed 2026-03-01
- [x] Phase 510: Electronics Tier 1 Content (3/3 plans) -- completed 2026-03-01
- [x] Phase 511: Electronics Tier 2 Content (3/3 plans) -- completed 2026-03-01
- [x] Phase 512: Electronics Tier 3 and Assessment (3/3 plans) -- completed 2026-03-01
- [x] Phase 513: Site Design System and Print (2/2 plans) -- completed 2026-03-01
- [x] Phase 514: Site Content and WordPress (3/3 plans) -- completed 2026-03-01
- [x] Phase 515: Site CLI and Agent Discovery (2/2 plans) -- completed 2026-03-01
- [x] Phase 516: SSH Security Core (3/3 plans) -- completed 2026-03-01
- [x] Phase 517: SSH Security Verification (3/3 plans) -- completed 2026-03-02
- [x] Phase 518: Cross-Domain Validation (2/2 plans) -- completed 2026-03-02

## Phase Details

### Phase 508: RC Closure Foundation
**Goal**: Foundation
**Plans**: 3/3 plans complete

### Phase 509: Electronics Gap Analysis
**Goal**: Gap analysis
**Plans**: 1/1 plans complete

### Phase 510: Electronics Tier 1 Content
**Goal**: Tier 1
**Plans**: 3/3 plans complete

### Phase 511: Electronics Tier 2 Content
**Goal**: Tier 2
**Plans**: 3/3 plans complete

### Phase 512: Electronics Tier 3 and Assessment
**Goal**: Tier 3
**Plans**: 3/3 plans complete

### Phase 513: Site Design System and Print
**Goal**: Design system
**Plans**: 2/2 plans complete

### Phase 514: Site Content and WordPress
**Goal**: Content
**Plans**: 3/3 plans complete

### Phase 515: Site CLI and Agent Discovery
**Goal**: CLI and discovery
**Plans**: 2/2 plans complete

### Phase 516: SSH Security Core
**Goal**: SSH core
**Plans**: 3/3 plans complete

### Phase 517: SSH Security Verification
**Goal**: SSH verification
**Plans**: 3/3 plans complete

### Phase 518: Cross-Domain Validation
**Goal**: Cross-domain
**Plans**: 2/2 plans complete
`;

/** Mixed content: some complete, some pending with no plan counts */
const ROADMAP_MIXED = `# Roadmap

### v1.57 Retrospective Hardening (Phases 526-530)

- [x] Phase 526: Traceability Foundation (2/2 plans) -- completed
- [x] Phase 527: VERIFICATION.md Backfill (2/2 plans) -- completed
- [ ] Phase 528: Hook Integration Tests (1/1 plans)
- [ ] Phase 529: Behavioral Tests - plans TBD
- [ ] Phase 530: Cross-Validation

## Phase Details

### Phase 526: Traceability Foundation
**Goal**: Traceability
**Plans**: 2/2 plans complete

### Phase 527: VERIFICATION.md Backfill
**Goal**: Backfill
**Plans**: 2/2 plans complete

### Phase 528: Hook Integration Tests
**Goal**: Hooks
**Plans**: 1 plans

### Phase 529: Behavioral Tests
**Goal**: Behavioral
**Plans**: TBD

### Phase 530: Cross-Validation
**Goal**: Cross-validation
**Plans**: TBD
`;

/** Content with shipped details blocks that should be excluded */
const ROADMAP_WITH_DETAILS = `# Roadmap

<details>
<summary>v1.50 Shipped Milestone (Phases 467-480)</summary>

### Phase 467: Foundation Setup
**Plans**: 3/3 plans complete

### Phase 468: Core Engine
**Plans**: 4/4 plans complete

- [x] Phase 467: Foundation Setup (3/3 plans) -- completed
- [x] Phase 468: Core Engine (4/4 plans) -- completed

</details>

### v1.50.11 Current (Phases 540-543)

- [ ] Phase 540: Stat Accuracy (2/2 plans)
- [ ] Phase 541: State Preservation

## Phase Details

### Phase 540: Stat Accuracy
**Goal**: Fix stats
**Plans**: 2 plans

### Phase 541: State Preservation
**Goal**: Fix state
**Plans**: TBD
`;

// ============================================================================
// Tests
// ============================================================================

describe('parseRoadmapStats', () => {
  it('extracts correct counts from v1.50.10 format (N/N plans in checklist)', () => {
    const result = parseRoadmapStats(ROADMAP_V1_50_10);

    expect(result.phaseCount).toBe(4);
    expect(result.totalPlans).toBe(4);
    expect(result.perPhase).toHaveLength(4);
    expect(result.perPhase[0]).toMatchObject({ num: '536', plansTotal: 1 });
    expect(result.perPhase[1]).toMatchObject({ num: '537', plansTotal: 1 });
    expect(result.perPhase[2]).toMatchObject({ num: '538', plansTotal: 1 });
    expect(result.perPhase[3]).toMatchObject({ num: '539', plansTotal: 1 });
  });

  it('returns phaseCount but zero totalPlans for TBD entries', () => {
    const result = parseRoadmapStats(ROADMAP_V1_50_11_TBD);

    expect(result.phaseCount).toBe(4);
    expect(result.totalPlans).toBe(0);
    expect(result.perPhase).toHaveLength(4);
    expect(result.perPhase.every((p: any) => p.plansTotal === 0)).toBe(true);
  });

  it('sums varying plan counts from v1.55-style ROADMAP (11 phases)', () => {
    const result = parseRoadmapStats(ROADMAP_V1_55_STYLE);

    expect(result.phaseCount).toBe(11);
    // 3+1+3+3+3+2+3+2+3+3+2 = 28
    expect(result.totalPlans).toBe(28);
    expect(result.perPhase).toHaveLength(11);
    expect(result.perPhase[0]).toMatchObject({ num: '508', plansTotal: 3 });
    expect(result.perPhase[1]).toMatchObject({ num: '509', plansTotal: 1 });
    expect(result.perPhase[10]).toMatchObject({ num: '518', plansTotal: 2 });
  });

  it('returns zeroed result for empty content', () => {
    const result = parseRoadmapStats('');

    expect(result.phaseCount).toBe(0);
    expect(result.totalPlans).toBe(0);
    expect(result.perPhase).toEqual([]);
  });

  it('excludes phases inside <details> shipped blocks', () => {
    const result = parseRoadmapStats(ROADMAP_WITH_DETAILS);

    // Only phases 540 and 541 should be counted (467, 468 are inside <details>)
    expect(result.phaseCount).toBe(2);
    expect(result.perPhase.map((p: any) => p.num)).toEqual(['540', '541']);
    // Phase 540 has (2/2 plans) in checklist, 541 is TBD
    expect(result.totalPlans).toBe(2);
  });

  it('correctly sums only numeric plan counts in mixed complete/pending phases', () => {
    const result = parseRoadmapStats(ROADMAP_MIXED);

    expect(result.phaseCount).toBe(5);
    // Phase 526: 2, 527: 2, 528: 1, 529: 0 (TBD), 530: 0 (no count)
    expect(result.totalPlans).toBe(5);
    expect(result.perPhase[0]).toMatchObject({ num: '526', plansTotal: 2 });
    expect(result.perPhase[1]).toMatchObject({ num: '527', plansTotal: 2 });
    expect(result.perPhase[2]).toMatchObject({ num: '528', plansTotal: 1 });
    expect(result.perPhase[3]).toMatchObject({ num: '529', plansTotal: 0 });
    expect(result.perPhase[4]).toMatchObject({ num: '530', plansTotal: 0 });
  });
});
