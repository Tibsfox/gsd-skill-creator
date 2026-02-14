/**
 * TDD tests for the MilestoneConfigSchema Zod validation.
 *
 * Covers all 7 configuration sections:
 * - milestone (name, source_document, submitted_at, submitted_by)
 * - execution (mode, yolo, pause_points)
 * - research (enabled, web_search, max_research_time_minutes, skip_if_vision_sufficient)
 * - planning (auto_approve, review_granularity, max_plans_per_phase, require_tdd)
 * - verification (run_tests, type_check, lint, block_on_failure, coverage_threshold)
 * - resources (token_budget_pct, max_phases, max_wall_time_minutes, model_preference)
 * - notifications (on_phase_complete, on_question, on_error, on_milestone_complete)
 *
 * @module console/milestone-config.test
 */

import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import {
  MilestoneConfigSchema,
  DEFAULT_MILESTONE_CONFIG,
  type MilestoneConfig,
} from './milestone-config.js';

/** Helper: a fully valid config for reuse across tests. */
const validConfig: MilestoneConfig = {
  milestone: {
    name: 'v2.0 Dashboard Overhaul',
    source_document: 'vision.md',
    submitted_at: '2026-02-13T14:30:00Z',
    submitted_by: 'dashboard',
  },
  execution: {
    mode: 'supervised',
    yolo: false,
    pause_points: {
      after_planning: true,
      after_each_phase: true,
      after_verification: true,
    },
  },
  research: {
    enabled: true,
    web_search: false,
    max_research_time_minutes: 30,
    skip_if_vision_sufficient: true,
  },
  planning: {
    auto_approve: false,
    review_granularity: 'phase',
    max_plans_per_phase: 10,
    require_tdd: true,
  },
  verification: {
    run_tests: true,
    type_check: true,
    lint: true,
    block_on_failure: true,
    coverage_threshold: 80,
  },
  resources: {
    token_budget_pct: 50,
    max_phases: 20,
    max_wall_time_minutes: 480,
    model_preference: 'quality',
  },
  notifications: {
    on_phase_complete: true,
    on_question: true,
    on_error: true,
    on_milestone_complete: true,
  },
};

// ============================================================================
// Valid complete config
// ============================================================================

describe('MilestoneConfigSchema valid config', () => {
  it('parses a fully specified config successfully', () => {
    const result = MilestoneConfigSchema.parse(validConfig);
    expect(result).toBeDefined();
  });

  it('preserves all fields after parsing', () => {
    const result = MilestoneConfigSchema.parse(validConfig);
    expect(result.milestone.name).toBe('v2.0 Dashboard Overhaul');
    expect(result.execution.mode).toBe('supervised');
    expect(result.research.max_research_time_minutes).toBe(30);
    expect(result.planning.review_granularity).toBe('phase');
    expect(result.verification.coverage_threshold).toBe(80);
    expect(result.resources.model_preference).toBe('quality');
    expect(result.notifications.on_error).toBe(true);
  });
});

// ============================================================================
// Defaults applied for partial config
// ============================================================================

describe('Defaults applied for partial config', () => {
  it('applies defaults when only milestone section is provided', () => {
    const partial = {
      milestone: {
        name: 'Minimal Config',
        submitted_at: '2026-02-13T14:30:00Z',
        submitted_by: 'dashboard',
      },
    };
    const result = MilestoneConfigSchema.parse(partial);
    expect(result.execution.mode).toBe('supervised');
    expect(result.research.enabled).toBe(true);
    expect(result.planning.require_tdd).toBe(true);
    expect(result.verification.coverage_threshold).toBe(80);
    expect(result.resources.max_phases).toBe(20);
    expect(result.notifications.on_error).toBe(true);
  });
});

// ============================================================================
// Missing milestone.name fails
// ============================================================================

