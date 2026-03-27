import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  parseMarkdownSections,
  parseMarkdownTable,
  parseProjectMd,
  parseRequirementsMd,
  parseRoadmapMd,
  parseStateMd,
  parseMilestonesMd,
  parsePlanningDir,
} from './parser.js';

// ---------------------------------------------------------------------------
// Fixtures — realistic excerpts based on actual .planning/ file formats
// ---------------------------------------------------------------------------

const PROJECT_MD = `# GSD Skill Creator

## What This Is

A self-evolving skill ecosystem for Claude Code that observes usage patterns, suggests skill creation, and composes related skills into purpose-built agents.

## Core Value

Skills, agents, and teams must match official Claude Code patterns so they work correctly when loaded by Claude Code.

## Requirements

### Validated

- Pattern observation and session monitoring (v1.0)
- Skill suggestion when patterns repeat 3+ times (v1.0)

### Active

<!-- v1.12 GSD Planning Docs Dashboard -->

### Out of Scope

- GUI/web interface
- Real-time collaboration

## Current Milestone: v1.12 GSD Planning Docs Dashboard

**Goal:** A living documentation system that mirrors \`.planning/\` artifacts into browsable, machine-readable HTML.

**Target features:**
- Generator script converting \`.planning/\` markdown to structured HTML
- Dashboard index page with aggregated project health view

## Current State

v1.12 milestone started 2026-02-12. Building GSD Planning Docs Dashboard.

## Context

- Built with TypeScript, Vitest for testing, Zod for validation
- ~130,000 LOC TypeScript across 14 milestones (v1.0-v1.11 + v1.8.1)

## Constraints

- **Backward compatibility**: All new features must not break existing skill format
- **Token efficiency**: Generated skills must respect progressive disclosure
- **Local-first**: No mandatory cloud dependencies

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extension fields under metadata.extensions.gsd-skill-creator | Namespaced to avoid conflicts | Good |
| Bounded learning (3+ corrections, 7-day cooldown) | Prevents runaway refinements | Good |
| Local embeddings over API calls | No network dependency | Good |

---
*Last updated: 2026-02-12*
`;

const REQUIREMENTS_MD = `# Requirements: v1.12 GSD Planning Docs Dashboard

## Goal

A living documentation system that mirrors \`.planning/\` artifacts into browsable, machine-readable HTML.

## Requirements

### Generator Core

- **REQ-001**: Markdown parser reads \`.planning/\` artifacts and extracts structured data
- **REQ-002**: HTML renderer converts parsed artifact data into valid HTML5
- **REQ-003**: CSS styling embedded in generated pages

### Dashboard Index

- **REQ-005**: Dashboard index page aggregates project health
- **REQ-006**: Index page displays current milestone progress

### Quality

- **REQ-028**: All generator modules have unit tests with 80% coverage
- **REQ-029**: Integration test validates output HTML structure
`;

const ROADMAP_MD = `# Roadmap: v1.12 GSD Planning Docs Dashboard

## Phase 88: Generator Core
**Status:** active
**Goal:** Markdown parser + HTML renderer + CLI entry point
**Requirements:** REQ-001, REQ-002, REQ-003, REQ-004
**Deliverables:**
- \`src/dashboard/parser.ts\`
- \`src/dashboard/renderer.ts\`
- \`src/dashboard/generator.ts\`
- Unit tests for parser and renderer

## Phase 89: Dashboard Index Page
**Status:** pending
**Goal:** The main dashboard page with aggregated project health
**Requirements:** REQ-005, REQ-006, REQ-007, REQ-008
**Deliverables:**
- \`src/dashboard/pages/index.ts\`
- Current milestone progress from ROADMAP.md
- Unit tests for stats aggregation

## Phase 90: Individual Artifact Pages
**Status:** pending
**Goal:** Dedicated pages for requirements, roadmap, milestones, and state
**Requirements:** REQ-009, REQ-010, REQ-011, REQ-012, REQ-013
**Deliverables:**
- \`src/dashboard/pages/requirements.ts\`
- \`src/dashboard/pages/roadmap.ts\`
- \`src/dashboard/pages/milestones.ts\`
- \`src/dashboard/pages/state.ts\`

---

**Total:** 3 phases (88-90) | 13 requirements
`;

