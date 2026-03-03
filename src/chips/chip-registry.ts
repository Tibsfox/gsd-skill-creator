/**
 * ChipRegistry -- runtime bridge between chipset.json configuration and
 * live ModelChip instances.
 *
 * Responsibilities:
 * - Load chip configs from chipset.json (or a caller-provided path)
 * - Instantiate chips via createChip()
 * - Map role names to chip instances
 * - Report health and capabilities for all registered chips
 * - CHIP-06 backward compatibility: missing chipset.json is not an error
 *
 * Usage:
 *   const registry = createChipRegistry();
 *   await registry.loadFromFile();          // reads chipset.json in cwd
 *   const chip = registry.get('ollama');    // by name
 *   const grader = registry.getByRole('grader'); // by role
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { z } from 'zod';
import { ChipConfigSchema } from './types.js';
import type { ModelChip, ChipRole, ChipHealth, ChipCapabilities } from './types.js';
import { createChip } from './chip-factory.js';

// ============================================================================
// ChipsetFile schema
// ============================================================================

/**
 * Zod schema for the chipset.json file format.
 *
 * version must be exactly 1 (literal) to detect future breaking changes.
 * chips is an array of ChipConfig (discriminated union on 'type').
 * roles maps a subset of ChipRole values to chip names (all keys optional).
 */
export const ChipsetFileSchema = z.object({
  version: z.literal(1),
  chips: z.array(ChipConfigSchema),
  roles: z
    .object({
      executor: z.string().optional(),
      grader: z.string().optional(),
      analyzer: z.string().optional(),
    })
    .optional(),
});

/** TypeScript type for a parsed chipset.json file */
export type ChipsetFile = z.infer<typeof ChipsetFileSchema>;

// ============================================================================
// ChipRegistry
// ============================================================================

/**
 * Runtime registry that maps chip names and roles to ModelChip instances.
 *
 * Supports two registration mechanisms:
 * 1. File-based: loadFromFile() reads chipset.json and instantiates chips
 * 2. Programmatic: register() for testing, CLI overrides, or dynamic chips
 */
export class ChipRegistry {
  private chips: Map<string, ModelChip>;
  private roles: Map<ChipRole, string>;
  private configured: boolean;

  constructor() {
    this.chips = new Map();
    this.roles = new Map();
    this.configured = false;
  }

  // --------------------------------------------------------------------------
  // File-based discovery
  // --------------------------------------------------------------------------

  /**
   * Load chips from a chipset.json file.
   *
   * CHIP-06 backward compatibility: if the file does not exist (ENOENT),
   * this method returns silently without error. isConfigured() will return
   * false in that case, indicating no chip backends are configured.
   *
   * @param path - Optional path to chipset.json (default: <cwd>/chipset.json)
   * @throws SyntaxError if file content is not valid JSON
   * @throws ZodError if file content does not match ChipsetFileSchema
   * @throws Error if a role references a chip name that does not exist
   */
  async loadFromFile(path?: string): Promise<void> {
    const resolvedPath = path ?? join(process.cwd(), 'chipset.json');

    let content: string;
    try {
      content = await readFile(resolvedPath, 'utf-8');
    } catch (err) {
      const nodeErr = err as NodeJS.ErrnoException;
      if (nodeErr.code === 'ENOENT') {
        // CHIP-06: missing chipset.json is not an error -- backward compat
        return;
      }
      throw err;
    }

    // Parse and validate through schema
    const raw: unknown = JSON.parse(content);
    const chipset = ChipsetFileSchema.parse(raw);

    // Instantiate all chips
    const newChips = new Map<string, ModelChip>();
    for (const chipConfig of chipset.chips) {
      newChips.set(chipConfig.name, createChip(chipConfig));
    }

    // Validate and register roles
    const newRoles = new Map<ChipRole, string>();
    if (chipset.roles) {
      for (const [role, chipName] of Object.entries(chipset.roles) as [ChipRole, string | undefined][]) {
        if (chipName === undefined) {
          continue; // optional role not assigned
        }
        if (!newChips.has(chipName)) {
          throw new Error(
            `Role '${role}' references chip '${chipName}' which is not defined in chips[]`,
          );
        }
        newRoles.set(role, chipName);
      }
    }

    // Commit all state atomically (after all validation passes)
    this.chips = newChips;
    this.roles = newRoles;
    this.configured = true;
  }

