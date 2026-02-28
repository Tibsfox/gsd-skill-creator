/**
 * Engine registry for the team-as-engine framework.
 *
 * Defines the four specialized engine definitions (context, render, io, router)
 * and provides a registry for lookup by name or domain.
 *
 * Engine allocations:
 * - Context engine (context/scheduling): 60% -- phase-critical gets largest allocation
 * - Render engine (output/rendering):    15% -- workflow output budget
 * - IO engine (I/O/events):              15% -- background I/O budget
 * - Router engine (glue/integration):    10% -- pattern detection and glue budget
 *
 * Total: 100% token budget
 */

import { EngineDefinitionSchema } from './types.js';
import type { EngineDefinition, EngineDomain } from './types.js';

// ============================================================================
// Engine Definitions
// ============================================================================

/**
 * CONTEXT_ENGINE -- Context management and scheduling coprocessor.
 *
 * Manages budget allocation, context window budgets, and phase-critical
 * resource scheduling.
 */
export const CONTEXT_ENGINE: EngineDefinition = EngineDefinitionSchema.parse({
  name: 'context-engine',
  domain: 'context',
  description:
    'Context management and scheduling coprocessor. Manages budget allocation, context window budgets, and phase-critical resource scheduling.',
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
 * RENDER_ENGINE -- Output rendering and formatting coprocessor.
 *
 * Handles skill output assembly, response formatting, and the display pipeline.
 */
export const RENDER_ENGINE: EngineDefinition = EngineDefinitionSchema.parse({
  name: 'render-engine',
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
 * IO_ENGINE -- I/O and event handling coprocessor.
 *
 * Manages file system events, external tool execution, and observation
 * data streams.
 */
export const IO_ENGINE: EngineDefinition = EngineDefinitionSchema.parse({
  name: 'io-engine',
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
 * ROUTER_ENGINE -- Glue logic and integration coprocessor.
 *
 * Handles inter-engine routing, address decoding, and pattern detection
 * coordination.
 */
export const ROUTER_ENGINE: EngineDefinition = EngineDefinitionSchema.parse({
  name: 'router-engine',
  domain: 'glue',
  description:
    'Glue logic and integration coprocessor. Handles inter-engine routing, address decoding, and pattern detection coordination.',
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
// EngineRegistry
// ============================================================================

/**
 * Registry of engine definitions with lookup by name and domain.
 *
 * Stores engine definitions in a Map keyed by engine name, providing
 * efficient lookup and enumeration. Supports adding custom engines
 * while preventing duplicate name conflicts.
 */
export class EngineRegistry {
  private engines: Map<string, EngineDefinition>;

  constructor(initialEngines?: EngineDefinition[]) {
    this.engines = new Map();
    if (initialEngines) {
      for (const engine of initialEngines) {
        this.engines.set(engine.name, engine);
      }
    }
  }

  /**
   * Register an engine definition.
   * @throws Error if an engine with the same name is already registered.
   */
  register(engine: EngineDefinition): void {
    if (this.engines.has(engine.name)) {
      throw new Error(`Engine '${engine.name}' is already registered`);
    }
    this.engines.set(engine.name, engine);
  }

  /** Look up an engine by name. Returns undefined if not found. */
  get(name: string): EngineDefinition | undefined {
    return this.engines.get(name);
  }

  /** Find the first engine matching the given domain. Returns undefined if not found. */
  getByDomain(domain: EngineDomain): EngineDefinition | undefined {
    for (const engine of this.engines.values()) {
      if (engine.domain === domain) {
        return engine;
      }
    }
    return undefined;
  }

  /** Return all registered engine definitions. */
  all(): EngineDefinition[] {
    return Array.from(this.engines.values());
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Create a new EngineRegistry populated with the four default engine definitions.
 */
export function createDefaultRegistry(): EngineRegistry {
  const registry = new EngineRegistry();
  registry.register(CONTEXT_ENGINE);
  registry.register(RENDER_ENGINE);
  registry.register(IO_ENGINE);
  registry.register(ROUTER_ENGINE);
  return registry;
}
