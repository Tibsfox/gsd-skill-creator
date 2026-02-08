/**
 * Tests for the lifecycle filter module.
 *
 * Verifies that deriveLifecycleStage correctly maps ProjectState flags
 * to one of 8 lifecycle stages, and filterByLifecycle narrows the
 * command list to stage-relevant commands while always including universals.
 */

import { describe, it, expect } from 'vitest';
import {
  deriveLifecycleStage,
  filterByLifecycle,
  UNIVERSAL_COMMANDS,
} from './lifecycle-filter.js';
import type { ProjectState } from '../state/types.js';
import type { GsdCommandMetadata } from '../discovery/types.js';

// ============================================================================
// Fixtures
// ============================================================================

/** Helper to create a minimal ProjectState with overrides */
function makeState(overrides: Partial<ProjectState> = {}): ProjectState {
  return {
    initialized: true,
    config: {} as ProjectState['config'],
    position: null,
    phases: [],
    plansByPhase: {},
    project: null,
    state: null,
    hasRoadmap: false,
    hasState: false,
    hasProject: false,
    hasConfig: false,
    ...overrides,
  };
}

/** Helper to create a minimal GsdCommandMetadata */
function makeCommand(name: string): GsdCommandMetadata {
  return {
    name,
    description: `Description of ${name}`,
    objective: `Objective of ${name}`,
    filePath: `/commands/${name}.md`,
  };
}

/** Full set of commands for filtering tests */
const ALL_COMMANDS: GsdCommandMetadata[] = [
  // Universal commands
  makeCommand('gsd:help'),
  makeCommand('gsd:progress'),
  makeCommand('gsd:quick'),
  makeCommand('gsd:debug'),
  makeCommand('gsd:settings'),
  makeCommand('gsd:add-todo'),
  makeCommand('gsd:pause-work'),
  makeCommand('gsd:resume-work'),
  // Stage-specific commands
  makeCommand('gsd:new-project'),
  makeCommand('gsd:new-milestone'),
  makeCommand('gsd:plan-phase'),
  makeCommand('gsd:discuss-phase'),
  makeCommand('gsd:research-phase'),
  makeCommand('gsd:list-phase-assumptions'),
  makeCommand('gsd:execute-phase'),
  makeCommand('gsd:verify-work'),
  makeCommand('gsd:audit-milestone'),
  makeCommand('gsd:complete-milestone'),
  makeCommand('gsd:plan-milestone-gaps'),
  makeCommand('gsd:add-phase'),
  makeCommand('gsd:insert-phase'),
  makeCommand('gsd:remove-phase'),
  // Unknown command (should be excluded)
  makeCommand('gsd:unknown-command'),
];

// ============================================================================
// deriveLifecycleStage
// ============================================================================

describe('deriveLifecycleStage', () => {
  it('returns "uninitialized" when project is not initialized', () => {
    const state = makeState({ initialized: false });
    expect(deriveLifecycleStage(state)).toBe('uninitialized');
  });

  it('returns "initialized" for initialized project without roadmap', () => {
    const state = makeState({ initialized: true, hasRoadmap: false });
    expect(deriveLifecycleStage(state)).toBe('initialized');
  });

  it('returns "roadmapped" when roadmap exists but no plans for first incomplete phase', () => {
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '36', name: 'Discovery', complete: true },
        { number: '37', name: 'State Reading', complete: false },
      ],
      plansByPhase: {
        // Phase 37 has no plans yet
      },
    });
    expect(deriveLifecycleStage(state)).toBe('roadmapped');
  });

  it('returns "executing" when current phase has incomplete plans', () => {
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '36', name: 'Discovery', complete: true },
        { number: '37', name: 'State Reading', complete: false },
      ],
      plansByPhase: {
        '37': [
          { id: '37-01', complete: true },
          { id: '37-02', complete: false },
        ],
      },
    });
    expect(deriveLifecycleStage(state)).toBe('executing');
  });

  it('returns "verifying" when current phase plans are all complete', () => {
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '36', name: 'Discovery', complete: true },
        { number: '37', name: 'State Reading', complete: false },
      ],
      plansByPhase: {
        '37': [
          { id: '37-01', complete: true },
          { id: '37-02', complete: true },
        ],
      },
    });
    expect(deriveLifecycleStage(state)).toBe('verifying');
  });

  it('returns "milestone-end" when all phases are complete', () => {
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '36', name: 'Discovery', complete: true },
        { number: '37', name: 'State Reading', complete: true },
        { number: '38', name: 'Intent', complete: true },
      ],
      plansByPhase: {},
    });
    expect(deriveLifecycleStage(state)).toBe('milestone-end');
  });

  it('returns "between-phases" when phases exist but current position is ambiguous', () => {
    // All phases complete BUT no plans recorded anywhere -- edge case
    // This differs from milestone-end because hasRoadmap is true and phases
    // have mixed state that doesn't clearly fit other categories
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [], // Roadmap exists but no phases parsed
    });
    expect(deriveLifecycleStage(state)).toBe('between-phases');
  });

  it('returns "roadmapped" when plansByPhase has empty array for current phase', () => {
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '38', name: 'Intent', complete: false },
      ],
      plansByPhase: {
        '38': [], // Key exists but array is empty
      },
    });
    expect(deriveLifecycleStage(state)).toBe('roadmapped');
  });

  it('handles zero-padded phase numbers in plansByPhase lookup', () => {
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '5', name: 'Phase Five', complete: false },
      ],
      plansByPhase: {
        '5': [
          { id: '05-01', complete: false },
        ],
      },
    });
    expect(deriveLifecycleStage(state)).toBe('executing');
  });

  it('skips completed phases to find first incomplete one', () => {
    const state = makeState({
      initialized: true,
      hasRoadmap: true,
      phases: [
        { number: '36', name: 'Discovery', complete: true },
        { number: '37', name: 'State', complete: true },
        { number: '38', name: 'Intent', complete: false },
      ],
      plansByPhase: {
        '38': [
          { id: '38-01', complete: false },
        ],
      },
    });
    expect(deriveLifecycleStage(state)).toBe('executing');
  });
});

