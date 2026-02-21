/**
 * Tests for AMIGA shared data type Zod schemas.
 *
 * Covers all 8 foundation types:
 * - MissionIDSchema: validates mission-YYYY-MM-DD-NNN format
 * - ContributorIDSchema: validates contrib-[a-z0-9-]+ format
 * - AgentIDSchema: validates team prefix + number with optional sub-agent
 * - PhaseStatusSchema: enum with 8 lifecycle values
 * - AlertLevelSchema: enum with 3 severity values
 * - GateDecisionSchema: enum with 3 gate outcomes
 * - TimestampSchema: validates ISO 8601 UTC strings
 * - PrioritySchema: enum with 4 priority levels
 *
 * Also validates convenience exports:
 * - AMIGA_SCHEMAS mapping object
 * - Enum constant arrays (PHASE_STATUSES, ALERT_LEVELS, GATE_DECISIONS, PRIORITIES)
 * - TEAM_PREFIXES array
 */

import { describe, it, expect } from 'vitest';
import type { z } from 'zod';
import {
  MissionIDSchema,
  ContributorIDSchema,
  AgentIDSchema,
  PhaseStatusSchema,
  AlertLevelSchema,
  GateDecisionSchema,
  TimestampSchema,
  PrioritySchema,
  AMIGA_SCHEMAS,
  PHASE_STATUSES,
  ALERT_LEVELS,
  GATE_DECISIONS,
  PRIORITIES,
  TEAM_PREFIXES,
} from '../types.js';
import type {
  MissionID,
  ContributorID,
  AgentID,
  PhaseStatus,
  AlertLevel,
  GateDecision,
  Timestamp,
  Priority,
} from '../types.js';

// ============================================================================
// MissionIDSchema
// ============================================================================

