/**
 * Chip registry for the team-as-chip framework.
 *
 * Defines the four specialized chip definitions (Agnus, Denise, Paula, Gary)
 * modeled after the Amiga chipset architecture, and provides a registry for
 * lookup by name or domain.
 *
 * Chip allocations:
 * - Agnus (context/scheduling): 60% DMA -- phase-critical gets largest allocation
 * - Denise (output/rendering):  15% DMA -- workflow output budget
 * - Paula (I/O/events):         15% DMA -- background I/O budget
 * - Gary (glue/integration):    10% DMA -- pattern detection and glue budget
 *
 * Total: 100% DMA channel token budget
 */

import { ChipDefinitionSchema } from './types.js';
import type { ChipDefinition, ChipDomain } from './types.js';

// ============================================================================
// Chip Definitions
// ============================================================================

/**
 * AGNUS -- Context management and scheduling coprocessor.
 *
 * Named after the Amiga's Agnus chip which managed memory and DMA channels.
 * In the skill-creator chipset, Agnus manages DMA channel allocation,
 * context window budgets, and phase-critical resource scheduling.
 */
export const AGNUS: ChipDefinition = ChipDefinitionSchema.parse({
  name: 'agnus',
  domain: 'context',
  description:
    'Context management and scheduling coprocessor. Manages DMA channel allocation, context window budgets, and phase-critical resource scheduling.',
  dma: { percentage: 60, description: 'Phase-critical context budget (largest allocation)' },
  ports: [
    { name: 'context-request', direction: 'in', messageTypes: ['budget-query', 'allocate'] },
    {
      name: 'context-grant',
      direction: 'out',
      messageTypes: ['budget-response', 'allocation-result'],
    },
    {
      name: 'schedule',
      direction: 'bidirectional',
      messageTypes: ['schedule-request', 'schedule-update'],
    },
  ],
  signalMask: {
    allocated: ((1 << 16) | (1 << 17) | (1 << 18)) >>> 0,
    labels: { 'context-ready': 16, 'budget-exceeded': 17, 'schedule-tick': 18 },
  },
});

/**
 * DENISE -- Output rendering and formatting coprocessor.
 *
 * Named after the Amiga's Denise chip which handled display output.
 * In the skill-creator chipset, Denise handles skill output assembly,
 * response formatting, and the display pipeline.
 */
export const DENISE: ChipDefinition = ChipDefinitionSchema.parse({
  name: 'denise',
  domain: 'output',
  description:
    'Output rendering and formatting coprocessor. Handles skill output assembly, response formatting, and display pipeline.',
  dma: { percentage: 15, description: 'Workflow output budget' },
  ports: [
    { name: 'render-input', direction: 'in', messageTypes: ['render-request', 'format-request'] },
    {
      name: 'render-output',
      direction: 'out',
      messageTypes: ['render-result', 'format-result'],
    },
  ],
  signalMask: {
    allocated: ((1 << 16) | (1 << 17)) >>> 0,
    labels: { 'render-complete': 16, 'output-ready': 17 },
  },
});

/**
 * PAULA -- I/O and event handling coprocessor.
 *
 * Named after the Amiga's Paula chip which handled audio and I/O.
 * In the skill-creator chipset, Paula manages file system events,
 * external tool execution, and observation data streams.
 */
export const PAULA: ChipDefinition = ChipDefinitionSchema.parse({
  name: 'paula',
  domain: 'io',
  description:
    'I/O and event handling coprocessor. Manages file system events, external tool execution, and observation data streams.',
  dma: { percentage: 15, description: 'Background I/O budget' },
  ports: [
    { name: 'io-request', direction: 'in', messageTypes: ['file-op', 'tool-exec', 'observe'] },
    {
      name: 'io-result',
      direction: 'out',
      messageTypes: ['file-result', 'tool-result', 'observation'],
    },
    { name: 'event-stream', direction: 'out', messageTypes: ['fs-event', 'session-event'] },
  ],
  signalMask: {
    allocated: ((1 << 16) | (1 << 17) | (1 << 18)) >>> 0,
    labels: { 'io-complete': 16, 'event-pending': 17, 'observation-ready': 18 },
  },
});

/**
 * GARY -- Glue logic and integration coprocessor.
 *
 * Named after the Amiga's Gary chip which handled address decoding
 * and glue logic. In the skill-creator chipset, Gary handles inter-chip
 * routing, address decoding, and pattern detection coordination.
 */
export const GARY: ChipDefinition = ChipDefinitionSchema.parse({
  name: 'gary',
  domain: 'glue',
  description:
    'Glue logic and integration coprocessor. Handles inter-chip routing, address decoding, and pattern detection coordination.',
  dma: { percentage: 10, description: 'Pattern detection and glue budget' },
  ports: [
    {
      name: 'route',
      direction: 'bidirectional',
      messageTypes: ['route-request', 'route-result'],
    },
    { name: 'pattern-feed', direction: 'in', messageTypes: ['pattern-data', 'correlation'] },
  ],
  signalMask: {
    allocated: ((1 << 16) | (1 << 17)) >>> 0,
    labels: { 'route-ready': 16, 'pattern-detected': 17 },
  },
});

// ============================================================================
// ChipRegistry
// ============================================================================

/**
 * Registry of chip definitions with lookup by name and domain.
 *
 * Stores chip definitions in a Map keyed by chip name, providing
 * efficient lookup and enumeration. Supports adding custom chips
 * while preventing duplicate name conflicts.
 */
export class ChipRegistry {
  private chips: Map<string, ChipDefinition>;

  constructor(initialChips?: ChipDefinition[]) {
    this.chips = new Map();
    if (initialChips) {
      for (const chip of initialChips) {
        this.chips.set(chip.name, chip);
      }
    }
  }

  /**
   * Register a chip definition.
   * @throws Error if a chip with the same name is already registered.
   */
  register(chip: ChipDefinition): void {
    if (this.chips.has(chip.name)) {
      throw new Error(`Chip '${chip.name}' is already registered`);
    }
    this.chips.set(chip.name, chip);
  }

  /** Look up a chip by name. Returns undefined if not found. */
  get(name: string): ChipDefinition | undefined {
    return this.chips.get(name);
  }

  /** Find the first chip matching the given domain. Returns undefined if not found. */
  getByDomain(domain: ChipDomain): ChipDefinition | undefined {
    for (const chip of this.chips.values()) {
      if (chip.domain === domain) {
        return chip;
      }
    }
    return undefined;
  }

  /** Return all registered chip definitions. */
  all(): ChipDefinition[] {
    return Array.from(this.chips.values());
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new ChipRegistry populated with the four default chip definitions.
 */
export function createDefaultRegistry(): ChipRegistry {
  const registry = new ChipRegistry();
  registry.register(AGNUS);
  registry.register(DENISE);
  registry.register(PAULA);
  registry.register(GARY);
  return registry;
}