describe('Missing milestone.name fails', () => {
  it('rejects config with missing milestone name', () => {
    const noName = {
      ...validConfig,
      milestone: {
        submitted_at: '2026-02-13T14:30:00Z',
        submitted_by: 'dashboard',
      },
    };
    expect(() => MilestoneConfigSchema.parse(noName)).toThrow(z.ZodError);
  });
});

// ============================================================================
// milestone.name over 100 chars fails
// ============================================================================

describe('milestone.name length validation', () => {
  it('rejects milestone name over 100 characters', () => {
    const longName = {
      ...validConfig,
      milestone: {
        ...validConfig.milestone,
        name: 'a'.repeat(101),
      },
    };
    expect(() => MilestoneConfigSchema.parse(longName)).toThrow(z.ZodError);
  });

  it('accepts milestone name of exactly 100 characters', () => {
    const maxName = {
      ...validConfig,
      milestone: {
        ...validConfig.milestone,
        name: 'a'.repeat(100),
      },
    };
    const result = MilestoneConfigSchema.parse(maxName);
    expect(result.milestone.name.length).toBe(100);
  });
});

// ============================================================================
// Invalid execution.mode fails
// ============================================================================

describe('Invalid execution.mode fails', () => {
  it('rejects invalid execution mode', () => {
    const badMode = {
      ...validConfig,
      execution: { ...validConfig.execution, mode: 'turbo' },
    };
    expect(() => MilestoneConfigSchema.parse(badMode)).toThrow(z.ZodError);
  });

  it('accepts all valid modes', () => {
    for (const mode of ['hitl', 'supervised', 'yolo'] as const) {
      const cfg = {
        ...validConfig,
        execution: { ...validConfig.execution, mode },
      };
      const result = MilestoneConfigSchema.parse(cfg);
      expect(result.execution.mode).toBe(mode);
    }
  });
});

// ============================================================================
// research.max_research_time_minutes range validation
// ============================================================================