const STATE_MD = `# State

## Current Position

Milestone: v1.12 GSD Planning Docs Dashboard
Phase: 88 (Generator Core) — active
Status: Executing phase 88

Progress: 0/6 phases complete | 0/30 requirements delivered

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-12)

**Core value:** Skills must match official Claude Code patterns
**Current focus:** Building dashboard generator core

## Accumulated Context

### Config
- Mode: yolo
- Depth: comprehensive
- Model profile: quality (opus executors)
- Parallelization: enabled
- commit_docs: false

### v1.12 Scope
- 6 phases (88-93), 30 requirements

### Todos
- (none)

### Blockers
- (none)

## Performance Metrics

| Metric | Value |
|--------|-------|
| Plans completed | 0 |
| Plans total | TBD |
| Commits this milestone | 0 |
| LOC added | 0 |

## Session Continuity

Last: 2026-02-12 — v1.12 milestone started
Stopped at: About to plan Phase 88
Next action: Plan and execute Phase 88

---
*Last updated: 2026-02-12*
`;

const MILESTONES_MD = `# Milestones: GSD Skill Creator

## Shipped

### v1.0 — Core Skill Management (Phases 1-5)
**Goal:** Build the foundational 6-step loop
**Shipped:** 2026-01-31
**Requirements:** 43 | **Phases:** 5 | **Plans:** 15

### v1.1 — Semantic Conflict Detection (Phases 6-9)
**Goal:** Add quality assurance with semantic conflict detection
**Shipped:** 2026-02-04
**Requirements:** 10 | **Phases:** 4 | **Plans:** 12

### v1.9 — Ecosystem Alignment (Phases 62-70)
**Goal:** Spec alignment, progressive disclosure, cross-platform portability
**Shipped:** 2026-02-12
**Requirements:** 49 | **Phases:** 9 | **Plans:** 37

**Key accomplishments:**
- Spec-aligned skill generation
- Progressive disclosure: large skills auto-decompose
- 5-platform portability

### v1.10 — Security Hardening (Phases 71-81)
**Goal:** Address all 16 findings from comprehensive security audit
**Shipped:** 2026-02-12
**Requirements:** 39 | **Phases:** 11 | **Plans:** 24

**Key accomplishments:**
- Path traversal prevention
- YAML safe deserialization
- JSONL integrity

---

**Totals:** 4 milestones | 29 phases | 88 plans
`;

// ---------------------------------------------------------------------------
// parseMarkdownSections
// ---------------------------------------------------------------------------

describe('parseMarkdownSections', () => {
  it('splits content by ## headings', () => {
    const content = `# Title

Intro text.

## Section One

First section content.

## Section Two

Second section content.
`;
    const sections = parseMarkdownSections(content);
    expect(sections.length).toBe(2);
    expect(sections[0].title).toBe('Section One');
    expect(sections[0].level).toBe(2);
    expect(sections[0].content).toContain('First section content.');
    expect(sections[1].title).toBe('Section Two');
    expect(sections[1].content).toContain('Second section content.');
  });

  it('handles ### level headings', () => {
    const content = `## Parent

### Child One

Child one content.

### Child Two

Child two content.
`;
    const sections = parseMarkdownSections(content, 3);
    expect(sections.length).toBe(2);
    expect(sections[0].title).toBe('Child One');
    expect(sections[0].level).toBe(3);
  });

  it('returns empty array for content with no headings at specified level', () => {
    const sections = parseMarkdownSections('Just plain text.', 2);
    expect(sections).toEqual([]);
  });

  it('handles empty content', () => {
    const sections = parseMarkdownSections('');
    expect(sections).toEqual([]);
  });

  it('preserves content between headings including sub-headings', () => {
    const content = `## Parent

Some text.

### Sub-heading

Sub content.

## Next Parent

More text.
`;
    const sections = parseMarkdownSections(content);
    expect(sections[0].title).toBe('Parent');
    expect(sections[0].content).toContain('### Sub-heading');
    expect(sections[0].content).toContain('Sub content.');
    expect(sections[1].title).toBe('Next Parent');
  });
});

