/**
 * Barrel exports for the CE-1 (Commons Engine) module.
 *
 * Provides a single import point for all CE-1 public API:
 * - Attribution ledger for ICD-02 conforming contribution records
 * - Contribution registry for contributor management and version tracking
 * - Invocation recorder for event-driven LEDGER_ENTRY capture
 * - Token architecture specification with YAML export
 * - Weighting engine for frequency/critical-path/depth-decay calculation
 * - Dividend calculator for three-tier distribution plans
 * - Ledger seal guard for post-mission-close immutability
 */

// Attribution ledger
export { AttributionLedger } from './attribution-ledger.js';
export type { LedgerEntry, LedgerQuery } from './attribution-ledger.js';

// Contribution registry
export { ContributionRegistry } from './contribution-registry.js';
export type {
  Contributor,
  ContributorVersion,
  DependencyDeclaration,
  ContributorType,
  RegisterInput,
  UpdateInput,
} from './contribution-registry.js';

// Invocation recorder
export { InvocationRecorder } from './invocation-recorder.js';
export type { InvocationRecorderConfig, RecorderStats } from './invocation-recorder.js';

// Token architecture
export { TOKEN_ARCHITECTURE, TokenArchitectureSchema, toYaml } from './token-architecture.js';
export type {
  ContributionTokenSpec,
  GovernanceTokenSpec,
  InfrastructureBondSpec,
  DividendSpec,
} from './token-architecture.js';

// Weighting engine (Phase 210)
export { WeightingEngine, DEFAULT_WEIGHTING_CONFIG } from './weighting-engine.js';
export type { WeightVector, ContributorWeight, WeightBreakdown, WeightingConfig } from './weighting-engine.js';

// Dividend calculator (Phase 210)
export { DividendCalculator, DEFAULT_DIVIDEND_CONFIG } from './dividend-calculator.js';
export type { DistributionPlan, TierAllocation, ContributorAllocation, DividendConfig } from './dividend-calculator.js';

// Ledger seal guard (Phase 210)
export { LedgerSealGuard } from './ledger-seal.js';
export type { SealRecord, SealResult } from './ledger-seal.js';