describe('research.max_research_time_minutes range', () => {
  it('rejects value below 1', () => {
    const cfg = {
      ...validConfig,
      research: { ...validConfig.research, max_research_time_minutes: 0 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('rejects value above 120', () => {
    const cfg = {
      ...validConfig,
      research: { ...validConfig.research, max_research_time_minutes: 121 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('accepts boundary value 1', () => {
    const cfg = {
      ...validConfig,
      research: { ...validConfig.research, max_research_time_minutes: 1 },
    };
    const result = MilestoneConfigSchema.parse(cfg);
    expect(result.research.max_research_time_minutes).toBe(1);
  });

  it('accepts boundary value 120', () => {
    const cfg = {
      ...validConfig,
      research: { ...validConfig.research, max_research_time_minutes: 120 },
    };
    const result = MilestoneConfigSchema.parse(cfg);
    expect(result.research.max_research_time_minutes).toBe(120);
  });
});

// ============================================================================
// planning.max_plans_per_phase range validation
// ============================================================================

describe('planning.max_plans_per_phase range', () => {
  it('rejects value below 1', () => {
    const cfg = {
      ...validConfig,
      planning: { ...validConfig.planning, max_plans_per_phase: 0 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('rejects value above 20', () => {
    const cfg = {
      ...validConfig,
      planning: { ...validConfig.planning, max_plans_per_phase: 21 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });
});

// ============================================================================
// verification.coverage_threshold range validation
// ============================================================================

describe('verification.coverage_threshold range', () => {
  it('rejects value below 0', () => {
    const cfg = {
      ...validConfig,
      verification: { ...validConfig.verification, coverage_threshold: -1 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('rejects value above 100', () => {
    const cfg = {
      ...validConfig,
      verification: { ...validConfig.verification, coverage_threshold: 101 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('accepts boundary value 0', () => {
    const cfg = {
      ...validConfig,
      verification: { ...validConfig.verification, coverage_threshold: 0 },
    };
    const result = MilestoneConfigSchema.parse(cfg);
    expect(result.verification.coverage_threshold).toBe(0);
  });

  it('accepts boundary value 100', () => {
    const cfg = {
      ...validConfig,
      verification: { ...validConfig.verification, coverage_threshold: 100 },
    };
    const result = MilestoneConfigSchema.parse(cfg);
    expect(result.verification.coverage_threshold).toBe(100);
  });
});

// ============================================================================
// resources.token_budget_pct range validation
// ============================================================================

describe('resources.token_budget_pct range', () => {
  it('rejects value below 1', () => {
    const cfg = {
      ...validConfig,
      resources: { ...validConfig.resources, token_budget_pct: 0 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('rejects value above 100', () => {
    const cfg = {
      ...validConfig,
      resources: { ...validConfig.resources, token_budget_pct: 101 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });
});

// ============================================================================
// resources.max_wall_time_minutes range validation
// ============================================================================

describe('resources.max_wall_time_minutes range', () => {
  it('rejects value below 1', () => {
    const cfg = {
      ...validConfig,
      resources: { ...validConfig.resources, max_wall_time_minutes: 0 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('rejects value above 1440', () => {
    const cfg = {
      ...validConfig,
      resources: { ...validConfig.resources, max_wall_time_minutes: 1441 },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });
});

// ============================================================================
// Invalid review_granularity fails
// ============================================================================

describe('Invalid review_granularity fails', () => {
  it('rejects invalid review granularity', () => {
    const cfg = {
      ...validConfig,
      planning: { ...validConfig.planning, review_granularity: 'line' },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('accepts all valid granularities', () => {
    for (const g of ['phase', 'plan', 'task'] as const) {
      const cfg = {
        ...validConfig,
        planning: { ...validConfig.planning, review_granularity: g },
      };
      const result = MilestoneConfigSchema.parse(cfg);
      expect(result.planning.review_granularity).toBe(g);
    }
  });
});

// ============================================================================
// Invalid model_preference fails
// ============================================================================

describe('Invalid model_preference fails', () => {
  it('rejects invalid model preference', () => {
    const cfg = {
      ...validConfig,
      resources: { ...validConfig.resources, model_preference: 'turbo' },
    };
    expect(() => MilestoneConfigSchema.parse(cfg)).toThrow(z.ZodError);
  });

  it('accepts all valid preferences', () => {
    for (const p of ['quality', 'balanced', 'speed'] as const) {
      const cfg = {
        ...validConfig,
        resources: { ...validConfig.resources, model_preference: p },
      };
      const result = MilestoneConfigSchema.parse(cfg);
      expect(result.resources.model_preference).toBe(p);
    }
  });
});

// ============================================================================
// DEFAULT_MILESTONE_CONFIG passes schema validation
// ============================================================================

describe('DEFAULT_MILESTONE_CONFIG passes schema validation', () => {
  it('default config is valid according to schema', () => {
    const result = MilestoneConfigSchema.parse(DEFAULT_MILESTONE_CONFIG);
    expect(result).toBeDefined();
    expect(result.milestone.name).toBe(DEFAULT_MILESTONE_CONFIG.milestone.name);
  });

  it('default execution mode is supervised', () => {
    expect(DEFAULT_MILESTONE_CONFIG.execution.mode).toBe('supervised');
  });

  it('default yolo is false', () => {
    expect(DEFAULT_MILESTONE_CONFIG.execution.yolo).toBe(false);
  });

  it('default research is enabled', () => {
    expect(DEFAULT_MILESTONE_CONFIG.research.enabled).toBe(true);
  });

  it('default TDD is required', () => {
    expect(DEFAULT_MILESTONE_CONFIG.planning.require_tdd).toBe(true);
  });

  it('default coverage threshold is 80', () => {
    expect(DEFAULT_MILESTONE_CONFIG.verification.coverage_threshold).toBe(80);
  });

  it('default model preference is quality', () => {
    expect(DEFAULT_MILESTONE_CONFIG.resources.model_preference).toBe('quality');
  });
});
