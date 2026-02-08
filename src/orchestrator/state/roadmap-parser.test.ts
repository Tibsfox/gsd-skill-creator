/**
 * Tests for the ROADMAP.md parser.
 *
 * Covers:
 * - Phase checkbox extraction with complete/incomplete status
 * - Per-phase plan list extraction from detail sections
 * - Decimal phase numbers (e.g., Phase 37.1)
 * - Null return for empty/invalid input
 * - Edge cases: special characters, malformed lines, no detail sections
 */

import { describe, it, expect } from 'vitest';
import { parseRoadmap } from './roadmap-parser.js';

// ============================================================================
// Fixtures
// ============================================================================

const COMPLETE_ROADMAP = `# Roadmap: GSD Skill Creator v1.7

## Overview

The GSD Master Orchestration Agent transforms GSD from a memorize-28-commands system into a conversational routing layer.

## Phases

- [x] **Phase 36: Discovery Foundation** (Complete 2026-02-08) - Scan filesystem to build runtime capability map
- [ ] **Phase 37: State Reading Infrastructure** - Read .planning/ artifacts into typed ProjectState
- [ ] **Phase 38: Intent Classification** - Map natural language to GSD commands
- [ ] **Phase 39: Lifecycle Coordination** - Determine next valid actions from project state

## Phase Details

### Phase 36: Discovery Foundation
**Goal**: Orchestrator knows what GSD commands, agents, and teams are installed
**Depends on**: Nothing (first phase)

Plans:
- [x] 36-01-PLAN.md -- Zod type schemas, command file parser, and filesystem scanner (wave 1)
- [x] 36-02-PLAN.md -- Agent parser, team parser, and discovery service with mtime cache (wave 2)
- [x] 36-03-PLAN.md -- Auto-detection, error tolerance, and integration tests (wave 3)

### Phase 37: State Reading Infrastructure
**Goal**: Orchestrator can read .planning/ artifacts
**Depends on**: Nothing

Plans:
- [ ] 37-01-PLAN.md -- ProjectState type schemas, readFileSafe, roadmap/state/project parsers (wave 1)
- [ ] 37-02-PLAN.md -- Config reader with dual-format support, state reader assembly (wave 2)

### Phase 38: Intent Classification
**Goal**: User can describe what they want in natural language

Plans:
- [ ] 38-01 -- Exact match pass-through and Bayes classifier
- [ ] 38-02 -- Lifecycle stage filtering and argument extraction
`;

const ROADMAP_WITH_DECIMAL_PHASES = `# Roadmap

## Phases

- [x] **Phase 37: State Reading** (Complete 2026-02-10) - Read state
- [ ] **Phase 37.1: Hotfix Parsing** - Fix edge case in parser
- [ ] **Phase 38: Intent Classification** - Classify intent

## Phase Details

### Phase 37: State Reading
Plans:
- [x] 37-01 -- Type schemas and parsers
- [x] 37-02 -- Config reader

### Phase 37.1: Hotfix Parsing
Plans:
- [ ] 37.1-01 -- Fix decimal number edge case

### Phase 38: Intent Classification
Plans:
- [ ] 38-01 -- Bayes classifier
`;

const ROADMAP_NO_DETAILS = `# Roadmap

## Phases

- [x] **Phase 1: Foundation** (Complete 2026-01-15) - Core infrastructure
- [x] **Phase 2: Validation** (Complete 2026-01-20) - Schema validation
- [ ] **Phase 3: Testing** - Test framework

## Progress

Some progress notes here.
`;

const ROADMAP_SPECIAL_CHARS = `# Roadmap

## Phases

- [x] **Phase 10: CLI: Commands & Arguments** (Complete 2026-01-30) - Build CLI with sub-commands
- [ ] **Phase 11: Documentation & Guides** - Write docs

## Phase Details

### Phase 10: CLI: Commands & Arguments
Plans:
- [x] 10-01-PLAN.md -- CLI framework setup
- [x] 10-02-PLAN.md: Core command registration

### Phase 11: Documentation & Guides
Plans:
- [ ] 11-01-PLAN.md -- API reference & usage guide
`;

// ============================================================================
// Core parsing
// ============================================================================

