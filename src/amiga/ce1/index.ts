/**
 * Barrel exports for the CE-1 (Commons Engine) module.
 *
 * Provides a single import point for all CE-1 public API:
 * - Attribution ledger for ICD-02 conforming contribution records
 * - Contribution registry for contributor management and version tracking
 * - Invocation recorder for event-driven LEDGER_ENTRY capture
 * - Token architecture specification with YAML export
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
