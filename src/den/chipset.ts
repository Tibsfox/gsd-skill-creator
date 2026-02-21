/**
 * Chipset configuration parsing and reproducibility validation.
 *
 * Proves that given the same chipset.yaml definition, the Den produces
 * identical staff configurations across sessions. Pure and deterministic --
 * no random values, no Date.now(), no env reads, no filesystem access.
 *
 * Provides: Zod schemas for staff positions, topology definitions, and
 * chipset configs. Pure functions for parsing, roster extraction, and
 * reproducibility comparison. A Chipset class for stateful access.
 */

import { z } from 'zod';

// ============================================================================
// Staff Position Schema
// ============================================================================

/**
 * Valid agent IDs for staff positions.
 *
 * Excludes 'all' (broadcast) and 'user' (human operator) which are
 * not valid Den staff positions.
 */
const StaffAgentIdSchema = z.enum([
  'coordinator', 'relay', 'planner', 'configurator',
  'monitor', 'dispatcher', 'verifier', 'chronicler',
  'sentinel', 'executor',
]);

/**
 * Schema for a single staff position in the chipset.
 *
 * Each position defines an agent's identity, role, execution context,
 * token budget allocation, lifecycle mode, and activation trigger.
 */
export const StaffPositionSchema = z.object({
  /** Agent identifier (one of the 10 Den positions, no 'all' or 'user') */
  id: StaffAgentIdSchema,
  /** Role descriptor (e.g. 'orchestrator', 'executor', 'recovery') */
  role: z.string(),
  /** Execution context: 'main' thread or 'fork' (fresh context) */
  context: z.enum(['main', 'fork']),
  /** Fraction of context window allocated (0.0 to 1.0) */
  tokenBudget: z.number().min(0).max(1),
  /** Lifecycle mode: persistent (always on) or task (activated per-task) */
  lifecycle: z.enum(['persistent', 'task']),
  /** Event that triggers this position's activation */
  activationTrigger: z.string(),
});

/** TypeScript type for a staff position */
export type StaffPosition = z.infer<typeof StaffPositionSchema>;

// ============================================================================
// Topology Definition Schema
// ============================================================================

/**
 * Schema for topology definition within a chipset config.
 *
 * Describes the agent graph structure: which agents participate,
 * their roles and contexts, and the fallback handler.
 */
export const TopologyDefinitionSchema = z.object({
  /** Topology type name (e.g. 'scout', 'patrol', 'squadron', 'fleet') */
  type: z.string(),
  /** Map of agent ID to their role and context in this topology */
  agents: z.record(z.string(), z.object({
    role: z.string(),
    context: z.enum(['main', 'fork']),
  })),
  /** Agent that handles unroutable messages */
  fallback: z.string(),
});

/** TypeScript type for topology definitions */
export type TopologyDefinition = z.infer<typeof TopologyDefinitionSchema>;

// ============================================================================
// Chipset Config Schema
// ============================================================================

/**
 * Schema for a complete chipset configuration.
 *
 * Combines name, version, staff positions, topology, and total budget
 * into a validated, parseable configuration object.
 */
export const ChipsetConfigSchema = z.object({
  /** Human-readable chipset name */
  name: z.string(),
  /** Semver version string */
  version: z.string(),
  /** Array of staff position definitions */
  positions: z.array(StaffPositionSchema),
  /** Topology definition for agent graph */
  topology: TopologyDefinitionSchema,
  /** Total context window budget fraction (0.0 to 1.0) */
  totalBudget: z.number().min(0).max(1),
});

/** TypeScript type for chipset config */
export type ChipsetConfig = z.infer<typeof ChipsetConfigSchema>;

// ============================================================================
// DEN_STAFF_POSITIONS -- canonical 10-position staff
// ============================================================================

/**
 * The canonical 10-position staff definition for the v1.28 Den.
 *
 * Frozen to prevent mutation. All positions use the standard roles,
 * contexts, token budgets, lifecycles, and activation triggers.
 */
export const DEN_STAFF_POSITIONS: readonly StaffPosition[] = Object.freeze([
  { id: 'coordinator', role: 'orchestrator', context: 'main', tokenBudget: 0.08, lifecycle: 'persistent', activationTrigger: 'session_start' },
  { id: 'relay', role: 'interface', context: 'main', tokenBudget: 0.05, lifecycle: 'persistent', activationTrigger: 'session_start' },
  { id: 'planner', role: 'planner', context: 'fork', tokenBudget: 0.06, lifecycle: 'task', activationTrigger: 'on_phase_enter' },
  { id: 'configurator', role: 'configurator', context: 'fork', tokenBudget: 0.05, lifecycle: 'task', activationTrigger: 'on_phase_enter' },
  { id: 'monitor', role: 'monitor', context: 'main', tokenBudget: 0.03, lifecycle: 'persistent', activationTrigger: 'session_start' },
  { id: 'dispatcher', role: 'infrastructure', context: 'main', tokenBudget: 0.03, lifecycle: 'persistent', activationTrigger: 'session_start' },
  { id: 'verifier', role: 'verifier', context: 'fork', tokenBudget: 0.06, lifecycle: 'task', activationTrigger: 'on_verification' },
  { id: 'chronicler', role: 'documenter', context: 'fork', tokenBudget: 0.04, lifecycle: 'task', activationTrigger: 'on_phase_exit' },
  { id: 'sentinel', role: 'recovery', context: 'fork', tokenBudget: 0.04, lifecycle: 'task', activationTrigger: 'on_error' },
  { id: 'executor', role: 'executor', context: 'fork', tokenBudget: 0.15, lifecycle: 'task', activationTrigger: 'on_execution' },
] as StaffPosition[]);