// ============================================================================
// UNIVERSAL_COMMANDS
// ============================================================================

describe('UNIVERSAL_COMMANDS', () => {
  it('includes core universal commands', () => {
    expect(UNIVERSAL_COMMANDS.has('gsd:help')).toBe(true);
    expect(UNIVERSAL_COMMANDS.has('gsd:progress')).toBe(true);
    expect(UNIVERSAL_COMMANDS.has('gsd:quick')).toBe(true);
    expect(UNIVERSAL_COMMANDS.has('gsd:debug')).toBe(true);
    expect(UNIVERSAL_COMMANDS.has('gsd:add-todo')).toBe(true);
  });

  it('does not include stage-specific commands', () => {
    expect(UNIVERSAL_COMMANDS.has('gsd:plan-phase')).toBe(false);
    expect(UNIVERSAL_COMMANDS.has('gsd:execute-phase')).toBe(false);
    expect(UNIVERSAL_COMMANDS.has('gsd:new-project')).toBe(false);
  });
});

// ============================================================================
// filterByLifecycle
// ============================================================================

describe('filterByLifecycle', () => {
  it('always includes universal commands regardless of stage', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'uninitialized');
    const names = result.map(c => c.name);
    expect(names).toContain('gsd:help');
    expect(names).toContain('gsd:progress');
    expect(names).toContain('gsd:quick');
    expect(names).toContain('gsd:debug');
  });

  it('filters to new-project + universals for "uninitialized" stage', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'uninitialized');
    const stageSpecific = result.filter(c => !UNIVERSAL_COMMANDS.has(c.name));
    const names = stageSpecific.map(c => c.name);
    expect(names).toContain('gsd:new-project');
    expect(names).not.toContain('gsd:execute-phase');
    expect(names).not.toContain('gsd:plan-phase');
  });

  it('filters to new-milestone + universals for "initialized" stage', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'initialized');
    const stageSpecific = result.filter(c => !UNIVERSAL_COMMANDS.has(c.name));
    const names = stageSpecific.map(c => c.name);
    expect(names).toContain('gsd:new-milestone');
    expect(names).not.toContain('gsd:execute-phase');
  });

  it('filters to planning commands for "roadmapped" stage', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'roadmapped');
    const names = result.map(c => c.name);
    expect(names).toContain('gsd:plan-phase');
    expect(names).toContain('gsd:discuss-phase');
    expect(names).toContain('gsd:research-phase');
    expect(names).not.toContain('gsd:new-project');
  });

  it('filters to executing commands for "executing" stage', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'executing');
    const names = result.map(c => c.name);
    expect(names).toContain('gsd:execute-phase');
    expect(names).toContain('gsd:plan-phase');
    expect(names).toContain('gsd:verify-work');
    expect(names).not.toContain('gsd:new-project');
    expect(names).not.toContain('gsd:new-milestone');
  });

  it('filters to verifying commands for "verifying" stage', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'verifying');
    const names = result.map(c => c.name);
    expect(names).toContain('gsd:verify-work');
    expect(names).toContain('gsd:execute-phase');
    expect(names).not.toContain('gsd:new-project');
  });

  it('filters to milestone-end commands for "milestone-end" stage', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'milestone-end');
    const names = result.map(c => c.name);
    expect(names).toContain('gsd:audit-milestone');
    expect(names).toContain('gsd:complete-milestone');
    expect(names).toContain('gsd:new-milestone');
    expect(names).not.toContain('gsd:execute-phase');
  });

  it('excludes commands not in any stage-specific or universal set', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'uninitialized');
    const names = result.map(c => c.name);
    expect(names).not.toContain('gsd:unknown-command');
  });

  it('returns empty array when commands array is empty', () => {
    const result = filterByLifecycle([], 'executing');
    expect(result).toEqual([]);
  });

  it('filters planning stage same as roadmapped', () => {
    const roadmapped = filterByLifecycle(ALL_COMMANDS, 'roadmapped');
    const planning = filterByLifecycle(ALL_COMMANDS, 'planning');
    const roadmappedNames = roadmapped.map(c => c.name).sort();
    const planningNames = planning.map(c => c.name).sort();
    expect(planningNames).toEqual(roadmappedNames);
  });

  it('between-phases includes planning and audit commands', () => {
    const result = filterByLifecycle(ALL_COMMANDS, 'between-phases');
    const names = result.map(c => c.name);
    expect(names).toContain('gsd:plan-phase');
    expect(names).toContain('gsd:discuss-phase');
    expect(names).toContain('gsd:audit-milestone');
    expect(names).not.toContain('gsd:new-project');
  });
});
