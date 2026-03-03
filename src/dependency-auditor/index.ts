/**
 * dependency-auditor public API.
 *
 * Complete Phase 44 surface:
 *  - Types (Plan 01)
 *  - ManifestDiscovery (Plan 01)
 *  - RegistryAdapter interface (Plan 02)
 *  - npm / PyPI / conda adapters (Plan 02)
 *  - RateLimiter (Plan 02/03)
 *  - Cargo / RubyGems adapters (Plan 03)
 *  - OsvClient (Plan 03)
 *  - IncrementalScanner (Plan 04)
 *  - DryRunGate (Plan 04)
 *  - AuditOrchestrator (Plan 04)
 */

// ─── Types ───────────────────────────────────────────────────────────────────
export type {
  Ecosystem,
  DependencyRecord,
  RegistryHealth,
  OsvVulnerability,
  HealthSignal,
  AuditSnapshot,
  IncrementalScanState,
  RateLimiterConfig,
  AuditorConfig,
} from './types.js';
export { MANIFEST_FILENAMES, DEFAULT_RATE_LIMITER_CONFIG } from './types.js';

// ─── Manifest Discovery ───────────────────────────────────────────────────────
export { ManifestDiscovery, discoverManifests } from './manifest-discovery.js';

// ─── Registry Adapter Interface ───────────────────────────────────────────────
export type { RegistryAdapter } from './registry-adapter.js';

// ─── Registry Adapters ────────────────────────────────────────────────────────
export { NpmRegistryAdapter } from './registry-adapters/npm.js';
export { PypiRegistryAdapter } from './registry-adapters/pypi.js';
export { CondaRegistryAdapter } from './registry-adapters/conda.js';
export { CargoRegistryAdapter } from './registry-adapters/cargo.js';
export { RubygemsRegistryAdapter } from './registry-adapters/rubygems.js';

// ─── Rate Limiter ─────────────────────────────────────────────────────────────
export { RateLimiter } from './rate-limiter.js';

// ─── OSV Client ───────────────────────────────────────────────────────────────
export { OsvClient } from './osv-client.js';

// ─── Incremental Scanner ──────────────────────────────────────────────────────
export { IncrementalScanner } from './incremental-scan.js';

// ─── Dry-Run Gate ─────────────────────────────────────────────────────────────
export type { DryRunResult } from './dry-run-gate.js';
export { DryRunGate } from './dry-run-gate.js';

// ─── Orchestrator ─────────────────────────────────────────────────────────────
export { AuditOrchestrator } from './audit-orchestrator.js';
