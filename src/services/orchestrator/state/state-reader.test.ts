/**
 * Tests for the ProjectStateReader service.
 *
 * Uses temporary directory fixtures to test:
 * - Uninitialized state for nonexistent directory
 * - Complete .planning/ directory with all four files
 * - Graceful degradation when individual files are missing
 * - Empty .planning/ directory (all has* flags false)
 * - Phase directory path resolution from phases/ subdirectory
 * - Config settings accessible via state.config.*
 * - Full integration with realistic fixture content
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdir, writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { ProjectStateReader } from './state-reader.js';

// ============================================================================
// Fixtures
// ============================================================================

const FIXTURE_ROADMAP = `# Roadmap: Test Project v1.0

## Overview

A test project roadmap.

## Phases

- [x] **Phase 1: Foundation** (Complete 2026-01-15) - Core setup
- [ ] **Phase 2: Features** - Build features
- [ ] **Phase 3: Testing** - Add tests

## Phase Details

### Phase 1: Foundation
Plans:
- [x] 1-01-PLAN.md -- Setup project structure
- [x] 1-02-PLAN.md -- Add type definitions

### Phase 2: Features
Plans:
- [x] 2-01-PLAN.md -- Implement core logic
- [ ] 2-02-PLAN.md -- Add validation
`;

const FIXTURE_STATE = `# Project State

## Project Reference

See: .planning/PROJECT.md

## Current Position

Phase: 2 of 3 (Features)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-08 -- Completed 2-01-PLAN.md
Progress: [████░░░░░░] 50% (3/6 plans)

## Shipped Milestones

None yet.

## Accumulated Context

### Decisions

- [v1.0 init]: Use TypeScript with strict mode
- [1-01]: Use Zod for runtime validation

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-08
Stopped at: Phase 2, plan 1 of 2 complete
Resume file: .planning/phases/02-features/2-02-PLAN.md
`;

const FIXTURE_PROJECT = `# Test Project

## Core Value

Type-safe project management.

## Current Milestone: v1.0 MVP

## What This Is

A test project for validating the state reader.
`;

const FIXTURE_CONFIG = JSON.stringify({
  mode: 'yolo',
  depth: 'comprehensive',
  parallelization: true,
  commit_docs: false,
  model_profile: 'quality',
  workflow: {
    research: true,
    plan_check: true,
    verifier: true,
  },
});

// ============================================================================
// Tests
// ============================================================================

describe('ProjectStateReader', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(
      tmpdir(),
      `gsd-state-reader-test-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    );
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  // ============================================================================
  // Uninitialized / nonexistent directory
  // ============================================================================

  it('returns uninitialized state for nonexistent directory', async () => {
    const reader = new ProjectStateReader(join(testDir, 'nonexistent'));
    const state = await reader.read();

    expect(state.initialized).toBe(false);
    expect(state.phases).toEqual([]);
    expect(state.plansByPhase).toEqual({});
    expect(state.position).toBeNull();
    expect(state.project).toBeNull();
    expect(state.state).toBeNull();
    expect(state.hasRoadmap).toBe(false);
    expect(state.hasState).toBe(false);
    expect(state.hasProject).toBe(false);
    expect(state.hasConfig).toBe(false);
    // Config should still be present with defaults
    expect(state.config).toBeDefined();
    expect(state.config.mode).toBe('interactive');
  });

  // ============================================================================
  // Complete .planning/ directory
  // ============================================================================

  it('reads complete .planning/ directory with all four files', async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'ROADMAP.md'), FIXTURE_ROADMAP);
    await writeFile(join(testDir, 'STATE.md'), FIXTURE_STATE);
    await writeFile(join(testDir, 'PROJECT.md'), FIXTURE_PROJECT);
    await writeFile(join(testDir, 'config.json'), FIXTURE_CONFIG);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.initialized).toBe(true);
    expect(state.hasRoadmap).toBe(true);
    expect(state.hasState).toBe(true);
    expect(state.hasProject).toBe(true);
    expect(state.hasConfig).toBe(true);

    // Roadmap data
    expect(state.phases).toHaveLength(3);
    expect(state.phases[0].number).toBe('1');
    expect(state.phases[0].complete).toBe(true);
    expect(state.phases[1].number).toBe('2');
    expect(state.phases[1].complete).toBe(false);
    expect(state.plansByPhase['1']).toHaveLength(2);
    expect(state.plansByPhase['2']).toHaveLength(2);

    // State/position data
    expect(state.position).not.toBeNull();
    expect(state.position!.phase).toBe(2);
    expect(state.position!.totalPhases).toBe(3);
    expect(state.position!.phaseName).toBe('Features');
    expect(state.position!.plan).toBe(1);
    expect(state.position!.totalPlans).toBe(2);
    expect(state.position!.progressPercent).toBe(50);

    // Full parsed state
    expect(state.state).not.toBeNull();
    expect(state.state!.decisions).toHaveLength(2);

    // Project data
    expect(state.project).not.toBeNull();
    expect(state.project!.name).toBe('Test Project');
    expect(state.project!.coreValue).toBe('Type-safe project management.');
    expect(state.project!.currentMilestone).toBe('v1.0 MVP');

    // Config data
    expect(state.config.mode).toBe('yolo');
    expect(state.config.depth).toBe('comprehensive');
    expect(state.config.model_profile).toBe('quality');
  });

  // ============================================================================
  // Missing individual files
  // ============================================================================

  it('handles missing ROADMAP.md (hasRoadmap=false, phases=[])', async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'STATE.md'), FIXTURE_STATE);
    await writeFile(join(testDir, 'PROJECT.md'), FIXTURE_PROJECT);
    await writeFile(join(testDir, 'config.json'), FIXTURE_CONFIG);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.initialized).toBe(true);
    expect(state.hasRoadmap).toBe(false);
    expect(state.phases).toEqual([]);
    expect(state.plansByPhase).toEqual({});

    // Other files still parsed
    expect(state.hasState).toBe(true);
    expect(state.hasProject).toBe(true);
    expect(state.hasConfig).toBe(true);
  });

  it('handles missing STATE.md (hasState=false, position=null)', async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'ROADMAP.md'), FIXTURE_ROADMAP);
    await writeFile(join(testDir, 'PROJECT.md'), FIXTURE_PROJECT);
    await writeFile(join(testDir, 'config.json'), FIXTURE_CONFIG);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.initialized).toBe(true);
    expect(state.hasState).toBe(false);
    expect(state.position).toBeNull();
    expect(state.state).toBeNull();

    // Other files still parsed
    expect(state.hasRoadmap).toBe(true);
    expect(state.hasProject).toBe(true);
  });

  it('handles missing PROJECT.md (hasProject=false, project=null)', async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'ROADMAP.md'), FIXTURE_ROADMAP);
    await writeFile(join(testDir, 'STATE.md'), FIXTURE_STATE);
    await writeFile(join(testDir, 'config.json'), FIXTURE_CONFIG);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.initialized).toBe(true);
    expect(state.hasProject).toBe(false);
    expect(state.project).toBeNull();

    // Other files still parsed
    expect(state.hasRoadmap).toBe(true);
    expect(state.hasState).toBe(true);
  });

  it('handles missing config.json (hasConfig=false, config uses defaults)', async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'ROADMAP.md'), FIXTURE_ROADMAP);
    await writeFile(join(testDir, 'STATE.md'), FIXTURE_STATE);
    await writeFile(join(testDir, 'PROJECT.md'), FIXTURE_PROJECT);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.initialized).toBe(true);
    expect(state.hasConfig).toBe(false);
    // Config should have Zod defaults
    expect(state.config.mode).toBe('interactive');
    expect(state.config.depth).toBe('standard');
    expect(state.config.parallelization).toBe(false);
    expect(state.config.commit_docs).toBe(true);
  });

  // ============================================================================
  // Empty .planning/ directory
  // ============================================================================

  it('handles empty .planning/ directory (all has* flags false)', async () => {
    await mkdir(testDir, { recursive: true });

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.initialized).toBe(true);
    expect(state.hasRoadmap).toBe(false);
    expect(state.hasState).toBe(false);
    expect(state.hasProject).toBe(false);
    expect(state.hasConfig).toBe(false);
    expect(state.phases).toEqual([]);
    expect(state.plansByPhase).toEqual({});
    expect(state.position).toBeNull();
    expect(state.project).toBeNull();
    expect(state.state).toBeNull();
    // Config defaults
    expect(state.config.mode).toBe('interactive');
  });

  // ============================================================================
  // Phase directory resolution
  // ============================================================================

  it('resolves phase directory paths for phases with matching directories', async () => {
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'phases', '01-foundation'), { recursive: true });
    await mkdir(join(testDir, 'phases', '02-features'), { recursive: true });
    await writeFile(join(testDir, 'ROADMAP.md'), FIXTURE_ROADMAP);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.phases).toHaveLength(3);
    // Phase 1 should match 01-foundation
    expect(state.phases[0].directory).toBe('01-foundation');
    // Phase 2 should match 02-features
    expect(state.phases[1].directory).toBe('02-features');
    // Phase 3 has no matching directory
    expect(state.phases[2].directory).toBeUndefined();
  });

  it('leaves directory undefined for phases without matching directories', async () => {
    await mkdir(testDir, { recursive: true });
    // Only create directory for phase 1, not phase 2 or 3
    await mkdir(join(testDir, 'phases', '01-foundation'), { recursive: true });
    await writeFile(join(testDir, 'ROADMAP.md'), FIXTURE_ROADMAP);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.phases[0].directory).toBe('01-foundation');
    expect(state.phases[1].directory).toBeUndefined();
    expect(state.phases[2].directory).toBeUndefined();
  });

  it('handles missing phases/ directory (no directory resolution)', async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'ROADMAP.md'), FIXTURE_ROADMAP);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    // Phases parsed from roadmap but no directory resolution
    expect(state.phases).toHaveLength(3);
    expect(state.phases[0].directory).toBeUndefined();
    expect(state.phases[1].directory).toBeUndefined();
    expect(state.phases[2].directory).toBeUndefined();
  });

  // ============================================================================
  // Config settings accessible
  // ============================================================================

  it('config settings are accessible via state.config.*', async () => {
    await mkdir(testDir, { recursive: true });
    await writeFile(join(testDir, 'config.json'), FIXTURE_CONFIG);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    expect(state.config.mode).toBe('yolo');
    expect(state.config.depth).toBe('comprehensive');
    expect(state.config.parallelization).toBe(true);
    expect(state.config.commit_docs).toBe(false);
    expect(state.config.model_profile).toBe('quality');
    expect(state.config.workflow).toEqual({
      research: true,
      plan_check: true,
      verifier: true,
    });
  });

  // ============================================================================
  // Full integration with realistic fixtures
  // ============================================================================

  it('full integration: realistic .planning/ directory matching this project', async () => {
    // Create realistic directory structure
    await mkdir(testDir, { recursive: true });
    await mkdir(join(testDir, 'phases', '36-discovery-foundation'), { recursive: true });
    await mkdir(join(testDir, 'phases', '37-state-reading-infrastructure'), { recursive: true });

    const realisticRoadmap = `# Roadmap: GSD Skill Creator v1.7

## Phases

- [x] **Phase 36: Discovery Foundation** (Complete 2026-02-08) - Scan filesystem to build runtime capability map
- [ ] **Phase 37: State Reading Infrastructure** - Read .planning/ artifacts into typed ProjectState

## Phase Details

### Phase 36: Discovery Foundation
Plans:
- [x] 36-01-PLAN.md -- Zod type schemas, command file parser, and filesystem scanner (wave 1)
- [x] 36-02-PLAN.md -- Agent parser, team parser, and discovery service with mtime cache (wave 2)
- [x] 36-03-PLAN.md -- Auto-detection, error tolerance, and integration tests (wave 3)

### Phase 37: State Reading Infrastructure
Plans:
- [x] 37-01-PLAN.md -- ProjectState type schemas, readFileSafe, roadmap/state/project parsers (wave 1)
- [ ] 37-02-PLAN.md -- Config reader with dual-format support, state reader assembly (wave 2)
`;

    const realisticState = `# Project State

## Current Position

Phase: 37 of 44 (State Reading Infrastructure)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-08 -- Completed 37-01-PLAN.md
Progress: [█░░░░░░░░░] 18% (4/22 plans)

## Accumulated Context

### Decisions

- [v1.7 init]: GSD core is source of truth, orchestrator adapts dynamically

### Pending Todos

None.

### Blockers/Concerns

None.

## Session Continuity

Last session: 2026-02-08
Stopped at: Phase 37, plan 1 of 2 complete
Resume file: .planning/phases/37-state-reading-infrastructure/37-02-PLAN.md
`;

    const realisticProject = `# GSD Skill Creator

## Core Value

Skills, agents, and teams must match official Claude Code patterns.

## Current Milestone: v1.7 GSD Master Orchestration Agent

## What This Is

A TypeScript project for creating and validating Claude Code skills, agents, teams, and discovering patterns.
`;

    await writeFile(join(testDir, 'ROADMAP.md'), realisticRoadmap);
    await writeFile(join(testDir, 'STATE.md'), realisticState);
    await writeFile(join(testDir, 'PROJECT.md'), realisticProject);
    await writeFile(join(testDir, 'config.json'), FIXTURE_CONFIG);

    const reader = new ProjectStateReader(testDir);
    const state = await reader.read();

    // Fully initialized
    expect(state.initialized).toBe(true);
    expect(state.hasRoadmap).toBe(true);
    expect(state.hasState).toBe(true);
    expect(state.hasProject).toBe(true);
    expect(state.hasConfig).toBe(true);

    // Phases with directory resolution
    expect(state.phases).toHaveLength(2);
    expect(state.phases[0].number).toBe('36');
    expect(state.phases[0].directory).toBe('36-discovery-foundation');
    expect(state.phases[1].number).toBe('37');
    expect(state.phases[1].directory).toBe('37-state-reading-infrastructure');

    // Plans by phase
    expect(state.plansByPhase['36']).toHaveLength(3);
    expect(state.plansByPhase['37']).toHaveLength(2);

    // Position
    expect(state.position).not.toBeNull();
    expect(state.position!.phase).toBe(37);
    expect(state.position!.totalPhases).toBe(44);
    expect(state.position!.phaseName).toBe('State Reading Infrastructure');
    expect(state.position!.plan).toBe(1);
    expect(state.position!.totalPlans).toBe(2);

    // Project
    expect(state.project!.name).toBe('GSD Skill Creator');
    expect(state.project!.currentMilestone).toBe('v1.7 GSD Master Orchestration Agent');

    // Config
    expect(state.config.mode).toBe('yolo');
    expect(state.config.model_profile).toBe('quality');
  });
});