// ---------------------------------------------------------------------------
// parseMarkdownTable
// ---------------------------------------------------------------------------

describe('parseMarkdownTable', () => {
  it('parses a standard markdown table', () => {
    const table = `| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Extension fields | Namespaced | Good |
| Bounded learning | Prevents runaway | Good |
`;
    const rows = parseMarkdownTable(table);
    expect(rows.length).toBe(2);
    expect(rows[0]).toEqual({
      Decision: 'Extension fields',
      Rationale: 'Namespaced',
      Outcome: 'Good',
    });
    expect(rows[1]).toEqual({
      Decision: 'Bounded learning',
      Rationale: 'Prevents runaway',
      Outcome: 'Good',
    });
  });

  it('handles table embedded in other content', () => {
    const content = `Some text before.

| Name | Value |
|------|-------|
| Plans completed | 0 |
| LOC added | 500 |

Some text after.
`;
    const rows = parseMarkdownTable(content);
    expect(rows.length).toBe(2);
    expect(rows[0].Name).toBe('Plans completed');
    expect(rows[0].Value).toBe('0');
  });

  it('returns empty array when no table found', () => {
    const rows = parseMarkdownTable('Just plain text, no table here.');
    expect(rows).toEqual([]);
  });

  it('returns empty array for empty content', () => {
    const rows = parseMarkdownTable('');
    expect(rows).toEqual([]);
  });

  it('trims whitespace from cell values', () => {
    const table = `| Key   |   Value   |
|-------|-----------|
|  foo  |   bar   |
`;
    const rows = parseMarkdownTable(table);
    expect(rows[0].Key).toBe('foo');
    expect(rows[0].Value).toBe('bar');
  });

  it('handles a single data row', () => {
    const table = `| A | B |
|---|---|
| x | y |
`;
    const rows = parseMarkdownTable(table);
    expect(rows.length).toBe(1);
    expect(rows[0]).toEqual({ A: 'x', B: 'y' });
  });
});

// ---------------------------------------------------------------------------
// parseProjectMd
// ---------------------------------------------------------------------------

