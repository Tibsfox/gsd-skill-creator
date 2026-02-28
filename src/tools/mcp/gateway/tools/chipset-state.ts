/**
 * In-memory chipset state manager for the gateway server.
 *
 * Holds the current chipset configuration in memory and provides
 * get, modify, and diff operations. Thread-safe within Node.js's
 * single-threaded event loop -- Map operations are atomic within a tick.
 *
 * Uses the Den chipset types from src/den/chipset.ts as the canonical
 * configuration schema (staff positions, topology, budget).
 */

import {
  ChipsetConfigSchema,
  type ChipsetConfig,
  createDefaultChipsetConfig,
} from '../../../../den/chipset.js';

// ============================================================================
// Types
// ============================================================================

/** Result of a chipset modification operation. */
export interface ChipsetModifyResult {
  /** The updated chipset configuration. */
  config: ChipsetConfig;
  /** Unified diff showing what changed. */
  diff: string;
}

/** Partial update to apply to a chipset configuration. */
export interface ChipsetUpdate {
  /** New chipset name (optional). */
  name?: string;
  /** New version string (optional). */
  version?: string;
  /** New total budget (optional). */
  totalBudget?: number;
  /** Positions to add or update (matched by id). */
  positions?: Array<{
    id: string;
    role?: string;
    context?: 'main' | 'fork';
    tokenBudget?: number;
    lifecycle?: 'persistent' | 'task';
    activationTrigger?: string;
  }>;
  /** Topology update (optional). */
  topology?: {
    type?: string;
    fallback?: string;
  };
  /** Position IDs to remove (optional). */
  removePositions?: string[];
}

// ============================================================================
// ChipsetStateManager
// ============================================================================

/**
 * Manages in-memory chipset state for the gateway.
 *
 * Each gateway server gets its own state manager instance. The state
 * is initialized from the default Den chipset config and can be
 * modified via the chipset.modify tool.
 */
export class ChipsetStateManager {
  private config: ChipsetConfig;

  constructor(initialConfig?: ChipsetConfig) {
    this.config = initialConfig ?? createDefaultChipsetConfig();
  }

  /**
   * Get the current chipset configuration.
   * Returns a deep copy to prevent external mutation.
   */
  get(): ChipsetConfig {
    return structuredClone(this.config);
  }

  /**
   * Apply a partial update to the chipset configuration.
   *
   * Returns the updated config and a unified diff showing what changed.
   * Validates the result against ChipsetConfigSchema -- if validation
   * fails, the update is rolled back and the error is thrown.
   */
  modify(update: ChipsetUpdate): ChipsetModifyResult {
    const previous = structuredClone(this.config);
    const working = structuredClone(this.config);

    // Apply scalar fields
    if (update.name !== undefined) working.name = update.name;
    if (update.version !== undefined) working.version = update.version;
    if (update.totalBudget !== undefined) working.totalBudget = update.totalBudget;

    // Remove positions
    if (update.removePositions && update.removePositions.length > 0) {
      const removeSet = new Set(update.removePositions);
      working.positions = working.positions.filter((p) => !removeSet.has(p.id));
      // Also remove from topology agents
      for (const id of update.removePositions) {
        delete working.topology.agents[id];
      }
    }

    // Add or update positions
    if (update.positions) {
      for (const posUpdate of update.positions) {
        const existing = working.positions.find((p) => p.id === posUpdate.id);
        if (existing) {
          if (posUpdate.role !== undefined) existing.role = posUpdate.role;
          if (posUpdate.context !== undefined) existing.context = posUpdate.context;
          if (posUpdate.tokenBudget !== undefined) existing.tokenBudget = posUpdate.tokenBudget;
          if (posUpdate.lifecycle !== undefined) existing.lifecycle = posUpdate.lifecycle;
          if (posUpdate.activationTrigger !== undefined) existing.activationTrigger = posUpdate.activationTrigger;
          // Update topology agents map
          working.topology.agents[posUpdate.id] = {
            role: existing.role,
            context: existing.context,
          };
        } else {
          // New position -- requires all fields
          const newPos = {
            id: posUpdate.id as ChipsetConfig['positions'][0]['id'],
            role: posUpdate.role ?? 'custom',
            context: posUpdate.context ?? 'fork' as const,
            tokenBudget: posUpdate.tokenBudget ?? 0.05,
            lifecycle: posUpdate.lifecycle ?? 'task' as const,
            activationTrigger: posUpdate.activationTrigger ?? 'on_demand',
          };
          working.positions.push(newPos);
          working.topology.agents[posUpdate.id] = {
            role: newPos.role,
            context: newPos.context,
          };
        }
      }
    }

    // Update topology
    if (update.topology) {
      if (update.topology.type !== undefined) working.topology.type = update.topology.type;
      if (update.topology.fallback !== undefined) working.topology.fallback = update.topology.fallback;
    }

    // Validate the result
    const result = ChipsetConfigSchema.safeParse(working);
    if (!result.success) {
      throw new Error(`Invalid chipset update: ${result.error.message}`);
    }

    // Commit the update
    this.config = result.data;

    // Generate diff
    const previousYaml = configToYaml(previous);
    const currentYaml = configToYaml(this.config);
    const diff = generateDiff(previousYaml, currentYaml);

    return { config: structuredClone(this.config), diff };
  }

  /**
   * Replace the entire chipset configuration.
   * Used by chipset.synthesize to set a freshly generated config.
   */
  replace(config: ChipsetConfig): void {
    const result = ChipsetConfigSchema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid chipset config: ${result.error.message}`);
    }
    this.config = result.data;
  }

  /**
   * Get the current config as a YAML-like string for resource providers.
   */
  toYaml(): string {
    return configToYaml(this.config);
  }
}

// ============================================================================
// Helpers
// ============================================================================

/**
 * Convert a chipset config to a human-readable YAML-like string.
 * Uses JSON with indentation for structured output.
 */
function configToYaml(config: ChipsetConfig): string {
  return JSON.stringify(config, null, 2);
}

/**
 * Generate a unified diff between two strings.
 */
function generateDiff(previous: string, current: string): string {
  if (previous === current) return '(no changes)';

  const prevLines = previous.split('\n');
  const currLines = current.split('\n');
  const lines: string[] = ['--- previous', '+++ current'];

  // Simple line-by-line diff
  const maxLen = Math.max(prevLines.length, currLines.length);
  for (let i = 0; i < maxLen; i++) {
    const prevLine = prevLines[i];
    const currLine = currLines[i];
    if (prevLine === currLine) {
      lines.push(` ${prevLine ?? ''}`);
    } else {
      if (prevLine !== undefined) lines.push(`-${prevLine}`);
      if (currLine !== undefined) lines.push(`+${currLine}`);
    }
  }

  return lines.join('\n');
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new ChipsetStateManager with the default Den chipset config.
 */
export function createChipsetStateManager(initialConfig?: ChipsetConfig): ChipsetStateManager {
  return new ChipsetStateManager(initialConfig);
}
