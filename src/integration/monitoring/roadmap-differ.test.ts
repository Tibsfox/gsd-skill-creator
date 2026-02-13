/**
 * Tests for the ROADMAP.md structural differ.
 *
 * Covers:
 * - parseRoadmapPhases: extracting phase numbers, names, and statuses
 * - diffRoadmap: detecting phases added, removed, reordered, and status changes
 */

import { describe, it, expect } from 'vitest';
import { diffRoadmap, parseRoadmapPhases } from './roadmap-differ.js';

// ============================================================================
// Sample ROADMAP.md content for tests (mirrors real GSD ROADMAP.md format)
// ============================================================================

const SAMPLE_ROADMAP = `# Milestone v1.11: GSD Integration Layer

**Status:** In Progress
**Phases:** 82-87

## Phases

### Phase 82: Integration Config

**Goal**: Config contract for all integration components
**Depends on**: Nothing

**Status:** Complete (2026-02-12) -- 3 plans, 6 commits, 72 tests

---

### Phase 83: Install Script

**Goal**: One-command setup
**Depends on**: Phase 82

**Status:** Complete (2026-02-12) -- 3 plans, 7 commits

---

### Phase 84: Post-Commit Hook

**Goal**: Auto-record observation data on commit
**Depends on**: Phase 82, Phase 83

**Status:** Complete (2026-02-12) -- 2 plans, 2 commits, 13 tests

---

### Phase 85: Session Start and Slash Commands

**Goal**: Slash commands for skill-creator features
**Depends on**: Phase 82, Phase 84

**Status:** Complete (2026-02-12) -- 3 plans, 6 commits, 63 tests

---

### Phase 86: Wrapper Commands

**Goal**: Wrapper commands for GSD phases
**Depends on**: Phase 82, Phase 85

**Status:** Complete (2026-02-12) -- 2 plans, 5 commits, 83 tests

---

### Phase 87: Passive Monitoring

**Goal**: Detect meaningful changes in GSD artifacts
**Depends on**: Phase 82, Phase 84

Plans:
- [ ] 87-01-PLAN.md
- [ ] 87-02-PLAN.md
- [ ] 87-03-PLAN.md

---
`;

const EXPANDED_ROADMAP = `# Milestone

## Phases

### Phase 82: Integration Config

**Status:** Complete (2026-02-12)

---

### Phase 83: Install Script

**Status:** Complete (2026-02-12)

---

### Phase 84: Post-Commit Hook

**Status:** Complete (2026-02-12)

---

### Phase 85: Session Start and Slash Commands

**Status:** Complete (2026-02-12)

---

### Phase 86: Wrapper Commands

**Status:** Complete (2026-02-12)

---

### Phase 87: Passive Monitoring

**Goal**: Detect meaningful changes

---

### Phase 88: Advanced Analytics

**Goal**: Deeper analysis features

---
`;

const REDUCED_ROADMAP = `# Milestone

## Phases

### Phase 82: Integration Config

**Status:** Complete (2026-02-12)

---

### Phase 84: Post-Commit Hook

**Status:** Complete (2026-02-12)

---
`;

const REORDERED_ROADMAP = `# Milestone

## Phases

### Phase 82: Integration Config

**Status:** Complete (2026-02-12)

---

### Phase 84: Post-Commit Hook

**Status:** Complete (2026-02-12)

---

### Phase 83: Install Script

**Status:** Complete (2026-02-12)

---
`;

const STATUS_CHANGED_ROADMAP = `# Milestone

## Phases

### Phase 82: Integration Config

**Status:** Complete (2026-02-12)

---

### Phase 83: Install Script

**Status:** Complete (2026-02-12)

---

### Phase 84: Post-Commit Hook

**Status:** Complete (2026-02-12)

---

### Phase 85: Session Start and Slash Commands

**Status:** Complete (2026-02-12)

---

### Phase 86: Wrapper Commands

**Status:** Complete (2026-02-12)

---

### Phase 87: Passive Monitoring

**Status:** Complete (2026-02-13)

---
`;

const EMPTY_ROADMAP = '';

// ============================================================================
// parseRoadmapPhases
// ============================================================================