// ============================================================================
// Pure functions
// ============================================================================

/**
 * Parse raw input through ChipsetConfigSchema.
 *
 * Pure and deterministic -- no random values, no Date.now(), no env reads.
 * Returns validated ChipsetConfig. Throws ZodError on invalid input.
 *
 * @param input - Raw configuration input (unknown)
 * @returns Validated ChipsetConfig
 * @throws ZodError if input fails validation
 */
export function parseChipsetConfig(input: unknown): ChipsetConfig {
  return ChipsetConfigSchema.parse(input);
}

/** Staff roster entry -- subset of StaffPosition for comparison */
export interface RosterEntry {
  id: string;
  role: string;
  context: string;
  tokenBudget: number;
}

/**
 * Extract a sorted staff roster from a chipset config.
 *
 * Returns an array of {id, role, context, tokenBudget} sorted
 * alphabetically by id using localeCompare. Sorting ensures
 * deterministic ordering regardless of input order.
 *
 * @param config - Validated ChipsetConfig
 * @returns Sorted array of roster entries
 */
export function extractStaffRoster(config: ChipsetConfig): RosterEntry[] {
  return config.positions
    .map((p) => ({
      id: p.id,
      role: p.role,
      context: p.context,
      tokenBudget: p.tokenBudget,
    }))
    .sort((a, b) => a.id.localeCompare(b.id));
}

/** Result of a reproducibility validation */
export interface ReproducibilityResult {
  /** Whether the two configs are identical */
  identical: boolean;
  /** List of fields that differ (empty if identical) */
  differences: string[];
}

/**
 * Deep-compare two parsed chipset configs for reproducibility.
 *
 * Compares: name, version, totalBudget, topology (JSON serialized),
 * and staff rosters (sorted, JSON serialized). Returns which fields
 * differ if any.
 *
 * @param configA - First validated ChipsetConfig
 * @param configB - Second validated ChipsetConfig
 * @returns Reproducibility result with identical flag and differences list
 */
export function validateReproducibility(
  configA: ChipsetConfig,
  configB: ChipsetConfig,
): ReproducibilityResult {
  const differences: string[] = [];

  if (configA.name !== configB.name) {
    differences.push('name');
  }

  if (configA.version !== configB.version) {
    differences.push('version');
  }

  if (configA.totalBudget !== configB.totalBudget) {
    differences.push('totalBudget');
  }

  if (JSON.stringify(configA.topology) !== JSON.stringify(configB.topology)) {
    differences.push('topology');
  }

  const rosterA = JSON.stringify(extractStaffRoster(configA));
  const rosterB = JSON.stringify(extractStaffRoster(configB));
  if (rosterA !== rosterB) {
    differences.push('staffRoster');
  }

  return {
    identical: differences.length === 0,
    differences,
  };
}

/**
 * Create the default chipset configuration using DEN_STAFF_POSITIONS.
 *
 * Returns a ChipsetConfig with the standard squadron topology and
 * 0.59 totalBudget. Pure and deterministic.
 *
 * @returns Default ChipsetConfig
 */
export function createDefaultChipsetConfig(): ChipsetConfig {
  const agents: Record<string, { role: string; context: 'main' | 'fork' }> = {};
  for (const pos of DEN_STAFF_POSITIONS) {
    agents[pos.id] = { role: pos.role, context: pos.context };
  }

  return {
    name: 'den-v1.28',
    version: '1.0.0',
    positions: [...DEN_STAFF_POSITIONS],
    topology: {
      type: 'squadron',
      agents,
      fallback: 'coordinator',
    },
    totalBudget: 0.59,
  };
}

// ============================================================================
// Chipset class
// ============================================================================

/**
 * Stateful wrapper holding a parsed ChipsetConfig.
 *
 * Lightweight accessor class for querying chipset state. Parses
 * configuration through ChipsetConfigSchema in the constructor.
 */
export class Chipset {
  private readonly config: ChipsetConfig;

  /**
   * Create a new Chipset from raw or validated configuration.
   *
   * @param input - Configuration input (parsed through ChipsetConfigSchema)
   * @throws ZodError if input fails validation
   */
  constructor(input: unknown) {
    this.config = ChipsetConfigSchema.parse(input);
  }

  /**
   * Get the sorted staff roster.
   *
   * @returns Array of {id, role, context, tokenBudget} sorted by id
   */
  getRoster(): RosterEntry[] {
    return extractStaffRoster(this.config);
  }

  /**
   * Validate reproducibility against another config.
   *
   * @param other - ChipsetConfig to compare against
   * @returns Reproducibility result
   */
  validate(other: ChipsetConfig): ReproducibilityResult {
    return validateReproducibility(this.config, other);
  }

  /**
   * Get a specific staff position by agent ID.
   *
   * @param id - Agent identifier to look up
   * @returns StaffPosition if found, undefined otherwise
   */
  getPosition(id: string): StaffPosition | undefined {
    return this.config.positions.find((p) => p.id === id);
  }

  /**
   * Get the total context window budget fraction.
   *
   * @returns Total budget (0.0 to 1.0)
   */
  getTotalBudget(): number {
    return this.config.totalBudget;
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a Chipset instance.
 *
 * If no config provided, uses createDefaultChipsetConfig() for the
 * standard 10-position Den chipset.
 *
 * @param config - Optional configuration input
 * @returns Chipset instance
 */
export function createChipset(config?: unknown): Chipset {
  const resolved = config ?? createDefaultChipsetConfig();
  return new Chipset(resolved);
}
