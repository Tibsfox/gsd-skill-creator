/**
 * ME-1 mission provisioner.
 *
 * Creates clean mission environments from mission briefs. The provisioner is
 * ME-1's setup phase -- it takes a brief describing what a mission needs
 * (identity, skills, agents) and produces a fully initialized environment
 * with a populated manifest, configured telemetry emitter, and computed
 * directory structure.
 *
 * This is an in-memory provisioner. Actual filesystem creation is deferred
 * to Phase 206 (coordination & archive). The base_dir and directories are
 * computed paths, not created on disk. This keeps the provisioner pure and
 * testable without filesystem mocking.
 */

import { createManifest, updateManifest } from './manifest.js';
import type { MissionManifest, SkillEntry, AgentEntry } from './manifest.js';
import { TelemetryEmitter } from './telemetry-emitter.js';

// ============================================================================
// Types
// ============================================================================

/** Input brief describing a new mission to provision. */
export interface MissionBrief {
  /** Mission identifier (mission-YYYY-MM-DD-NNN format). */
  mission_id: string;
  /** Human-readable mission name. */
  name: string;
  /** Mission description/purpose. */
  description: string;
  /** Skills to load into the environment. */
  skills: Array<{ skill_id: string; version: string }>;
  /** Agents to register in the environment. */
  agents: Array<{ agent_id: string; role: string }>;
  /** Optional base directory for mission files (defaults to `.missions/<mission_id>`). */
  base_dir?: string;
}

/** A fully provisioned mission environment. */
export interface ProvisionedEnvironment {
  /** The fully initialized mission manifest. */
  manifest: MissionManifest;
  /** Configured telemetry emitter ready for use. */
  emitter: TelemetryEmitter;
  /** Base directory path for mission files. */
  base_dir: string;
  /** List of subdirectory names created. */
  directories: readonly string[];
}

// ============================================================================
// Constants
// ============================================================================

/** Standard subdirectories created for every mission environment. */
const MISSION_DIRECTORIES = ['logs', 'artifacts', 'checkpoints'] as const;

// ============================================================================
// provision()
// ============================================================================

/**
 * Provision a new mission environment from a brief.
 *
 * Steps:
 * 1. Create base manifest with identity fields
 * 2. Build SkillEntry and AgentEntry arrays from the brief
 * 3. Merge skills, agents, and status into the manifest
 * 4. Initialize telemetry emitter
 * 5. Compute directory paths
 * 6. Emit initial telemetry status report
 *
 * @param brief - Mission brief describing what to provision
 * @returns A fully initialized ProvisionedEnvironment
 */
export function provision(brief: MissionBrief): ProvisionedEnvironment {
  const now = new Date().toISOString().replace(/(\.\d{3})\d*Z/, '$1Z');

  // 1. Create base manifest
  let manifest = createManifest({
    mission_id: brief.mission_id,
    name: brief.name,
    description: brief.description,
  });

  // 2. Build skill entries
  const skills: SkillEntry[] = brief.skills.map((s) => ({
    skill_id: s.skill_id,
    version: s.version,
    loaded_at: now,
    active: true,
  }));

  // 3. Build agent entries
  const agents: AgentEntry[] = brief.agents.map((a) => ({
    agent_id: a.agent_id,
    role: a.role,
    registered_at: now,
    status: 'registered' as const,
  }));

  // 4. Merge into manifest and upgrade status to 'provisioned'
  manifest = updateManifest(manifest, { skills, agents, status: 'provisioned' });

  // 5. Initialize telemetry emitter
  const emitter = new TelemetryEmitter({ mission_id: brief.mission_id });

  // 6. Compute directory paths
  const base_dir = brief.base_dir ?? `.missions/${brief.mission_id}`;

  // 7. Emit initial telemetry status report
  emitter.emitTelemetry({
    phase: 'BRIEFING',
    progress: 0,
    team_status: {},
    checkpoints: [],
    resources: { cpu_percent: 0, memory_mb: 0, active_agents: agents.length },
  });

  return {
    manifest,
    emitter,
    base_dir,
    directories: MISSION_DIRECTORIES,
  };
}
