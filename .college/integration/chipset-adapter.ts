/**
 * Chipset Adapter -- maps Rosetta panels to chipset specialist engine domains.
 *
 * Uses a declarative configuration (JSON object literal) to route panel
 * requests to the correct engine domain. Systems panels (Python, C++, Java)
 * route to the context engine, heritage panels (Lisp, Pascal, etc.) route
 * to the render/output engine, and so on.
 *
 * Decoupled from src/ via the minimal EngineResolver interface -- the
 * adapter only needs getByDomain() to look up engine definitions.
 *
 * @module integration/chipset-adapter
 */

import type { PanelId } from '../rosetta-core/types.js';

// ─── Types ───────────────────────────────────────────────────────────────────

/** Engine domain types matching the chipset architecture */
export type EngineDomain = 'context' | 'output' | 'io' | 'glue';

/** Maps each panel to its target engine domain */
export type PanelChipsetMapping = Record<PanelId, EngineDomain>;

/**
 * Minimal interface for looking up engine definitions by domain.
 * Keeps .college/ decoupled from the full EngineRegistry in src/.
 */
export interface EngineResolver {
  getByDomain(domain: string): { name: string; domain: string; dma: { percentage: number } } | undefined;
}

/**
 * Configuration for the ChipsetAdapter.
 */
export interface ChipsetAdapterConfig {
  /** Engine resolver for looking up engine definitions */
  resolver: EngineResolver;
  /** Optional mapping overrides (merged with defaults) */
  mapping?: Partial<PanelChipsetMapping>;
  /** Domain to use for panels not in the mapping (default: 'glue') */
  fallbackDomain?: EngineDomain;
}

/**
 * Result of routing a panel request through the adapter.
 */
export interface PanelRouteResult {
  /** The panel that was routed */
  panelId: PanelId;
  /** Name of the resolved engine */
  engineName: string;
  /** Domain of the resolved engine */
  engineDomain: EngineDomain;
  /** Budget percentage allocated to the engine */
  budgetPercentage: number;
}

// ─── Default Mapping ─────────────────────────────────────────────────────────

/**
 * Default panel-to-engine-domain mapping.
 *
 * Systems panels (computation focus) -> context engine (60% budget)
 * Heritage panels (expression/rendering) -> output engine (15% budget)
 * Frontier panel (distributed computing) -> io engine (15% budget)
 * Natural language + future panels -> glue engine (10% budget, routing)
 */
export const DEFAULT_PANEL_MAPPING: PanelChipsetMapping = {
  // Systems panels: computation focus
  python: 'context',
  cpp: 'context',
  java: 'context',

  // Heritage panels: expression/rendering
  lisp: 'output',
  pascal: 'output',
  fortran: 'output',
  perl: 'output',
  algol: 'output',

  // Frontier panel: distributed/content-addressed
  unison: 'io',

  // Natural language: routing/integration
  natural: 'glue',

  // Future: fallback to glue
  vhdl: 'glue',
};

// ─── ChipsetAdapter ──────────────────────────────────────────────────────────

export class ChipsetAdapter {
  private readonly resolver: EngineResolver;
  private readonly mapping: PanelChipsetMapping;
  private readonly fallbackDomain: EngineDomain;

  constructor(config: ChipsetAdapterConfig) {
    this.resolver = config.resolver;
    this.fallbackDomain = config.fallbackDomain ?? 'glue';
    this.mapping = {
      ...DEFAULT_PANEL_MAPPING,
      ...config.mapping,
    } as PanelChipsetMapping;
  }

  /**
   * Get the engine domain for a panel ID.
   * Falls back to the configured fallback domain for unmapped panels.
   */
  getDomainForPanel(panelId: PanelId): EngineDomain {
    return this.mapping[panelId] ?? this.fallbackDomain;
  }

  /**
   * Resolve the engine definition for a panel via the mapping and resolver.
   */
  resolveEngine(panelId: PanelId): { name: string; domain: string; dma: { percentage: number } } | undefined {
    const domain = this.getDomainForPanel(panelId);
    return this.resolver.getByDomain(domain);
  }

  /**
   * Route a panel request, returning full routing details.
   * If the engine is not found in the resolver, returns 'unknown' with 0 budget.
   */
  routePanelRequest(panelId: PanelId): PanelRouteResult {
    const domain = this.getDomainForPanel(panelId);
    const engine = this.resolver.getByDomain(domain);

    return {
      panelId,
      engineName: engine?.name ?? 'unknown',
      engineDomain: domain,
      budgetPercentage: engine?.dma.percentage ?? 0,
    };
  }

  /**
   * Get the full resolved panel-to-engine-domain mapping.
   */
  getMapping(): PanelChipsetMapping {
    return { ...this.mapping };
  }
}