describe('parseProjectMd', () => {
  it('extracts project name from top-level heading', () => {
    const data = parseProjectMd(PROJECT_MD);
    expect(data.name).toBe('GSD Skill Creator');
  });

  it('extracts description from What This Is section', () => {
    const data = parseProjectMd(PROJECT_MD);
    expect(data.description).toContain('self-evolving skill ecosystem');
  });

  it('extracts current milestone name and version', () => {
    const data = parseProjectMd(PROJECT_MD);
    expect(data.currentMilestone.version).toBe('v1.12');
    expect(data.currentMilestone.name).toBe('GSD Planning Docs Dashboard');
  });

  it('extracts context items', () => {
    const data = parseProjectMd(PROJECT_MD);
    expect(data.context.length).toBeGreaterThan(0);
    expect(data.context.some((c) => c.includes('TypeScript'))).toBe(true);
  });

  it('extracts constraints', () => {
    const data = parseProjectMd(PROJECT_MD);
    expect(data.constraints.length).toBe(3);
    expect(data.constraints[0]).toContain('Backward compatibility');
  });

  it('extracts key decisions from table', () => {
    const data = parseProjectMd(PROJECT_MD);
    expect(data.decisions.length).toBe(3);
    expect(data.decisions[0].decision).toContain('Extension fields');
    expect(data.decisions[0].rationale).toContain('Namespaced');
    expect(data.decisions[0].outcome).toBe('Good');
  });

  it('handles content with no decisions table', () => {
    const minimal = `# My Project

## What This Is

A simple project.
`;
    const data = parseProjectMd(minimal);
    expect(data.name).toBe('My Project');
    expect(data.decisions).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// parseRequirementsMd
// ---------------------------------------------------------------------------

describe('parseRequirementsMd', () => {
  it('extracts goal', () => {
    const data = parseRequirementsMd(REQUIREMENTS_MD);
    expect(data.goal).toContain('living documentation system');
  });

  it('extracts requirement groups', () => {
    const data = parseRequirementsMd(REQUIREMENTS_MD);
    expect(data.groups.length).toBe(3);
    expect(data.groups[0].name).toBe('Generator Core');
    expect(data.groups[1].name).toBe('Dashboard Index');
    expect(data.groups[2].name).toBe('Quality');
  });

  it('extracts requirements with IDs', () => {
    const data = parseRequirementsMd(REQUIREMENTS_MD);
    const core = data.groups[0];
    expect(core.requirements.length).toBe(3);
    expect(core.requirements[0].id).toBe('REQ-001');
    expect(core.requirements[0].text).toContain('Markdown parser');
    expect(core.requirements[1].id).toBe('REQ-002');
    expect(core.requirements[2].id).toBe('REQ-003');
  });

  it('handles empty content', () => {
    const data = parseRequirementsMd('');
    expect(data.goal).toBe('');
    expect(data.groups).toEqual([]);
  });

  it('handles content with no requirements', () => {
    const data = parseRequirementsMd(`# Requirements

## Goal

Some goal here.

## Requirements
`);
    expect(data.goal).toBe('Some goal here.');
    expect(data.groups).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// parseRoadmapMd
// ---------------------------------------------------------------------------

describe('parseRoadmapMd', () => {
  it('extracts all phases', () => {
    const data = parseRoadmapMd(ROADMAP_MD);
    expect(data.phases.length).toBe(3);
    expect(data.totalPhases).toBe(3);
  });

  it('extracts phase number and name', () => {
    const data = parseRoadmapMd(ROADMAP_MD);
    expect(data.phases[0].number).toBe(88);
    expect(data.phases[0].name).toBe('Generator Core');
    expect(data.phases[1].number).toBe(89);
    expect(data.phases[1].name).toBe('Dashboard Index Page');
  });

  it('extracts phase status', () => {
    const data = parseRoadmapMd(ROADMAP_MD);
    expect(data.phases[0].status).toBe('active');
    expect(data.phases[1].status).toBe('pending');
    expect(data.phases[2].status).toBe('pending');
  });

  it('extracts phase goal', () => {
    const data = parseRoadmapMd(ROADMAP_MD);
    expect(data.phases[0].goal).toContain('Markdown parser');
  });

  it('extracts phase requirements', () => {
    const data = parseRoadmapMd(ROADMAP_MD);
    expect(data.phases[0].requirements).toEqual([
      'REQ-001',
      'REQ-002',
      'REQ-003',
      'REQ-004',
    ]);
  });

  it('extracts phase deliverables', () => {
    const data = parseRoadmapMd(ROADMAP_MD);
    expect(data.phases[0].deliverables.length).toBe(4);
    expect(data.phases[0].deliverables[0]).toContain('parser.ts');
  });

  it('handles empty content', () => {
    const data = parseRoadmapMd('');
    expect(data.phases).toEqual([]);
    expect(data.totalPhases).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// parseStateMd
// ---------------------------------------------------------------------------

describe('parseStateMd', () => {
  it('extracts milestone', () => {
    const data = parseStateMd(STATE_MD);
    expect(data.milestone).toBe('v1.12 GSD Planning Docs Dashboard');
  });

  it('extracts phase', () => {
    const data = parseStateMd(STATE_MD);
    expect(data.phase).toContain('88');
  });

  it('extracts status', () => {
    const data = parseStateMd(STATE_MD);
    expect(data.status).toContain('Executing');
  });

  it('extracts progress', () => {
    const data = parseStateMd(STATE_MD);
    expect(data.progress).toContain('0/6');
  });

  it('extracts focus', () => {
    const data = parseStateMd(STATE_MD);
    expect(data.focus).toContain('dashboard generator core');
  });

  it('extracts blockers (empty when none)', () => {
    const data = parseStateMd(STATE_MD);
    expect(data.blockers).toEqual([]);
  });

  it('extracts metrics from table', () => {
    const data = parseStateMd(STATE_MD);
    expect(data.metrics['Plans completed']).toBe('0');
    expect(data.metrics['LOC added']).toBe('0');
  });

  it('extracts next action from session continuity', () => {
    const data = parseStateMd(STATE_MD);
    expect(data.nextAction).toContain('Phase 88');
  });

  it('handles empty content', () => {
    const data = parseStateMd('');
    expect(data.milestone).toBe('');
    expect(data.phase).toBe('');
    expect(data.status).toBe('');
    expect(data.blockers).toEqual([]);
    expect(data.metrics).toEqual({});
  });

  it('extracts blockers when present', () => {
    const stateWithBlockers = `# State

## Current Position

Milestone: v1.12
Phase: 88
Status: Blocked

## Accumulated Context

### Blockers
- Missing API key for external service
- Upstream dependency not published
`;
    const data = parseStateMd(stateWithBlockers);
    expect(data.blockers.length).toBe(2);
    expect(data.blockers[0]).toContain('Missing API key');
    expect(data.blockers[1]).toContain('Upstream dependency');
  });
});

// ---------------------------------------------------------------------------
// parseMilestonesMd
// ---------------------------------------------------------------------------

describe('parseMilestonesMd', () => {
  it('extracts all milestones', () => {
    const data = parseMilestonesMd(MILESTONES_MD);
    expect(data.milestones.length).toBe(4);
  });

  it('extracts milestone version and name', () => {
    const data = parseMilestonesMd(MILESTONES_MD);
    expect(data.milestones[0].version).toBe('v1.0');
    expect(data.milestones[0].name).toBe('Core Skill Management (Phases 1-5)');
  });

  it('extracts milestone goal', () => {
    const data = parseMilestonesMd(MILESTONES_MD);
    expect(data.milestones[0].goal).toContain('foundational 6-step loop');
  });

  it('extracts shipped date', () => {
    const data = parseMilestonesMd(MILESTONES_MD);
    expect(data.milestones[0].shipped).toBe('2026-01-31');
    expect(data.milestones[1].shipped).toBe('2026-02-04');
  });

  it('extracts stats (requirements, phases, plans)', () => {
    const data = parseMilestonesMd(MILESTONES_MD);
    expect(data.milestones[0].stats.requirements).toBe(43);
    expect(data.milestones[0].stats.phases).toBe(5);
    expect(data.milestones[0].stats.plans).toBe(15);
  });

  it('extracts key accomplishments when present', () => {
    const data = parseMilestonesMd(MILESTONES_MD);
    // v1.9 has key accomplishments
    const v19 = data.milestones.find((m) => m.version === 'v1.9');
    expect(v19).toBeDefined();
    expect(v19!.accomplishments).toBeDefined();
    expect(v19!.accomplishments!.length).toBeGreaterThan(0);
    expect(v19!.accomplishments![0]).toContain('Spec-aligned');
  });

  it('extracts totals from footer', () => {
    const data = parseMilestonesMd(MILESTONES_MD);
    expect(data.totals.milestones).toBe(4);
    expect(data.totals.phases).toBe(29);
    expect(data.totals.plans).toBe(88);
  });

  it('handles empty content', () => {
    const data = parseMilestonesMd('');
    expect(data.milestones).toEqual([]);
    expect(data.totals).toEqual({ milestones: 0, phases: 0, plans: 0 });
  });

  it('computes totals from stats when no totals footer exists', () => {
    const noTotals = `# Shipped Milestones

### v1.0 — First Release (Phases 1-3)

**Goal:** Ship the initial version.
**Shipped:** 2026-01-15

**Requirements:** 10 | **Phases:** 3 | **Plans:** 8

### v1.1 — Second Release (Phases 4-6)

**Goal:** Add more features.
**Shipped:** 2026-02-01

**Requirements:** 5 | **Phases:** 2 | **Plans:** 4
`;
    const data = parseMilestonesMd(noTotals);
    expect(data.milestones).toHaveLength(2);
    // Totals computed from individual milestone stats
    expect(data.totals.milestones).toBe(2);
    expect(data.totals.phases).toBe(5); // 3 + 2
    expect(data.totals.plans).toBe(12); // 8 + 4
  });

  it('treats empty accomplishments list as undefined', () => {
    const withEmptyAccomp = `# Shipped Milestones

### v1.0 — Release (Phases 1-3)

**Goal:** Ship it.
**Shipped:** 2026-01-15

**Requirements:** 10 | **Phases:** 3 | **Plans:** 8

**Key accomplishments:**

**Totals:** 1 milestones | 3 phases | 8 plans
`;
    const data = parseMilestonesMd(withEmptyAccomp);
    expect(data.milestones).toHaveLength(1);
    expect(data.milestones[0].accomplishments).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// parsePlanningDir
// ---------------------------------------------------------------------------

const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

vi.mock('node:fs/promises', () => ({
  readFile: mockReadFile,
}));

describe('parsePlanningDir', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  it('reads all planning files and returns combined data', async () => {
    mockReadFile.mockImplementation((path: string) => {
      if (path.endsWith('PROJECT.md')) return Promise.resolve(PROJECT_MD);
      if (path.endsWith('REQUIREMENTS.md'))
        return Promise.resolve(REQUIREMENTS_MD);
      if (path.endsWith('ROADMAP.md')) return Promise.resolve(ROADMAP_MD);
      if (path.endsWith('STATE.md')) return Promise.resolve(STATE_MD);
      if (path.endsWith('MILESTONES.md'))
        return Promise.resolve(MILESTONES_MD);
      return Promise.reject(new Error('ENOENT'));
    });

    const data = await parsePlanningDir('/fake/.planning');

    expect(data.project).toBeDefined();
    expect(data.project!.name).toBe('GSD Skill Creator');
    expect(data.requirements).toBeDefined();
    expect(data.requirements!.groups.length).toBe(3);
    expect(data.roadmap).toBeDefined();
    expect(data.roadmap!.phases.length).toBe(3);
    expect(data.state).toBeDefined();
    expect(data.state!.milestone).toContain('v1.12');
    expect(data.milestones).toBeDefined();
    expect(data.milestones!.milestones.length).toBe(4);
    expect(data.generatedAt).toBeDefined();
  });

  it('returns partial data when some files are missing', async () => {
    mockReadFile.mockImplementation((path: string) => {
      if (path.endsWith('PROJECT.md')) return Promise.resolve(PROJECT_MD);
      if (path.endsWith('STATE.md')) return Promise.resolve(STATE_MD);
      return Promise.reject(new Error('ENOENT'));
    });

    const data = await parsePlanningDir('/fake/.planning');

    expect(data.project).toBeDefined();
    expect(data.state).toBeDefined();
    expect(data.requirements).toBeUndefined();
    expect(data.roadmap).toBeUndefined();
    expect(data.milestones).toBeUndefined();
    expect(data.generatedAt).toBeDefined();
  });

  it('returns only generatedAt when all files are missing', async () => {
    mockReadFile.mockRejectedValue(new Error('ENOENT'));

    const data = await parsePlanningDir('/fake/.planning');

    expect(data.project).toBeUndefined();
    expect(data.requirements).toBeUndefined();
    expect(data.roadmap).toBeUndefined();
    expect(data.state).toBeUndefined();
    expect(data.milestones).toBeUndefined();
    expect(data.generatedAt).toBeDefined();
  });
});
