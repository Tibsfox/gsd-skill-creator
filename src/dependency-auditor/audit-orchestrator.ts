/**
 * AuditOrchestrator — the top-level entry point for the Dependency Auditor.
 *
 * Wires together:
 *  1. ManifestDiscovery   — find all declared dependencies
 *  2. IncrementalScanner  — skip deps whose manifests haven't changed
 *  3. RegistryAdapters    — fetch RegistryHealth (rate-limited)
 *  4. OsvClient           — fetch vulnerability data
 *  5. DryRunGate          — optional pre-install conflict detection
 *
 * Returns an AuditSnapshot with HealthSignals for all dependencies.
 */

import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { discoverManifests } from './manifest-discovery.js';
import { NpmRegistryAdapter } from './registry-adapters/npm.js';
import { PypiRegistryAdapter } from './registry-adapters/pypi.js';
import { CondaRegistryAdapter } from './registry-adapters/conda.js';
import { CargoRegistryAdapter } from './registry-adapters/cargo.js';
import { RubygemsRegistryAdapter } from './registry-adapters/rubygems.js';
import { OsvClient } from './osv-client.js';
import { RateLimiter } from './rate-limiter.js';
import { IncrementalScanner } from './incremental-scan.js';
import { DryRunGate } from './dry-run-gate.js';
import type {
  AuditorConfig,
  AuditSnapshot,
  DependencyRecord,
  Ecosystem,
  HealthSignal,
  IncrementalScanState,
} from './types.js';
import type { RegistryAdapter } from './registry-adapter.js';

async function hashFile(path: string): Promise<string> {
  try {
    const content = await readFile(path, 'utf8');
    return createHash('sha256').update(content).digest('hex');
  } catch {
    return '';
  }
}

export class AuditOrchestrator {
  private readonly config: AuditorConfig;
  private readonly adapters: Record<Ecosystem, RegistryAdapter>;
  private readonly osvClient: OsvClient;
  private readonly scanner: IncrementalScanner;
  private readonly dryRunGate: DryRunGate;

  constructor(config: AuditorConfig) {
    this.config = config;
    const rateLimiter = new RateLimiter(config.rateLimiter);

    this.adapters = {
      npm: new NpmRegistryAdapter(rateLimiter),
      pypi: new PypiRegistryAdapter(rateLimiter),
      conda: new CondaRegistryAdapter(rateLimiter),
      cargo: new CargoRegistryAdapter(rateLimiter),
      rubygems: new RubygemsRegistryAdapter(rateLimiter),
    };

    this.osvClient = new OsvClient();
    this.scanner = new IncrementalScanner(
      config.stateFilePath ??
        join(config.projectRoot, '.dependency-audit-state.json'),
    );
    this.dryRunGate = new DryRunGate();
  }

  /**
   * Run a full dependency audit.
   *
   * 1. Discover all declared dependencies from all manifest files.
   * 2. Load incremental scan state; filter to stale/new deps only.
   * 3. Fetch RegistryHealth for stale deps (rate-limited).
   * 4. Fetch OSV vulnerabilities for stale deps.
   * 5. Merge fresh results with cached signals.
   * 6. Persist updated scan state.
   * 7. Optionally run dry-run conflict detection.
   * 8. Return AuditSnapshot.
   */
  async run(): Promise<AuditSnapshot> {
    const { projectRoot } = this.config;

    // Step 1: Discover all dependencies
    const allDeps = await discoverManifests(projectRoot);

    if (allDeps.length === 0) {
      return {
        projectRoot,
        scannedAt: new Date().toISOString(),
        dependencies: [],
        signals: [],
      };
    }

    // Step 2: Incremental filter
    const manifestPaths = [...new Set(allDeps.map((d) => d.sourceManifest))];
    await this.scanner.load();
    const staleDeps = await this.scanner.getStaleOrNew(allDeps, manifestPaths);

    // Step 3: Fetch registry health for stale deps
    const freshSignalsMap = new Map<string, HealthSignal>();

    if (staleDeps.length > 0) {
      // Fetch registry health for each stale dep
      const healthResults = await Promise.all(
        staleDeps.map(async (dep) => {
          const adapter = this.adapters[dep.ecosystem];
          try {
            const registryHealth = await adapter.fetchHealth(dep);
            return { dep, registryHealth };
          } catch {
            // Graceful degradation: return null health on adapter failure
            return {
              dep,
              registryHealth: {
                ecosystem: dep.ecosystem,
                name: dep.name,
                latestVersion: null,
                lastPublishDate: null,
                isArchived: false,
                isDeprecated: false,
                maintainerCount: null,
              },
            };
          }
        }),
      );

      // Step 4: Fetch OSV vulnerabilities for stale deps
      const vulnMap = await this.osvClient.queryBatch(staleDeps);

      // Step 5: Build fresh HealthSignals
      for (const { dep, registryHealth } of healthResults) {
        const key = `${dep.ecosystem}:${dep.name}`;
        const vulnerabilities = vulnMap.get(key) ?? [];
        freshSignalsMap.set(key, { dependency: dep, registryHealth, vulnerabilities });
      }
    }

    // Merge: fresh results take precedence over cached
    const allSignals: HealthSignal[] = allDeps.map((dep) => {
      const key = `${dep.ecosystem}:${dep.name}`;
      if (freshSignalsMap.has(key)) return freshSignalsMap.get(key)!;
      const cached = this.scanner.getCachedSignal(key);
      if (cached) return cached;
      // Fallback (shouldn't happen if logic is correct)
      return {
        dependency: dep,
        registryHealth: {
          ecosystem: dep.ecosystem,
          name: dep.name,
          latestVersion: null,
          lastPublishDate: null,
          isArchived: false,
          isDeprecated: false,
          maintainerCount: null,
        },
        vulnerabilities: [],
      };
    });

    // Step 6: Persist updated state
    const newHashes: Record<string, string> = {};
    for (const mPath of manifestPaths) {
      newHashes[mPath] = await hashFile(mPath);
    }

    const cachedSignals: Record<string, HealthSignal> = {};
    for (const signal of allSignals) {
      cachedSignals[`${signal.dependency.ecosystem}:${signal.dependency.name}`] = signal;
    }

    const newState: IncrementalScanState = {
      manifestHashes: newHashes,
      lastScanAt: new Date().toISOString(),
      cachedSignals,
    };
    await this.scanner.saveState(newState);

    // Step 7: Optional dry-run conflict detection
    if (this.config.dryRunEnabled) {
      const ecosystems = [...new Set(allDeps.map((d) => d.ecosystem))];
      await Promise.all(
        ecosystems.map((eco) => this.dryRunGate.check(projectRoot, eco)),
      );
    }

    // Step 8: Return snapshot
    return {
      projectRoot,
      scannedAt: new Date().toISOString(),
      dependencies: allDeps,
      signals: allSignals,
    };
  }
}
