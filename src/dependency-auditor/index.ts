/**
 * dependency-auditor public API.
 *
 * This index grows as each plan in Phase 44 adds new exports.
 * Plan 44-01: types + manifest-discovery (below).
 * Plans 44-02 through 44-04 will append registry adapters, OSV client,
 * incremental scanner, and the AuditOrchestrator.
 */

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

export { ManifestDiscovery, discoverManifests } from './manifest-discovery.js';
