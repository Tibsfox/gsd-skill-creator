/**
 * Integration Bridge -- barrel export for all integration adapters.
 *
 * Provides a clean import path for downstream consumers that need to
 * connect the College/Rosetta Core to the skill-creator observation
 * pipeline, token budget enforcement, and chipset routing.
 *
 * @module integration
 */

// Observation Bridge
export { ObservationBridge } from './observation-bridge.js';
export type { CollegeObservationEvent, ObservationBridgeConfig } from './observation-bridge.js';

// Token Budget Adapter
export { TokenBudgetAdapter } from './token-budget-adapter.js';
export type { BudgetEnforcementResult, ContextWindowConfig } from './token-budget-adapter.js';

// Chipset Adapter
export { ChipsetAdapter, DEFAULT_PANEL_MAPPING } from './chipset-adapter.js';
export type {
  PanelChipsetMapping,
  ChipsetAdapterConfig,
  PanelRouteResult,
  EngineResolver,
  EngineDomain,
} from './chipset-adapter.js';
