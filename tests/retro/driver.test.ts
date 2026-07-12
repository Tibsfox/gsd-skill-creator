import { describe, it, expect } from 'vitest';
import { runRetroMilestone, summarizeRouting } from '../../src/retro/driver.js';
import type { MilestoneMetrics } from '../../src/retro/types.js';
import type { ObservationSummary } from '../../src/retro/observation-harvester.js';

function makeMetrics(overrides: Partial<MilestoneMetrics> = {}): MilestoneMetrics {
  return {
    milestone_name: 'v1.49.1051 -- Retro Driver',
    milestone_version: 'v1.49.1051',
    completion_date: '2026-07-12',
    wall_time_minutes: 180,
    estimated_wall_time_minutes: 90,
    total_tokens: 0,
    opus_tokens: 0,
    sonnet_tokens: 0,
    haiku_tokens: 0,
    context_windows: 0,
    sessions: 1,
    phases: 1,
    plans: 1,
    commits: 3,
    tests_written: 4,
    tests_passing: 4,
    requirements_total: 0,
    requirements_met: 0,
    source_loc: 250,
    ...overrides,
  };
}

const emptyObs: ObservationSummary = {
  new_patterns: [],
  skill_suggestions: [],
  promotion_candidates: [],
};

describe('retro driver', () => {
  it('renders RETROSPECTIVE.md and routes generated action items', () => {
    const result = runRetroMilestone({
      metrics: makeMetrics(),
      observations: {
        new_patterns: ['wave-based-execution'],
        skill_suggestions: ['auto-format-on-save'],
        promotion_candidates: [],
      },
    });

    // Markdown shape
    expect(result.markdown).toContain('# v1.49.1051 -- Retro Driver -- Retrospective');
    expect(result.markdown).toContain('## Action Items for Next Milestone');

    // The calibration over-estimate becomes a high-priority action item.
    expect(result.data.action_items.some((a) => a.source === 'calibration')).toBe(true);
    // The skill suggestion becomes a "Create skill for" item.
    expect(result.data.action_items.some((a) => a.description.startsWith('Create skill for'))).toBe(
      true,
    );

    // Every action item is routed.
    expect(result.routedActions).toHaveLength(result.data.action_items.length);
    // "Create skill for" → cartridge-distill.
    expect(result.routedActions.some((r) => r.verb === 'cartridge-distill')).toBe(true);
    // Calibration prose → memory-lesson (never quarantine).
    expect(result.routedActions.some((r) => r.verb === 'memory-lesson')).toBe(true);
  });

  it('folds in manual action items and routes them to concrete verbs', () => {
    const result = runRetroMilestone({
      metrics: makeMetrics({ wall_time_minutes: 90 }), // accurate → no calibration item
      observations: emptyObs,
      extraActionItems: [
        { description: 'Research agentic retrieval', source: 'manual', priority: 'high' },
        { description: 'Retire stale-linter', source: 'manual', priority: 'low' },
      ],
    });

    const verbs = result.routedActions.map((r) => r.verb);
    expect(verbs).toContain('research');
    expect(verbs).toContain('skill-retire');
    expect(summarizeRouting(result.routedActions)).toMatchObject({
      research: 1,
      'skill-retire': 1,
    });
  });

  it('threads a changelog watch result into feature action items', () => {
    const result = runRetroMilestone({
      metrics: makeMetrics({ wall_time_minutes: 90 }),
      observations: emptyObs,
      changelog: {
        version_start: 'unknown',
        version_end: '2.1.5',
        checked_at: '2026-07-12T00:00:00Z',
        features: [
          {
            name: 'Subagent streaming',
            classification: 'LEVERAGE_NOW',
            impact: 'now available',
            action: 'wire into fleet dispatch',
            version: '2.1.5',
          },
        ],
      },
    });

    expect(result.data.action_items.some((a) => a.source === 'changelog')).toBe(true);
    expect(result.markdown).toContain('Subagent streaming');
  });

  it('produces an empty routing plan when there are no action items', () => {
    const result = runRetroMilestone({
      metrics: makeMetrics({ wall_time_minutes: 90 }),
      observations: emptyObs,
    });
    expect(result.data.action_items).toHaveLength(0);
    expect(result.routedActions).toHaveLength(0);
    expect(summarizeRouting(result.routedActions)).toEqual({});
  });
});
