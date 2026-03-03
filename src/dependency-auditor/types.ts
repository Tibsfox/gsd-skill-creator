/**
 * Core type contracts for the dependency-auditor module.
 * All subsequent plans in Phase 44 import from this file.
 */

/** The five supported package ecosystems. */
export type Ecosystem = 'npm' | 'pypi' | 'conda' | 'cargo' | 'rubygems';

/** A single declared dependency, keyed by ecosystem and source manifest. */
export interface DependencyRecord {
  name: string;
  /** Declared version string (may include constraint prefixes like `^`, `~`, `>=`). */
  version: string;
  ecosystem: Ecosystem;
  /** Absolute path to the manifest file this dependency was read from. */
  sourceManifest: string;
}

/** Health information fetched from the upstream registry. */
export interface RegistryHealth {
  ecosystem: Ecosystem;
  name: string;
  latestVersion: string | null;
  /** ISO 8601 date string of the most recent publish, or null if unknown. */
  lastPublishDate: string | null;
  isArchived: boolean;
  isDeprecated: boolean;
  maintainerCount: number | null;
}

/**
 * A single vulnerability record sourced from the OSV database.
 * An empty `OsvVulnerability[]` explicitly means "clean — no known vulnerabilities".
 */
export interface OsvVulnerability {
  id: string;
  summary: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'UNKNOWN';
  aliases: string[];
}

/**
 * Wraps one dependency with its registry health and any known vulnerabilities.
 * This is the primary unit of analysis throughout the pipeline.
 */
export interface HealthSignal {
  dependency: DependencyRecord;
  registryHealth: RegistryHealth;
  /** Empty array means the dependency is clean — no known vulnerabilities. */
  vulnerabilities: OsvVulnerability[];
}

/** A point-in-time audit result for a project. */
export interface AuditSnapshot {
  projectRoot: string;
  /** ISO 8601 timestamp of when this snapshot was taken. */
  scannedAt: string;
  dependencies: DependencyRecord[];
  signals: HealthSignal[];
}

/**
 * Persisted state for incremental scanning.
 * Allows the auditor to skip re-scanning manifests whose content hasn't changed.
 * Keys for `cachedSignals` use the format `${ecosystem}:${name}`.
 */
export interface IncrementalScanState {
  /** SHA-256 hex hashes of each manifest file, keyed by absolute path. */
  manifestHashes: Record<string, string>;
  /** ISO 8601 timestamp of the most recent completed scan. */
  lastScanAt: string;
  /** Cached HealthSignal results keyed by `${ecosystem}:${name}`. */
  cachedSignals: Record<string, HealthSignal>;
}

/** Rate-limiting configuration for registry API requests. */
export interface RateLimiterConfig {
  /** Maximum number of requests allowed within `windowMs`. Defaults to 30. */
  maxRequests: number;
  /** Time window in milliseconds. Defaults to 60 000. */
  windowMs: number;
}

/** Top-level configuration for the AuditOrchestrator. */
export interface AuditorConfig {
  /** Absolute path to the project root being audited. */
  projectRoot: string;
  rateLimiter?: RateLimiterConfig;
  /** Absolute path to the incremental scan state file. */
  stateFilePath?: string;
  /** When true, the resolver runs in dry-run mode and makes no changes. */
  dryRunEnabled?: boolean;
}

// ─── Constants ───────────────────────────────────────────────────────────────

/**
 * Canonical manifest filenames for each ecosystem.
 * Used by the manifest discovery layer to locate package files.
 */
export const MANIFEST_FILENAMES: Record<Ecosystem, string[]> = {
  npm: ['package.json'],
  pypi: ['requirements.txt'],
  conda: ['environment.yml'],
  cargo: ['Cargo.toml'],
  rubygems: ['Gemfile'],
};

/** Default rate-limiter settings: 30 requests per 60-second window. */
export const DEFAULT_RATE_LIMITER_CONFIG: RateLimiterConfig = {
  maxRequests: 30,
  windowMs: 60_000,
};
