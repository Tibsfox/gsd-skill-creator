import { describe, it, expect } from 'vitest';
import { generateRetrospective } from '../../src/retro/template-generator.js';
import type { RetroTemplateData, ChangelogEntry } from '../../src/retro/types.js';

/**
 * Helper to create minimal valid RetroTemplateData.
 */
function makeTemplateData(overrides: Partial<RetroTemplateData> = {}): RetroTemplateData {
  return {
    metrics: {
      milestone_name: 'v1.39 -- GSD-OS Bootstrap & READY Prompt',
      milestone_version: 'v1.39',
      completion_date: '2026-02-28',
      wall_time_minutes: 120,
      estimated_wall_time_minutes: 90,
      total_tokens: 500000,
      opus_tokens: 300000,
      sonnet_tokens: 150000,
      haiku_tokens: 50000,
      context_windows: 8,
      sessions: 2,
      phases: 9,
      plans: 18,
      commits: 45,
      tests_written: 200,
      tests_passing: 200,
      requirements_total: 80,
      requirements_met: 80,
      source_loc: 12000,
    },
    calibration_deltas: [],
    observations: {
      new_patterns: [],
      skill_suggestions: [],
      promotion_candidates: [],
    },
    action_items: [],
    what_went_well: [],
    what_didnt_go_well: [],
    lessons_learned: [],
    ...overrides,
  };
}

describe('template-generator', () => {
  it('generates RETROSPECTIVE.md with all required sections', () => {
    const data = makeTemplateData();
    const output = generateRetrospective(data);

    expect(output).toContain('# v1.39 -- GSD-OS Bootstrap & READY Prompt -- Retrospective');
    expect(output).toContain('## Summary');
    expect(output).toContain('## Metrics');
    expect(output).toContain('## Changes -- Claude Code Feature Alignment');
    expect(output).toContain('### Features Leveraged');
    expect(output).toContain('### Features Coming');
    expect(output).toContain('### Features Missed');
    expect(output).toContain('## Skill-Creator Observations');
    expect(output).toContain('## Calibration Updates');
    expect(output).toContain('## Action Items for Next Milestone');
  });

  it('renders metrics table with estimated vs actual columns', () => {
    const data = makeTemplateData({
      metrics: {
        ...makeTemplateData().metrics,
        wall_time_minutes: 120,
        estimated_wall_time_minutes: 90,
      },
    });
    const output = generateRetrospective(data);

    // Table should contain the actual and estimated values
    expect(output).toContain('120');
    expect(output).toContain('90');
    // Delta: 120 - 90 = +30
    expect(output).toContain('+30');
  });

  it('maps feature classifications to correct sections', () => {
    const features: ChangelogEntry[] = [
      {
        name: 'Agent Teams',
        classification: 'LEVERAGE_NOW',
        impact: 'Direct support for multi-agent workflows',
        action: 'Integrate into GSD executor pipeline',
      },
      {
        name: 'Model Context Protocol v2',
        classification: 'PLAN_FOR',
        impact: 'Better tool integration coming',
        action: 'Review migration guide when stable',
      },
      {
        name: 'Custom Model Training',
        classification: 'WATCH',
        impact: 'Could enable domain-specific fine-tuning',
        action: 'Monitor roadmap updates',
      },
    ];

    const data = makeTemplateData({
      changelog: {
        version_start: '2.0.0',
        version_end: '2.1.5',
        checked_at: '2026-02-28T12:00:00Z',
        features,
      },
    });

    const output = generateRetrospective(data);

    // LEVERAGE_NOW -> Features Leveraged section
    const leveragedIdx = output.indexOf('### Features Leveraged');
    const comingIdx = output.indexOf('### Features Coming');
    const missedIdx = output.indexOf('### Features Missed');

    expect(leveragedIdx).toBeGreaterThan(-1);
    expect(comingIdx).toBeGreaterThan(-1);
    expect(missedIdx).toBeGreaterThan(-1);

    // Agent Teams should be in Features Leveraged (between Leveraged and Coming)
    const leveragedSection = output.slice(leveragedIdx, comingIdx);
    expect(leveragedSection).toContain('Agent Teams');

    // MCP v2 should be in Features Coming (between Coming and Missed)
    const comingSection = output.slice(comingIdx, missedIdx);
    expect(comingSection).toContain('Model Context Protocol v2');

    // Custom Model Training should be in Features Missed (after Missed)
    const missedSection = output.slice(missedIdx);
    expect(missedSection).toContain('Custom Model Training');
  });

  it('includes calibration deltas as adjustment recommendations', () => {
    const data = makeTemplateData({
      calibration_deltas: [
        {
          metric_name: 'wall_time_minutes',
          estimated: 90,
          actual: 120,
          ratio: 1.333,
          direction: 'over',
        },
        {
          metric_name: 'total_tokens',
          estimated: 600000,
          actual: 400000,
          ratio: 0.667,
          direction: 'under',
        },
      ],
    });

    const output = generateRetrospective(data);

    // Over-estimate: reduce
    expect(output).toContain('Reduce');
    expect(output).toContain('wall_time_minutes');
    expect(output).toContain('1.333');

    // Under-estimate: increase
    expect(output).toContain('Increase');
    expect(output).toContain('total_tokens');
  });

  it('renders action items as markdown checkboxes', () => {
    const data = makeTemplateData({
      action_items: [
        { description: 'Reduce wall time estimate', source: 'calibration', priority: 'high' },
        { description: 'Adopt Agent Teams feature', source: 'changelog', priority: 'high' },
        { description: 'Create auto-format skill', source: 'observation', priority: 'medium' },
      ],
    });

    const output = generateRetrospective(data);

    expect(output).toContain('- [ ] Reduce wall time estimate (calibration, high)');
    expect(output).toContain('- [ ] Adopt Agent Teams feature (changelog, high)');
    expect(output).toContain('- [ ] Create auto-format skill (observation, medium)');
  });

  it('handles missing optional sections gracefully', () => {
    const data = makeTemplateData({
      changelog: undefined,
      observations: {
        new_patterns: [],
        skill_suggestions: [],
        promotion_candidates: [],
      },
      action_items: [],
    });

    const output = generateRetrospective(data);

    // Should still produce valid markdown with all sections
    expect(output).toContain('## Summary');
    expect(output).toContain('## Metrics');
    expect(output).toContain('## Changes -- Claude Code Feature Alignment');
    expect(output).toContain('## Calibration Updates');
    expect(output).toContain('## Action Items for Next Milestone');
    // Should not crash or produce undefined/null text
    expect(output).not.toContain('undefined');
    expect(output).not.toContain('null');
  });

  it('includes placeholder prompts for human-input sections', () => {
    const data = makeTemplateData({
      what_went_well: [],
      what_didnt_go_well: [],
      lessons_learned: [],
    });

    const output = generateRetrospective(data);

    // Should have placeholder text for empty human sections
    expect(output).toContain('What Went Well');
    expect(output).toContain('What Didn\'t Go Well');
    expect(output).toContain('Lessons Learned');
    // Placeholder prompts for empty sections
    expect(output).toContain('[Add your observations]');
  });
});
