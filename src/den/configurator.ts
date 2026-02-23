/**
 * Configurator agent for the GSD Den.
 *
 * Owns system configuration: which topology to use (Scout/Patrol/Squadron/Fleet),
 * which skills to load, and whether the chipset is ready for the next phase.
 * Determines optimal agent team topology based on phase requirements and reports
 * readiness to the Coordinator.
 *
 * Provides 5 core capabilities:
 *   1. Topology selection -- phase-count-based profile selection with override
 *   2. Skill evaluation -- compare required/recommended against available
 *   3. Chipset readiness -- GO/NO-GO based on skill availability
 *   4. Config logging (JSONL) -- append-only audit trail of configuration decisions
 *   5. Configurator class -- stateful wrapper with bound config
 */

import { z } from 'zod';
import { mkdir, appendFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';

import { AgentIdSchema } from './types.js';
import type { AgentId } from './types.js';
import { formatTimestamp } from './encoder.js';

// ============================================================================
// Topology profiles
// ============================================================================

/**
 * Predefined topology profiles for the GSD Den.
 *
 * Each profile defines the agent roles activated, maximum supported phase count,
 * and token budget allocation for the topology.
 */
export const TOPOLOGY_PROFILES = {
  scout: {
    name: 'Scout',
    roles: ['coordinator', 'executor', 'verifier'] as const,
    description: 'Minimal team for quick fixes/patches',
    maxPhases: 3,
    tokenBudget: 0.29,
  },
  patrol: {
    name: 'Patrol',
    roles: ['coordinator', 'executor', 'verifier', 'planner', 'relay', 'monitor', 'chronicler'] as const,
    description: 'Standard feature work',
    maxPhases: 10,
    tokenBudget: 0.47,
  },
  squadron: {
    name: 'Squadron',
    roles: ['coordinator', 'executor', 'verifier', 'planner', 'relay', 'monitor', 'chronicler', 'configurator', 'dispatcher', 'sentinel'] as const,
    description: 'Multi-domain parallel work (full v1.28 core)',
    maxPhases: 25,
    tokenBudget: 0.59,
  },
  fleet: {
    name: 'Fleet',
    roles: ['coordinator', 'executor', 'verifier', 'planner', 'relay', 'monitor', 'chronicler', 'configurator', 'dispatcher', 'sentinel'] as const,
    description: 'Enterprise-scale multi-milestone campaigns (all 22 future)',
    maxPhases: Infinity,
    tokenBudget: 0.59,
  },
} as const;

// ============================================================================
// Schemas
// ============================================================================

/**
 * Schema for a topology profile.
 */
export const TopologyProfileSchema = z.object({
  /** Display name of the profile */
  name: z.string(),
  /** Agent roles active in this topology */
  roles: z.array(AgentIdSchema),
  /** Human description of when to use this profile */
  description: z.string(),
  /** Maximum number of phases this topology supports (Infinity for unlimited) */
  maxPhases: z.union([z.number().positive(), z.literal(Infinity)]),
  /** Fraction of context window allocated to agent coordination */
  tokenBudget: z.number().min(0).max(1),
});

/** TypeScript type for topology profiles */
export type TopologyProfile = z.infer<typeof TopologyProfileSchema>;

/**
 * Schema for a skill requirement evaluation result.
 */
export const SkillRequirementSchema = z.object({
  /** Name of the skill */
  skillName: z.string(),
  /** Whether this skill is required (true) or recommended (false) */
  required: z.boolean(),
  /** Whether this skill is currently available */
  available: z.boolean(),
});

/** TypeScript type for skill requirements */
export type SkillRequirement = z.infer<typeof SkillRequirementSchema>;

/**
 * Schema for chipset readiness check result.
 */
export const ChipsetReadinessSchema = z.object({
  /** Whether the chipset is ready (all required skills available) */
  ready: z.boolean(),
  /** Name of the selected topology profile */
  topology: z.string(),
  /** Agent roles active in the selected topology */
  activeRoles: z.array(AgentIdSchema),
  /** Names of required skills that are not available */
  missingSkills: z.array(z.string()),
  /** Human-readable reason for the readiness decision */
  reason: z.string(),
});

/** TypeScript type for chipset readiness */
export type ChipsetReadiness = z.infer<typeof ChipsetReadinessSchema>;

/**
 * Schema for a JSONL configuration log entry.
 */
export const ConfigEntrySchema = z.object({
  /** Compact timestamp when the entry was created */
  timestamp: z.string(),
  /** Type of configuration event */
  type: z.enum(['topology-select', 'skill-evaluate', 'readiness-check', 'config-change']),
  /** Additional structured detail */
  detail: z.record(z.string(), z.unknown()),
});

/** TypeScript type for config log entries */
export type ConfigEntry = z.infer<typeof ConfigEntrySchema>;

/**
 * Configuration for the Configurator agent.
 */
export const ConfiguratorConfigSchema = z.object({
  /** Bus configuration (passed through, not used directly by Configurator) */
  busConfig: z.any(),
  /** Path to the JSONL configuration log file */
  logPath: z.string().default('.planning/den/logs/configurator.jsonl'),
  /** Skills currently loaded and available */
  availableSkills: z.array(z.string()).default([]),
});

/** TypeScript type for configurator config */
export type ConfiguratorConfig = z.infer<typeof ConfiguratorConfigSchema>;

/** TypeScript type for configurator config input (defaults optional) */
export type ConfiguratorConfigInput = z.input<typeof ConfiguratorConfigSchema>;

// ============================================================================
// Stateless functions
// ============================================================================

/** Valid profile keys for forceProfile lookup */
const PROFILE_KEYS = new Set(Object.keys(TOPOLOGY_PROFILES));

/**
 * Select the optimal topology profile based on phase count.
 *
 * Uses phase count thresholds to pick the smallest sufficient topology:
 *   <= 3  -> Scout
 *   <= 10 -> Patrol
 *   <= 25 -> Squadron
 *   > 25  -> Fleet
 *
 * If forceProfile is provided and valid, it overrides the phase-count logic.
 *
 * @param phaseCount - Number of phases in the current milestone
 * @param options - Optional forceProfile override
 * @returns The selected topology profile object
 */
export function selectTopology(
  phaseCount: number,
  options?: { forceProfile?: string },
): TopologyProfile {
  // Force override if valid
  if (options?.forceProfile && PROFILE_KEYS.has(options.forceProfile)) {
    const key = options.forceProfile as keyof typeof TOPOLOGY_PROFILES;
    return { ...TOPOLOGY_PROFILES[key], roles: [...TOPOLOGY_PROFILES[key].roles] };
  }

  // Phase-count-based selection
  if (phaseCount <= 3) {
    return { ...TOPOLOGY_PROFILES.scout, roles: [...TOPOLOGY_PROFILES.scout.roles] };
  }
  if (phaseCount <= 10) {
    return { ...TOPOLOGY_PROFILES.patrol, roles: [...TOPOLOGY_PROFILES.patrol.roles] };
  }
  if (phaseCount <= 25) {
    return { ...TOPOLOGY_PROFILES.squadron, roles: [...TOPOLOGY_PROFILES.squadron.roles] };
  }
  return { ...TOPOLOGY_PROFILES.fleet, roles: [...TOPOLOGY_PROFILES.fleet.roles] };
}

/**
 * Evaluate skill requirements against available skills.
 *
 * Creates a SkillRequirement for each required and recommended skill,
 * marking whether each is currently available.
 *
 * @param requiredSkills - Skills that must be available for GO
 * @param recommendedSkills - Skills that are nice to have but not required
 * @param availableSkills - Skills currently loaded
 * @returns Array of skill requirement evaluations
 */
export function evaluateSkillRequirements(
  requiredSkills: string[],
  recommendedSkills: string[],
  availableSkills: string[],
): SkillRequirement[] {
  const availableSet = new Set(availableSkills);
  const results: SkillRequirement[] = [];

  for (const skillName of requiredSkills) {
    results.push({
      skillName,
      required: true,
      available: availableSet.has(skillName),
    });
  }

  for (const skillName of recommendedSkills) {
    results.push({
      skillName,
      required: false,
      available: availableSet.has(skillName),
    });
  }

  return results;
}

/**
 * Check chipset readiness based on topology and skill requirements.
 *
 * Ready = true only when ALL required skills are available.
 * Recommended skills may be missing without affecting readiness.
 *
 * @param topology - Selected topology profile
 * @param skillReqs - Evaluated skill requirements
 * @returns Chipset readiness result
 */
export function checkChipsetReadiness(
  topology: { name: string; roles: readonly AgentId[]; description: string; maxPhases: number; tokenBudget: number },
  skillReqs: SkillRequirement[],
): ChipsetReadiness {
  const missingRequired = skillReqs.filter((r) => r.required && !r.available);
  const missingSkills = missingRequired.map((r) => r.skillName);
  const ready = missingRequired.length === 0;

  return {
    ready,
    topology: topology.name,
    activeRoles: [...topology.roles] as AgentId[],
    missingSkills,
    reason: ready
      ? 'All required skills available'
      : `Missing required skills: ${missingSkills.join(', ')}`,
  };
}

// ============================================================================
// JSONL config logging
// ============================================================================

/**
 * Append a configuration entry to a JSONL log file.
 *
 * Creates parent directories if they don't exist. Each entry is one
 * JSON object per line, terminated with a newline.
 *
 * @param logPath - Path to the JSONL log file
 * @param entry - Config entry to append
 */
export async function appendConfigEntry(logPath: string, entry: ConfigEntry): Promise<void> {
  const validated = ConfigEntrySchema.parse(entry);
  const line = JSON.stringify(validated) + '\n';
  await mkdir(dirname(logPath), { recursive: true });
  await appendFile(logPath, line, 'utf-8');
}

/**
 * Read all configuration entries from a JSONL log file.
 *
 * Returns an empty array if the file does not exist.
 *
 * @param logPath - Path to the JSONL log file
 * @returns Array of validated ConfigEntry objects
 */
export async function readConfigLog(logPath: string): Promise<ConfigEntry[]> {
  let content: string;
  try {
    content = await readFile(logPath, 'utf-8');
  } catch {
    return [];
  }

  const lines = content.trim().split('\n').filter((line) => line.length > 0);
  return lines.map((line) => ConfigEntrySchema.parse(JSON.parse(line)));
}

// ============================================================================
// Configurator class (stateful wrapper)
// ============================================================================

/**
 * Stateful Configurator wrapping all stateless functions with bound config.
 *
 * Reports readiness via return values -- no bus message sending.
 * The Coordinator calls the Configurator's functions directly.
 */
export class Configurator {
  private readonly config: ConfiguratorConfig;

  /**
   * Create a new Configurator instance.
   *
   * @param config - Configurator configuration (validated through Zod)
   */
  constructor(config: ConfiguratorConfig) {
    this.config = ConfiguratorConfigSchema.parse(config);
  }

  /**
   * Select the optimal topology for a given phase count.
   *
   * Logs the selection to the config log.
   *
   * @param phaseCount - Number of phases
   * @param forceProfile - Optional profile override
   * @returns Selected topology profile
   */
  selectTopologyForPhase(phaseCount: number, forceProfile?: string): TopologyProfile {
    return selectTopology(phaseCount, forceProfile ? { forceProfile } : undefined);
  }

  /**
   * Evaluate skill requirements against the configured available skills.
   *
   * @param requiredSkills - Skills that must be available
   * @param recommendedSkills - Nice-to-have skills (default: [])
   * @returns Array of skill requirement evaluations
   */
  evaluateSkills(requiredSkills: string[], recommendedSkills: string[] = []): SkillRequirement[] {
    return evaluateSkillRequirements(requiredSkills, recommendedSkills, this.config.availableSkills);
  }

  /**
   * Run the full readiness pipeline: topology selection, skill evaluation, readiness check.
   *
   * Logs the readiness result to the config log.
   *
   * @param phaseCount - Number of phases
   * @param requiredSkills - Skills that must be available
   * @param recommendedSkills - Nice-to-have skills (default: [])
   * @returns Chipset readiness result
   */
  async checkReadiness(
    phaseCount: number,
    requiredSkills: string[],
    recommendedSkills: string[] = [],
  ): Promise<ChipsetReadiness> {
    const topology = this.selectTopologyForPhase(phaseCount);
    const skillReqs = this.evaluateSkills(requiredSkills, recommendedSkills);
    const readiness = checkChipsetReadiness(topology, skillReqs);

    // Log the readiness check
    await appendConfigEntry(this.config.logPath, {
      timestamp: formatTimestamp(new Date()),
      type: 'readiness-check',
      detail: {
        ready: readiness.ready,
        topology: readiness.topology,
        missingSkills: readiness.missingSkills,
        phaseCount,
      },
    });

    return readiness;
  }

  /**
   * Read the full configuration log.
   *
   * @returns Array of all config entries
   */
  async getLog(): Promise<ConfigEntry[]> {
    return readConfigLog(this.config.logPath);
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create and initialize a Configurator.
 *
 * Ensures the log directory exists before returning the ready-to-use instance.
 *
 * @param config - Configurator configuration
 * @returns Initialized Configurator instance
 */
export async function createConfigurator(config: ConfiguratorConfigInput): Promise<Configurator> {
  const validated = ConfiguratorConfigSchema.parse(config);
  await mkdir(dirname(validated.logPath), { recursive: true });
  return new Configurator(validated);
}
