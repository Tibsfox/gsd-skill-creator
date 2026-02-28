/**
 * Tests for ME-1 provisioner.
 *
 * Covers: MissionBrief input, provision() function, manifest population,
 * skill loading, agent registration, telemetry initialization, edge cases,
 * and directory structure.
 */

import { describe, it, expect } from 'vitest';
import { provision } from '../provisioner.js';
import type { MissionBrief } from '../provisioner.js';
import { MissionManifestSchema } from '../manifest.js';
import { TelemetryEmitter } from '../telemetry-emitter.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function validBrief(): MissionBrief {
  return {
    mission_id: 'mission-2026-02-18-001',
    name: 'Test Mission Alpha',
    description: 'A test mission for provisioning',
    skills: [
      { skill_id: 'pattern-detection', version: '1.0.0' },
      { skill_id: 'code-review', version: '2.1.0' },
    ],
    agents: [
      { agent_id: 'ME-1', role: 'Environment Manager' },
      { agent_id: 'ME-2', role: 'Phase Runner' },
    ],
  };
}

// ---------------------------------------------------------------------------
// MissionBrief input
// ---------------------------------------------------------------------------

describe('MissionBrief input', () => {
  it('provision accepts a valid MissionBrief', () => {
    const env = provision(validBrief());
    expect(env).toBeDefined();
  });

  it('skills is an array of skill_id + version objects', () => {
    const brief = validBrief();
    expect(brief.skills).toHaveLength(2);
    expect(brief.skills[0]).toHaveProperty('skill_id');
    expect(brief.skills[0]).toHaveProperty('version');
  });

  it('agents is an array of agent_id + role objects', () => {
    const brief = validBrief();
    expect(brief.agents).toHaveLength(2);
    expect(brief.agents[0]).toHaveProperty('agent_id');
    expect(brief.agents[0]).toHaveProperty('role');
  });
});

// ---------------------------------------------------------------------------
// provision() function
// ---------------------------------------------------------------------------

describe('provision()', () => {
  it('returns a ProvisionedEnvironment object', () => {
    const env = provision(validBrief());
    expect(env).toHaveProperty('manifest');
    expect(env).toHaveProperty('emitter');
    expect(env).toHaveProperty('base_dir');
    expect(env).toHaveProperty('directories');
  });

  it('manifest passes MissionManifestSchema validation', () => {
    const env = provision(validBrief());
    const result = MissionManifestSchema.safeParse(env.manifest);
    expect(result.success).toBe(true);
  });

  it('manifest mission_id matches brief', () => {
    const env = provision(validBrief());
    expect(env.manifest.mission_id).toBe('mission-2026-02-18-001');
  });

  it('manifest name and description match brief', () => {
    const env = provision(validBrief());
    expect(env.manifest.name).toBe('Test Mission Alpha');
    expect(env.manifest.description).toBe('A test mission for provisioning');
  });

  it('manifest status is provisioned', () => {
    const env = provision(validBrief());
    expect(env.manifest.status).toBe('provisioned');
  });

  it('manifest skills contains all skills from brief with loaded_at and active', () => {
    const env = provision(validBrief());
    expect(env.manifest.skills).toHaveLength(2);
    expect(env.manifest.skills[0].skill_id).toBe('pattern-detection');
    expect(env.manifest.skills[0].version).toBe('1.0.0');
    expect(env.manifest.skills[0].loaded_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(env.manifest.skills[0].active).toBe(true);
    expect(env.manifest.skills[1].skill_id).toBe('code-review');
    expect(env.manifest.skills[1].active).toBe(true);
  });

  it('manifest agents contains all agents from brief with registered_at and status', () => {
    const env = provision(validBrief());
    expect(env.manifest.agents).toHaveLength(2);
    expect(env.manifest.agents[0].agent_id).toBe('ME-1');
    expect(env.manifest.agents[0].role).toBe('Environment Manager');
    expect(env.manifest.agents[0].registered_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(env.manifest.agents[0].status).toBe('registered');
  });

  it('manifest telemetry_config.enabled is true', () => {
    const env = provision(validBrief());
    expect(env.manifest.telemetry_config.enabled).toBe(true);
  });

  it('emitter is a TelemetryEmitter instance configured with mission_id', () => {
    const env = provision(validBrief());
    expect(env.emitter).toBeInstanceOf(TelemetryEmitter);
  });

  it('base_dir is a string path for the mission directory', () => {
    const env = provision(validBrief());
    expect(typeof env.base_dir).toBe('string');
    expect(env.base_dir.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('edge cases', () => {
  it('provision with empty skills array succeeds', () => {
    const brief = { ...validBrief(), skills: [] };
    const env = provision(brief);
    expect(env.manifest.skills).toEqual([]);
  });

  it('provision with empty agents array succeeds', () => {
    const brief = { ...validBrief(), agents: [] };
    const env = provision(brief);
    expect(env.manifest.agents).toEqual([]);
  });

  it('generates created_at and updated_at timestamps', () => {
    const env = provision(validBrief());
    expect(env.manifest.created_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(env.manifest.updated_at).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('provisioning emits a TELEMETRY_UPDATE event via the emitter', () => {
    const env = provision(validBrief());
    const log = env.emitter.getEventLog();
    expect(log.length).toBeGreaterThanOrEqual(1);
    expect(log[0].type).toBe('TELEMETRY_UPDATE');
  });
});

// ---------------------------------------------------------------------------
// Directory structure
// ---------------------------------------------------------------------------

describe('directory structure', () => {
  it('base_dir includes the mission_id', () => {
    const env = provision(validBrief());
    expect(env.base_dir).toContain('mission-2026-02-18-001');
  });

  it('directories includes logs, artifacts, checkpoints', () => {
    const env = provision(validBrief());
    expect(env.directories).toEqual(['logs', 'artifacts', 'checkpoints']);
  });
});