describe('MissionIDSchema', () => {
  it('accepts valid mission IDs', () => {
    expect(MissionIDSchema.safeParse('mission-2026-02-17-001').success).toBe(true);
    expect(MissionIDSchema.safeParse('mission-2025-12-31-999').success).toBe(true);
    expect(MissionIDSchema.safeParse('mission-2000-01-01-000').success).toBe(true);
  });

  it('rejects single-digit month', () => {
    expect(MissionIDSchema.safeParse('mission-2026-2-17-001').success).toBe(false);
  });

  it('rejects random string', () => {
    expect(MissionIDSchema.safeParse('random-string').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(MissionIDSchema.safeParse('').success).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(MissionIDSchema.safeParse(123).success).toBe(false);
  });

  it('rejects missing sequence number', () => {
    expect(MissionIDSchema.safeParse('mission-2026-02-17').success).toBe(false);
  });

  it('rejects four-digit sequence number', () => {
    expect(MissionIDSchema.safeParse('mission-2026-02-17-0001').success).toBe(false);
  });

  // Type compatibility check -- MissionID should be inferred from schema
  it('inferred type is assignable from parse result', () => {
    const result = MissionIDSchema.safeParse('mission-2026-02-17-001');
    if (result.success) {
      const _id: MissionID = result.data;
      expect(typeof _id).toBe('string');
    }
  });
});

// ============================================================================
// ContributorIDSchema
// ============================================================================

describe('ContributorIDSchema', () => {
  it('accepts valid contributor IDs', () => {
    expect(ContributorIDSchema.safeParse('contrib-skill-author-abc123').success).toBe(true);
    expect(ContributorIDSchema.safeParse('contrib-a').success).toBe(true);
    expect(ContributorIDSchema.safeParse('contrib-abc-def-123').success).toBe(true);
  });

  it('rejects empty suffix after prefix', () => {
    expect(ContributorIDSchema.safeParse('contrib-').success).toBe(false);
  });

  it('rejects wrong prefix', () => {
    expect(ContributorIDSchema.safeParse('contributor-abc').success).toBe(false);
  });

  it('rejects uppercase characters', () => {
    expect(ContributorIDSchema.safeParse('contrib-ABC').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(ContributorIDSchema.safeParse('').success).toBe(false);
  });

  it('rejects non-string input', () => {
    expect(ContributorIDSchema.safeParse(42).success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = ContributorIDSchema.safeParse('contrib-test-user');
    if (result.success) {
      const _id: ContributorID = result.data;
      expect(typeof _id).toBe('string');
    }
  });
});

// ============================================================================
// AgentIDSchema
// ============================================================================

describe('AgentIDSchema', () => {
  it('accepts valid agent IDs for all team prefixes', () => {
    expect(AgentIDSchema.safeParse('CS-1').success).toBe(true);
    expect(AgentIDSchema.safeParse('ME-2').success).toBe(true);
    expect(AgentIDSchema.safeParse('CE-3').success).toBe(true);
    expect(AgentIDSchema.safeParse('GL-1').success).toBe(true);
    expect(AgentIDSchema.safeParse('OPS-1').success).toBe(true);
  });

  it('accepts sub-agent suffix', () => {
    expect(AgentIDSchema.safeParse('ME-2.r').success).toBe(true);
    expect(AgentIDSchema.safeParse('CS-1.a').success).toBe(true);
  });

  it('rejects invalid team prefix', () => {
    expect(AgentIDSchema.safeParse('XX-1').success).toBe(false);
  });

  it('rejects missing number', () => {
    expect(AgentIDSchema.safeParse('CS-').success).toBe(false);
  });

  it('rejects lowercase prefix', () => {
    expect(AgentIDSchema.safeParse('cs-1').success).toBe(false);
  });

  it('rejects uppercase sub-agent suffix', () => {
    expect(AgentIDSchema.safeParse('ME-2.R').success).toBe(false);
  });

  it('rejects multi-char sub-agent suffix', () => {
    expect(AgentIDSchema.safeParse('ME-2.ab').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(AgentIDSchema.safeParse('').success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = AgentIDSchema.safeParse('GL-1');
    if (result.success) {
      const _id: AgentID = result.data;
      expect(typeof _id).toBe('string');
    }
  });
});

// ============================================================================
// PhaseStatusSchema
// ============================================================================

describe('PhaseStatusSchema', () => {
  it('accepts all 8 valid phase statuses', () => {
    const statuses = ['BRIEFING', 'PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION', 'HOLD', 'ABORT'];
    for (const status of statuses) {
      expect(PhaseStatusSchema.safeParse(status).success).toBe(true);
    }
  });

  it('has exactly 8 enum values', () => {
    expect(PhaseStatusSchema.options).toHaveLength(8);
  });

  it('rejects unknown status', () => {
    expect(PhaseStatusSchema.safeParse('UNKNOWN').success).toBe(false);
  });

  it('rejects lowercase', () => {
    expect(PhaseStatusSchema.safeParse('briefing').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(PhaseStatusSchema.safeParse('').success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = PhaseStatusSchema.safeParse('BRIEFING');
    if (result.success) {
      const _status: PhaseStatus = result.data;
      expect(typeof _status).toBe('string');
    }
  });
});

// ============================================================================
// AlertLevelSchema
// ============================================================================

describe('AlertLevelSchema', () => {
  it('accepts all 3 valid alert levels', () => {
    expect(AlertLevelSchema.safeParse('nominal').success).toBe(true);
    expect(AlertLevelSchema.safeParse('advisory').success).toBe(true);
    expect(AlertLevelSchema.safeParse('gate').success).toBe(true);
  });

  it('has exactly 3 enum values', () => {
    expect(AlertLevelSchema.options).toHaveLength(3);
  });

  it('rejects unknown level', () => {
    expect(AlertLevelSchema.safeParse('critical').success).toBe(false);
  });

  it('rejects uppercase', () => {
    expect(AlertLevelSchema.safeParse('NOMINAL').success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = AlertLevelSchema.safeParse('nominal');
    if (result.success) {
      const _level: AlertLevel = result.data;
      expect(typeof _level).toBe('string');
    }
  });
});

// ============================================================================
// GateDecisionSchema
// ============================================================================

describe('GateDecisionSchema', () => {
  it('accepts all 3 valid gate decisions', () => {
    expect(GateDecisionSchema.safeParse('go').success).toBe(true);
    expect(GateDecisionSchema.safeParse('no_go').success).toBe(true);
    expect(GateDecisionSchema.safeParse('redirect').success).toBe(true);
  });

  it('has exactly 3 enum values', () => {
    expect(GateDecisionSchema.options).toHaveLength(3);
  });

  it('rejects unknown decision', () => {
    expect(GateDecisionSchema.safeParse('maybe').success).toBe(false);
  });

  it('rejects uppercase', () => {
    expect(GateDecisionSchema.safeParse('GO').success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = GateDecisionSchema.safeParse('go');
    if (result.success) {
      const _decision: GateDecision = result.data;
      expect(typeof _decision).toBe('string');
    }
  });
});

// ============================================================================
// TimestampSchema
// ============================================================================

describe('TimestampSchema', () => {
  it('accepts valid ISO 8601 UTC timestamps', () => {
    expect(TimestampSchema.safeParse('2026-02-17T14:30:00Z').success).toBe(true);
  });

  it('accepts timestamps with milliseconds', () => {
    expect(TimestampSchema.safeParse('2026-02-17T14:30:00.000Z').success).toBe(true);
    expect(TimestampSchema.safeParse('2026-02-17T14:30:00.123Z').success).toBe(true);
  });

  it('rejects date-only format', () => {
    expect(TimestampSchema.safeParse('2026-02-17').success).toBe(false);
  });

  it('rejects time-only format', () => {
    expect(TimestampSchema.safeParse('14:30:00').success).toBe(false);
  });

  it('rejects non-date string', () => {
    expect(TimestampSchema.safeParse('not-a-date').success).toBe(false);
  });

  it('rejects empty string', () => {
    expect(TimestampSchema.safeParse('').success).toBe(false);
  });

  it('rejects non-UTC timezone', () => {
    expect(TimestampSchema.safeParse('2026-02-17T14:30:00+05:00').success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = TimestampSchema.safeParse('2026-02-17T14:30:00Z');
    if (result.success) {
      const _ts: Timestamp = result.data;
      expect(typeof _ts).toBe('string');
    }
  });
});

// ============================================================================
// PrioritySchema
// ============================================================================

describe('PrioritySchema', () => {
  it('accepts all 4 valid priorities', () => {
    expect(PrioritySchema.safeParse('low').success).toBe(true);
    expect(PrioritySchema.safeParse('normal').success).toBe(true);
    expect(PrioritySchema.safeParse('high').success).toBe(true);
    expect(PrioritySchema.safeParse('urgent').success).toBe(true);
  });

  it('has exactly 4 enum values', () => {
    expect(PrioritySchema.options).toHaveLength(4);
  });

  it('rejects unknown priority', () => {
    expect(PrioritySchema.safeParse('critical').success).toBe(false);
  });

  it('rejects uppercase', () => {
    expect(PrioritySchema.safeParse('LOW').success).toBe(false);
  });

  // Type compatibility check
  it('inferred type is assignable from parse result', () => {
    const result = PrioritySchema.safeParse('low');
    if (result.success) {
      const _priority: Priority = result.data;
      expect(typeof _priority).toBe('string');
    }
  });
});

// ============================================================================
// Convenience exports
// ============================================================================

describe('AMIGA_SCHEMAS', () => {
  it('maps all 8 schema names to their schemas', () => {
    expect(Object.keys(AMIGA_SCHEMAS)).toHaveLength(8);
    expect(AMIGA_SCHEMAS).toHaveProperty('MissionID');
    expect(AMIGA_SCHEMAS).toHaveProperty('ContributorID');
    expect(AMIGA_SCHEMAS).toHaveProperty('AgentID');
    expect(AMIGA_SCHEMAS).toHaveProperty('PhaseStatus');
    expect(AMIGA_SCHEMAS).toHaveProperty('AlertLevel');
    expect(AMIGA_SCHEMAS).toHaveProperty('GateDecision');
    expect(AMIGA_SCHEMAS).toHaveProperty('Timestamp');
    expect(AMIGA_SCHEMAS).toHaveProperty('Priority');
  });

  it('each entry is a valid Zod schema with safeParse', () => {
    for (const [_name, schema] of Object.entries(AMIGA_SCHEMAS)) {
      expect(typeof (schema as z.ZodTypeAny).safeParse).toBe('function');
    }
  });
});

describe('Enum constant arrays', () => {
  it('PHASE_STATUSES has all 8 values', () => {
    expect(PHASE_STATUSES).toHaveLength(8);
    expect(PHASE_STATUSES).toContain('BRIEFING');
    expect(PHASE_STATUSES).toContain('ABORT');
  });

  it('ALERT_LEVELS has all 3 values', () => {
    expect(ALERT_LEVELS).toHaveLength(3);
    expect(ALERT_LEVELS).toContain('nominal');
    expect(ALERT_LEVELS).toContain('gate');
  });

  it('GATE_DECISIONS has all 3 values', () => {
    expect(GATE_DECISIONS).toHaveLength(3);
    expect(GATE_DECISIONS).toContain('go');
    expect(GATE_DECISIONS).toContain('redirect');
  });

  it('PRIORITIES has all 4 values', () => {
    expect(PRIORITIES).toHaveLength(4);
    expect(PRIORITIES).toContain('low');
    expect(PRIORITIES).toContain('urgent');
  });
});

describe('TEAM_PREFIXES', () => {
  it('contains all 5 team prefixes', () => {
    expect(TEAM_PREFIXES).toHaveLength(5);
    expect(TEAM_PREFIXES).toContain('CS');
    expect(TEAM_PREFIXES).toContain('ME');
    expect(TEAM_PREFIXES).toContain('CE');
    expect(TEAM_PREFIXES).toContain('GL');
    expect(TEAM_PREFIXES).toContain('OPS');
  });
});