  // --------------------------------------------------------------------------
  // Programmatic registration
  // --------------------------------------------------------------------------

  /**
   * Register a chip instance by name.
   *
   * Useful for testing, CLI --chip overrides, and dynamic chip creation.
   * Sets isConfigured() to true.
   *
   * @param name - Chip name (used as lookup key)
   * @param chip - ModelChip instance to register
   */
  register(name: string, chip: ModelChip): void {
    this.chips.set(name, chip);
    this.configured = true;
  }

  // --------------------------------------------------------------------------
  // Accessors
  // --------------------------------------------------------------------------

  /**
   * Look up a chip by name.
   *
   * @param name - Chip name as defined in chipset.json or via register()
   * @returns ModelChip instance, or undefined if not found
   */
  get(name: string): ModelChip | undefined {
    return this.chips.get(name);
  }

  /**
   * Look up a chip by its assigned role.
   *
   * @param role - Role to resolve ('executor' | 'grader' | 'analyzer')
   * @returns ModelChip instance for the role, or undefined if role unassigned
   */
  getByRole(role: ChipRole): ModelChip | undefined {
    const chipName = this.roles.get(role);
    if (chipName === undefined) {
      return undefined;
    }
    return this.chips.get(chipName);
  }

  /**
   * List all registered chip names.
   *
   * @returns Array of chip names in insertion order
   */
  list(): string[] {
    return Array.from(this.chips.keys());
  }

  /**
   * Whether any chips are registered (file loaded or chips registered manually).
   *
   * Returns false when chipset.json is absent (CHIP-06 backward compat).
   *
   * @returns true if at least one chip is registered, false otherwise
   */
  isConfigured(): boolean {
    return this.configured;
  }

  // --------------------------------------------------------------------------
  // Health and capabilities reporting
  // --------------------------------------------------------------------------

  /**
   * Run health checks on all registered chips in parallel.
   *
   * Uses Promise.allSettled to ensure one unhealthy chip does not prevent
   * others from reporting. Rejected health checks return a default
   * unavailable result.
   *
   * @returns Record mapping chip name to ChipHealth
   */
  async healthCheck(): Promise<Record<string, ChipHealth>> {
    const entries = Array.from(this.chips.entries());
    const results = await Promise.allSettled(
      entries.map(async ([name, chip]) => ({ name, health: await chip.health() })),
    );

    const output: Record<string, ChipHealth> = {};
    for (let i = 0; i < results.length; i++) {
      const result = results[i]!;
      const [name] = entries[i]!;
      if (result.status === 'fulfilled') {
        output[name] = result.value.health;
      } else {
        // Health check threw -- report as unavailable
        output[name] = {
          available: false,
          latencyMs: null,
          lastChecked: new Date().toISOString(),
        };
      }
    }
    return output;
  }

  /**
   * Query capabilities for all registered chips in parallel.
   *
   * Uses Promise.allSettled to ensure one failing chip does not prevent
   * others from reporting. Rejected capability queries return a minimal
   * fallback.
   *
   * @returns Record mapping chip name to ChipCapabilities
   */
  async capabilitiesReport(): Promise<Record<string, ChipCapabilities>> {
    const entries = Array.from(this.chips.entries());
    const results = await Promise.allSettled(
      entries.map(async ([name, chip]) => ({ name, capabilities: await chip.capabilities() })),
    );

    const output: Record<string, ChipCapabilities> = {};
    for (let i = 0; i < results.length; i++) {
      const result = results[i]!;
      const [name] = entries[i]!;
      if (result.status === 'fulfilled') {
        output[name] = result.value.capabilities;
      } else {
        // Capabilities query threw -- return minimal fallback
        output[name] = {
          models: [],
          maxContextLength: 0,
          supportsStreaming: false,
          supportsTools: false,
        };
      }
    }
    return output;
  }
}

// ============================================================================
// Factory function
// ============================================================================

/**
 * Create a new ChipRegistry instance.
 *
 * Does not load any file -- caller decides when to call loadFromFile().
 * This separation allows tests and CLI to control file loading timing.
 *
 * @returns A fresh, unconfigured ChipRegistry
 */
export function createChipRegistry(): ChipRegistry {
  return new ChipRegistry();
}
