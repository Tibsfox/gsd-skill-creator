/**
 * Tests for mission manifest schema, factory, and update utility.
 *
 * Covers: MissionManifestSchema, ManifestStatusSchema, SkillEntrySchema,
 * AgentEntrySchema, TelemetryConfigSchema, PhaseEntrySchema, createManifest,
 * updateManifest.
 */

import { describe, it, expect } from 'vitest';
import {
  MissionManifestSchema,
  ManifestStatusSchema,
  SkillEntrySchema,
  AgentEntrySchema,
  TelemetryConfigSchema,
  PhaseEntrySchema,
  MANIFEST_STATUSES,
  createManifest,
  updateManifest,
} from '../manifest.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const NOW = '2026-02-18T12:00:00Z';

function validManifest() {
  return {
    mission_id: 'mission-2026-02-18-001',
    name: 'Test Mission Alpha',
    description: 'A test mission for validation',
    created_at: NOW,
    updated_at: NOW,
    status: 'draft' as const,
    phases: {
      BRIEFING: { status: 'BRIEFING', entry_criteria: [] },
      PLANNING: { status: 'BRIEFING', entry_criteria: [] },
      EXECUTION: { status: 'BRIEFING', entry_criteria: [] },
      INTEGRATION: { status: 'BRIEFING', entry_criteria: [] },
      REVIEW_GATE: { status: 'BRIEFING', entry_criteria: [] },
      COMPLETION: { status: 'BRIEFING', entry_criteria: [] },
    },
    skills: [],
    agents: [],
    telemetry_config: {
      enabled: true,
      interval_ms: 5000,
      event_types: ['TELEMETRY_UPDATE'],
    },
  };
}

// ---------------------------------------------------------------------------
// MissionManifestSchema
// ---------------------------------------------------------------------------