describe('parseRoadmap', () => {
  it('parses complete ROADMAP.md with mix of complete/incomplete phases', () => {
    const result = parseRoadmap(COMPLETE_ROADMAP);
    expect(result).not.toBeNull();
    expect(result!.phases).toHaveLength(4);

    // First phase: complete
    expect(result!.phases[0]).toMatchObject({
      number: '36',
      name: 'Discovery Foundation',
      complete: true,
      completedInfo: 'Complete 2026-02-08',
      description: 'Scan filesystem to build runtime capability map',
    });

    // Second phase: incomplete
    expect(result!.phases[1]).toMatchObject({
      number: '37',
      name: 'State Reading Infrastructure',
      complete: false,
      description: 'Read .planning/ artifacts into typed ProjectState',
    });
    expect(result!.phases[1].completedInfo).toBeUndefined();

    // Third phase
    expect(result!.phases[2]).toMatchObject({
      number: '38',
      name: 'Intent Classification',
      complete: false,
    });

    // Fourth phase
    expect(result!.phases[3]).toMatchObject({
      number: '39',
      name: 'Lifecycle Coordination',
      complete: false,
    });
  });

  it('extracts plan lists per phase from detail sections', () => {
    const result = parseRoadmap(COMPLETE_ROADMAP);
    expect(result).not.toBeNull();

    // Phase 36: 3 complete plans
    const phase36Plans = result!.plansByPhase['36'];
    expect(phase36Plans).toHaveLength(3);
    expect(phase36Plans[0]).toMatchObject({
      id: '36-01',
      complete: true,
      description: 'Zod type schemas, command file parser, and filesystem scanner (wave 1)',
    });
    expect(phase36Plans[1]).toMatchObject({
      id: '36-02',
      complete: true,
    });
    expect(phase36Plans[2]).toMatchObject({
      id: '36-03',
      complete: true,
    });

    // Phase 37: 2 incomplete plans
    const phase37Plans = result!.plansByPhase['37'];
    expect(phase37Plans).toHaveLength(2);
    expect(phase37Plans[0]).toMatchObject({
      id: '37-01',
      complete: false,
      description: 'ProjectState type schemas, readFileSafe, roadmap/state/project parsers (wave 1)',
    });
    expect(phase37Plans[1]).toMatchObject({
      id: '37-02',
      complete: false,
    });

    // Phase 38: plans without -PLAN.md suffix
    const phase38Plans = result!.plansByPhase['38'];
    expect(phase38Plans).toHaveLength(2);
    expect(phase38Plans[0]).toMatchObject({
      id: '38-01',
      complete: false,
      description: 'Exact match pass-through and Bayes classifier',
    });
  });

  it('handles decimal phase numbers (e.g., Phase 37.1)', () => {
    const result = parseRoadmap(ROADMAP_WITH_DECIMAL_PHASES);
    expect(result).not.toBeNull();
    expect(result!.phases).toHaveLength(3);

    expect(result!.phases[0]).toMatchObject({
      number: '37',
      name: 'State Reading',
      complete: true,
    });

    expect(result!.phases[1]).toMatchObject({
      number: '37.1',
      name: 'Hotfix Parsing',
      complete: false,
    });

    expect(result!.phases[2]).toMatchObject({
      number: '38',
      name: 'Intent Classification',
      complete: false,
    });

    // Decimal phase plans
    const phase37_1Plans = result!.plansByPhase['37.1'];
    expect(phase37_1Plans).toHaveLength(1);
    expect(phase37_1Plans[0]).toMatchObject({
      id: '37.1-01',
      complete: false,
    });
  });

  it('returns null for empty string', () => {
    expect(parseRoadmap('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(parseRoadmap('   \n\t  \n  ')).toBeNull();
  });

  it('returns null for content with no Phases section', () => {
    const content = `# Roadmap

## Overview

Just an overview with no phases section.

## Progress

Nothing here either.
`;
    expect(parseRoadmap(content)).toBeNull();
  });

  it('handles ROADMAP with no phase detail sections (just the checkbox list)', () => {
    const result = parseRoadmap(ROADMAP_NO_DETAILS);
    expect(result).not.toBeNull();
    expect(result!.phases).toHaveLength(3);

    expect(result!.phases[0]).toMatchObject({
      number: '1',
      name: 'Foundation',
      complete: true,
      completedInfo: 'Complete 2026-01-15',
    });

    expect(result!.phases[2]).toMatchObject({
      number: '3',
      name: 'Testing',
      complete: false,
    });

    // No detail sections, so plansByPhase should be empty or have empty arrays
    expect(Object.keys(result!.plansByPhase)).toHaveLength(0);
  });

  it('handles (Complete 2026-02-08) parenthetical on completed phases', () => {
    const result = parseRoadmap(COMPLETE_ROADMAP);
    expect(result).not.toBeNull();

    // Phase 36 has completedInfo
    expect(result!.phases[0].completedInfo).toBe('Complete 2026-02-08');

    // Phase 37 does not
    expect(result!.phases[1].completedInfo).toBeUndefined();
  });

  it('skips malformed phase lines gracefully (does not crash)', () => {
    const content = `# Roadmap

## Phases

- [x] **Phase 36: Discovery Foundation** (Complete 2026-02-08) - Scan filesystem
- This is not a valid phase line
- [ ] broken line without phase format
- [x] **Phase 37: State Reading** - Read state
- [x] not a phase **but has bold**

## Phase Details

### Phase 36: Discovery Foundation
Plans:
- [x] 36-01 -- Type schemas
- this is not a plan line
- [x] 36-02 -- Parser
`;
    const result = parseRoadmap(content);
    expect(result).not.toBeNull();
    // Should only have 2 valid phases, skipping malformed lines
    expect(result!.phases).toHaveLength(2);
    expect(result!.phases[0].number).toBe('36');
    expect(result!.phases[1].number).toBe('37');

    // Should only have 2 valid plans, skipping malformed line
    expect(result!.plansByPhase['36']).toHaveLength(2);
  });

  it('handles phase names with colons and special characters', () => {
    const result = parseRoadmap(ROADMAP_SPECIAL_CHARS);
    expect(result).not.toBeNull();
    expect(result!.phases).toHaveLength(2);

    expect(result!.phases[0]).toMatchObject({
      number: '10',
      name: 'CLI: Commands & Arguments',
      complete: true,
    });

    expect(result!.phases[1]).toMatchObject({
      number: '11',
      name: 'Documentation & Guides',
      complete: false,
    });
  });

  it('handles plan lines with colon separator instead of --', () => {
    const result = parseRoadmap(ROADMAP_SPECIAL_CHARS);
    expect(result).not.toBeNull();

    const phase10Plans = result!.plansByPhase['10'];
    expect(phase10Plans).toHaveLength(2);
    expect(phase10Plans[1]).toMatchObject({
      id: '10-02',
      complete: true,
      description: 'Core command registration',
    });
  });

  it('handles #### phase headings (milestone-grouped format)', () => {
    const content = `# Roadmap

## Phases

- [x] **Phase 1: Foundation** - Core setup

## Phase Details

#### Phase 1: Foundation
Plans:
- [x] 1-01 -- Setup project
- [x] 1-02 -- Add types
`;
    const result = parseRoadmap(content);
    expect(result).not.toBeNull();
    expect(result!.plansByPhase['1']).toHaveLength(2);
  });
});

// ============================================================================
// Capability extraction
// ============================================================================

describe('capability extraction', () => {
  const ROADMAP_WITH_CAPABILITIES = `# Roadmap

## Phases

- [ ] **Phase 10: Skill Injection** - Inject skills into plans

## Phase Details

### Phase 10: Skill Injection
**Goal**: Inject discovered skills into executor context
**Capabilities**: use: skill/beautiful-commits, agent/gsd-executor

Plans:
- [ ] 10-01 -- Wiring plan
`;

  const ROADMAP_MULTI_PHASE_CAPABILITIES = `# Roadmap

## Phases

- [ ] **Phase 10: Skill Injection** - Inject skills
- [ ] **Phase 11: Agent Wiring** - Wire agents

## Phase Details

### Phase 10: Skill Injection
**Goal**: Inject skills
**Capabilities**: use: skill/beautiful-commits, skill/typescript-patterns

Plans:
- [ ] 10-01 -- Wiring

### Phase 11: Agent Wiring
**Goal**: Wire agents
**Capabilities**: create: agent/new-agent

Plans:
- [ ] 11-01 -- Agent scaffolding
`;

  it('extracts capabilities from phases with Capabilities line', () => {
    const result = parseRoadmap(ROADMAP_WITH_CAPABILITIES);
    expect(result).not.toBeNull();
    expect(result!.capabilitiesByPhase).toBeDefined();

    const caps = result!.capabilitiesByPhase!['10'];
    expect(caps).toHaveLength(2);
    expect(caps[0]).toMatchObject({
      verb: 'use',
      type: 'skill',
      name: 'beautiful-commits',
    });
    expect(caps[1]).toMatchObject({
      verb: 'use',
      type: 'agent',
      name: 'gsd-executor',
    });
  });

  it('returns no capabilitiesByPhase for roadmaps without Capabilities lines', () => {
    const result = parseRoadmap(COMPLETE_ROADMAP);
    expect(result).not.toBeNull();
    // capabilitiesByPhase should be undefined (omitted from output)
    expect(result!.capabilitiesByPhase).toBeUndefined();
  });

  it('extracts capabilities from multiple phases', () => {
    const result = parseRoadmap(ROADMAP_MULTI_PHASE_CAPABILITIES);
    expect(result).not.toBeNull();
    expect(result!.capabilitiesByPhase).toBeDefined();

    const phase10 = result!.capabilitiesByPhase!['10'];
    expect(phase10).toHaveLength(2);
    expect(phase10[0]).toMatchObject({ verb: 'use', type: 'skill', name: 'beautiful-commits' });
    expect(phase10[1]).toMatchObject({ verb: 'use', type: 'skill', name: 'typescript-patterns' });

    const phase11 = result!.capabilitiesByPhase!['11'];
    expect(phase11).toHaveLength(1);
    expect(phase11[0]).toMatchObject({ verb: 'create', type: 'agent', name: 'new-agent' });
  });
});