describe('parseRoadmapPhases', () => {
  it('extracts phase numbers and names from ### Phase headers', () => {
    const phases = parseRoadmapPhases(SAMPLE_ROADMAP);

    expect(phases.length).toBe(6);
    expect(phases[0]).toEqual(
      expect.objectContaining({ number: 82, name: 'Integration Config' }),
    );
    expect(phases[5]).toEqual(
      expect.objectContaining({ number: 87, name: 'Passive Monitoring' }),
    );
  });

  it('extracts phase status from Status line', () => {
    const phases = parseRoadmapPhases(SAMPLE_ROADMAP);

    expect(phases[0].status).toBe('Complete');
    expect(phases[1].status).toBe('Complete');
  });

  it('handles Pending status', () => {
    const phases = parseRoadmapPhases(SAMPLE_ROADMAP);

    // Phase 87 has no **Status:** line with Complete/In Progress
    expect(phases[5].status).toBe('Pending');
  });

  it('handles In Progress status', () => {
    const inProgressRoadmap = `# Milestone

## Phases

### Phase 87: Passive Monitoring

**Status:** In Progress -- 1 of 3 plans complete

---
`;

    const phases = parseRoadmapPhases(inProgressRoadmap);

    expect(phases[0].status).toBe('In Progress');
  });

  it('returns phases in order they appear', () => {
    const phases = parseRoadmapPhases(SAMPLE_ROADMAP);

    const numbers = phases.map((p) => p.number);
    expect(numbers).toEqual([82, 83, 84, 85, 86, 87]);
  });

  it('handles empty ROADMAP content', () => {
    const phases = parseRoadmapPhases(EMPTY_ROADMAP);

    expect(phases).toEqual([]);
  });
});

// ============================================================================
// diffRoadmap
// ============================================================================

describe('diffRoadmap', () => {
  it('detects phase added', () => {
    const previousPhases = parseRoadmapPhases(SAMPLE_ROADMAP);

    const diff = diffRoadmap(previousPhases, EXPANDED_ROADMAP);

    expect(diff.phases_added.length).toBe(1);
    expect(diff.phases_added[0]).toEqual(
      expect.objectContaining({ number: 88, name: 'Advanced Analytics' }),
    );
  });

  it('detects phase removed', () => {
    const previousPhases = [
      { number: 82, name: 'Integration Config', status: 'Complete' },
      { number: 83, name: 'Install Script', status: 'Complete' },
      { number: 84, name: 'Post-Commit Hook', status: 'Complete' },
    ];

    const diff = diffRoadmap(previousPhases, REDUCED_ROADMAP);

    expect(diff.phases_removed.length).toBe(1);
    expect(diff.phases_removed[0]).toEqual(
      expect.objectContaining({ number: 83, name: 'Install Script' }),
    );
  });

  it('detects multiple phases added', () => {
    const previousPhases = [
      { number: 82, name: 'Integration Config', status: 'Complete' },
    ];

    const diff = diffRoadmap(previousPhases, REDUCED_ROADMAP);

    // REDUCED_ROADMAP has 82 and 84, so phase 84 is added
    expect(diff.phases_added.length).toBe(1);
    expect(diff.phases_added[0].number).toBe(84);
  });

  it('detects phase reordering', () => {
    const previousPhases = [
      { number: 82, name: 'Integration Config', status: 'Complete' },
      { number: 83, name: 'Install Script', status: 'Complete' },
      { number: 84, name: 'Post-Commit Hook', status: 'Complete' },
    ];

    const diff = diffRoadmap(previousPhases, REORDERED_ROADMAP);

    expect(diff.phases_reordered).toBe(true);
  });

  it('detects no reordering when order preserved', () => {
    const previousPhases = parseRoadmapPhases(SAMPLE_ROADMAP);

    const diff = diffRoadmap(previousPhases, SAMPLE_ROADMAP);

    expect(diff.phases_reordered).toBe(false);
  });

  it('detects status change', () => {
    const previousPhases = parseRoadmapPhases(SAMPLE_ROADMAP);

    const diff = diffRoadmap(previousPhases, STATUS_CHANGED_ROADMAP);

    expect(diff.status_changes.length).toBeGreaterThanOrEqual(1);
    const monitoringChange = diff.status_changes.find(
      (sc) => sc.phase === 87,
    );
    expect(monitoringChange).toBeDefined();
    expect(monitoringChange!.from).toBe('Pending');
    expect(monitoringChange!.to).toBe('Complete');
  });

  it('returns empty diff when nothing changed', () => {
    const previousPhases = parseRoadmapPhases(SAMPLE_ROADMAP);

    const diff = diffRoadmap(previousPhases, SAMPLE_ROADMAP);

    expect(diff.phases_added).toEqual([]);
    expect(diff.phases_removed).toEqual([]);
    expect(diff.phases_reordered).toBe(false);
    expect(diff.status_changes).toEqual([]);
  });

  it('handles first scan (null previous)', () => {
    const diff = diffRoadmap(null, SAMPLE_ROADMAP);

    // First scan is baseline capture -- no transitions
    expect(diff.phases_added).toEqual([]);
    expect(diff.phases_removed).toEqual([]);
    expect(diff.phases_reordered).toBe(false);
    expect(diff.status_changes).toEqual([]);
  });
});