describe('MissionManifestSchema', () => {
  it('accepts a complete valid manifest with all required fields', () => {
    const result = MissionManifestSchema.safeParse(validManifest());
    expect(result.success).toBe(true);
  });

  it('rejects manifest missing mission_id', () => {
    const data = { ...validManifest(), mission_id: undefined };
    const result = MissionManifestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects manifest with invalid mission_id format', () => {
    const data = { ...validManifest(), mission_id: 'bad-id' };
    const result = MissionManifestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects manifest missing name', () => {
    const data = { ...validManifest(), name: undefined };
    const result = MissionManifestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('rejects manifest with invalid status value', () => {
    const data = { ...validManifest(), status: 'invalid_status' };
    const result = MissionManifestSchema.safeParse(data);
    expect(result.success).toBe(false);
  });

  it('accepts manifest with empty skills and agents arrays', () => {
    const data = validManifest();
    data.skills = [];
    data.agents = [];
    const result = MissionManifestSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('accepts manifest with passthrough (extra) fields', () => {
    const data = { ...validManifest(), extra_field: 'hello' };
    const result = MissionManifestSchema.safeParse(data);
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).extra_field).toBe('hello');
    }
  });
});

// ---------------------------------------------------------------------------
// ManifestStatusSchema
// ---------------------------------------------------------------------------

describe('ManifestStatusSchema', () => {
  it.each(['draft', 'provisioned', 'active', 'completed', 'aborted', 'archived'])(
    'accepts valid status "%s"',
    (status) => {
      const result = ManifestStatusSchema.safeParse(status);
      expect(result.success).toBe(true);
    },
  );

  it('rejects invalid status strings', () => {
    const result = ManifestStatusSchema.safeParse('running');
    expect(result.success).toBe(false);
  });

  it('exports MANIFEST_STATUSES constant array', () => {
    expect(MANIFEST_STATUSES).toEqual([
      'draft', 'provisioned', 'active', 'completed', 'aborted', 'archived',
    ]);
  });
});

// ---------------------------------------------------------------------------
// SkillEntrySchema
// ---------------------------------------------------------------------------

describe('SkillEntrySchema', () => {
  it('accepts valid skill entry with skill_id, version, loaded_at, active', () => {
    const result = SkillEntrySchema.safeParse({
      skill_id: 'pattern-detection',
      version: '1.2.0',
      loaded_at: NOW,
      active: true,
    });
    expect(result.success).toBe(true);
  });

  it('rejects skill entry missing skill_id', () => {
    const result = SkillEntrySchema.safeParse({
      version: '1.0.0',
      loaded_at: NOW,
      active: true,
    });
    expect(result.success).toBe(false);
  });

  it('rejects skill entry with invalid loaded_at timestamp', () => {
    const result = SkillEntrySchema.safeParse({
      skill_id: 'pattern-detection',
      version: '1.0.0',
      loaded_at: 'not-a-timestamp',
      active: true,
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// AgentEntrySchema
// ---------------------------------------------------------------------------

describe('AgentEntrySchema', () => {
  it('accepts valid agent entry with agent_id, role, registered_at, status', () => {
    const result = AgentEntrySchema.safeParse({
      agent_id: 'ME-1',
      role: 'Environment Manager',
      registered_at: NOW,
      status: 'registered',
    });
    expect(result.success).toBe(true);
  });

  it('rejects agent entry with invalid agent_id', () => {
    const result = AgentEntrySchema.safeParse({
      agent_id: 'INVALID-AGENT',
      role: 'Test',
      registered_at: NOW,
      status: 'registered',
    });
    expect(result.success).toBe(false);
  });

  it.each(['registered', 'active', 'idle', 'terminated'])(
    'agent status accepts "%s"',
    (status) => {
      const result = AgentEntrySchema.safeParse({
        agent_id: 'CS-1',
        role: 'Commander',
        registered_at: NOW,
        status,
      });
      expect(result.success).toBe(true);
    },
  );
});

// ---------------------------------------------------------------------------
// TelemetryConfigSchema
// ---------------------------------------------------------------------------

describe('TelemetryConfigSchema', () => {
  it('accepts valid config with enabled, interval_ms, event_types', () => {
    const result = TelemetryConfigSchema.safeParse({
      enabled: true,
      interval_ms: 5000,
      event_types: ['TELEMETRY_UPDATE', 'ALERT_SURFACE'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects config with interval_ms < 100', () => {
    const result = TelemetryConfigSchema.safeParse({
      enabled: true,
      interval_ms: 50,
      event_types: ['TELEMETRY_UPDATE'],
    });
    expect(result.success).toBe(false);
  });

  it('rejects config with empty event_types array', () => {
    const result = TelemetryConfigSchema.safeParse({
      enabled: true,
      interval_ms: 5000,
      event_types: [],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// PhaseEntrySchema
// ---------------------------------------------------------------------------

describe('PhaseEntrySchema', () => {
  it('accepts valid phase entry with status and entry_criteria', () => {
    const result = PhaseEntrySchema.safeParse({
      status: 'BRIEFING',
      entry_criteria: [{ name: 'Brief reviewed', met: false }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts criterion with optional description', () => {
    const result = PhaseEntrySchema.safeParse({
      status: 'PLANNING',
      started_at: NOW,
      entry_criteria: [
        { name: 'Brief reviewed', met: true, description: 'All team members reviewed' },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('rejects phase entry with invalid status', () => {
    const result = PhaseEntrySchema.safeParse({
      status: 'INVALID',
      entry_criteria: [],
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// createManifest factory
// ---------------------------------------------------------------------------

describe('createManifest', () => {
  it('returns a valid manifest', () => {
    const manifest = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    const result = MissionManifestSchema.safeParse(manifest);
    expect(result.success).toBe(true);
  });

  it('sets default status to draft', () => {
    const manifest = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    expect(manifest.status).toBe('draft');
  });

  it('initializes skills and agents as empty arrays', () => {
    const manifest = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    expect(manifest.skills).toEqual([]);
    expect(manifest.agents).toEqual([]);
  });

  it('initializes phases with all 6 lifecycle phases', () => {
    const manifest = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    const phaseKeys = Object.keys(manifest.phases);
    expect(phaseKeys).toEqual([
      'BRIEFING', 'PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION',
    ]);
    for (const key of phaseKeys) {
      expect(manifest.phases[key].status).toBe('BRIEFING');
      expect(manifest.phases[key].entry_criteria).toEqual([]);
    }
  });

  it('sets telemetry_config with sensible defaults', () => {
    const manifest = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    expect(manifest.telemetry_config.enabled).toBe(true);
    expect(manifest.telemetry_config.interval_ms).toBe(5000);
    expect(manifest.telemetry_config.event_types).toEqual([
      'TELEMETRY_UPDATE', 'ALERT_SURFACE', 'GATE_SIGNAL',
    ]);
  });

  it('auto-generates created_at and updated_at as valid timestamps', () => {
    const manifest = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    expect(manifest.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
    expect(manifest.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/);
  });
});

// ---------------------------------------------------------------------------
// updateManifest utility
// ---------------------------------------------------------------------------

describe('updateManifest', () => {
  it('updates status and sets new updated_at', () => {
    const original = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    // Force a past timestamp so updateManifest will produce a different one
    const frozen = { ...original, updated_at: '2020-01-01T00:00:00.000Z' };
    const updated = updateManifest(frozen, { status: 'active' });
    expect(updated.status).toBe('active');
    expect(updated.updated_at).not.toBe(frozen.updated_at);
  });

  it('appends skills without losing existing data', () => {
    const original = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    const skill1 = {
      skill_id: 'skill-a',
      version: '1.0.0',
      loaded_at: NOW,
      active: true,
    };
    const skill2 = {
      skill_id: 'skill-b',
      version: '2.0.0',
      loaded_at: NOW,
      active: true,
    };
    const withOne = updateManifest(original, { skills: [skill1] });
    const withTwo = updateManifest(withOne, { skills: [skill2] });
    expect(withTwo.skills).toHaveLength(2);
    expect(withTwo.skills[0].skill_id).toBe('skill-a');
    expect(withTwo.skills[1].skill_id).toBe('skill-b');
  });

  it('does not mutate the original manifest', () => {
    const original = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    const originalStatus = original.status;
    updateManifest(original, { status: 'active' });
    expect(original.status).toBe(originalStatus);
  });

  it('result validates against MissionManifestSchema', () => {
    const original = createManifest({
      mission_id: 'mission-2026-02-18-001',
      name: 'Test Mission',
      description: 'Test description',
    });
    const updated = updateManifest(original, { status: 'provisioned' });
    const result = MissionManifestSchema.safeParse(updated);
    expect(result.success).toBe(true);
  });
});
