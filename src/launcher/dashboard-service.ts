/**
 * Dashboard service -- wraps dashboard generation and file watching.
 *
 * Provides a programmatic API with start/stop/status operations,
 * following the same idempotent pattern as TerminalProcessManager.
 * The generator function is injected via the constructor for testability;
 * when omitted, the service attempts a dynamic import of the compiled
 * dashboard generator at runtime.
 *
 * @module launcher/dashboard-service
 */

import { existsSync } from 'node:fs';
import { watch } from 'node:fs/promises';
import type { DashboardServiceConfig, DashboardServiceStatus } from './types.js';

// ---------------------------------------------------------------------------
// Generator function type
// ---------------------------------------------------------------------------

/** Signature for the dashboard generator function (matches dist/dashboard/generator.js). */
export interface DashboardGeneratorFn {
  (options: {
    planningDir: string;
    outputDir: string;
    force?: boolean;
    live?: boolean;
    refreshInterval?: number;
  }): Promise<{
    pages: string[];
    skipped: string[];
    errors: string[];
    duration: number;
  }>;
}

// ---------------------------------------------------------------------------
// DashboardService
// ---------------------------------------------------------------------------

/**
 * Manages dashboard generation and file-watching lifecycle.
 *
 * Consumers create an instance with config and an optional generator
 * function, then call start()/stop()/status() to control the service.
 * When no generator is provided, the service loads one dynamically
 * from the compiled dist/ output.
 */
export class DashboardService {
  private readonly config: DashboardServiceConfig;
  private generatorFn: DashboardGeneratorFn | null;

  private running = false;
  private watching = false;
  private lastGeneratedAt: string | null = null;
  private pagesGenerated = 0;
  private watchAbort: AbortController | null = null;

  private readonly debounceMs: number;
  private readonly refreshInterval: number;

  constructor(config: DashboardServiceConfig, generateFn?: DashboardGeneratorFn) {
    this.config = config;
    this.generatorFn = generateFn ?? null;
    this.debounceMs = config.debounceMs ?? 800;
    this.refreshInterval = config.refreshInterval ?? 5000;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Start the dashboard service: generate pages and begin watching.
   *
   * Idempotent: calling start() when already running returns the
   * current status without regenerating or re-attaching the watcher.
   */
  async start(): Promise<DashboardServiceStatus> {
    if (this.running) {
      return this.status();
    }

    // Resolve generator function (dynamic import fallback)
    if (this.generatorFn === null) {
      this.generatorFn = await this.loadGenerator();
    }

    // Run initial generation
    await this.generate();

    // Start file watcher (only if planning dir exists)
    this.startWatcher();

    this.running = true;
    return this.status();
  }

  /**
   * Stop the dashboard service: cancel watcher and clean up.
   *
   * Idempotent: calling stop() when already stopped is a no-op.
   */
  async stop(): Promise<DashboardServiceStatus> {
    if (!this.running) {
      return this.status();
    }

    // Cancel the file watcher
    if (this.watchAbort !== null) {
      this.watchAbort.abort();
      this.watchAbort = null;
    }

    this.running = false;
    this.watching = false;
    return this.status();
  }

  /**
   * Get the current service status.
   */
  status(): DashboardServiceStatus {
    return {
      process: this.running ? 'running' : 'stopped',
      lastGeneratedAt: this.lastGeneratedAt,
      pagesGenerated: this.pagesGenerated,
      watching: this.watching,
      planningDir: this.config.planningDir,
      outputDir: this.config.outputDir,
    };
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /** Run the dashboard generator, catching errors gracefully. */
  private async generate(): Promise<void> {
    if (this.generatorFn === null) {
      return;
    }

    try {
      const result = await this.generatorFn({
        planningDir: this.config.planningDir,
        outputDir: this.config.outputDir,
        force: true,
        live: true,
        refreshInterval: this.refreshInterval,
      });

      this.pagesGenerated = result.pages.length;
      this.lastGeneratedAt = new Date().toISOString();

      if (result.errors.length > 0) {
        console.error('[dashboard-service] Generation errors:', result.errors);
      }
    } catch (err) {
      console.error(
        '[dashboard-service] Generation failed:',
        err instanceof Error ? err.message : String(err),
      );
      // Leave pagesGenerated and lastGeneratedAt unchanged (0 / null on first run)
    }
  }

  /**
   * Start the file watcher on the planning directory.
   *
   * Uses node:fs/promises watch() with recursive:true and an
   * AbortController for clean cancellation. Changes are debounced
   * to avoid redundant regeneration during rapid edits.
   */
  private startWatcher(): void {
    const { planningDir } = this.config;

    // Cannot watch a directory that doesn't exist
    if (!existsSync(planningDir)) {
      this.watching = false;
      return;
    }

    this.watchAbort = new AbortController();
    this.watching = true;

    // Fire-and-forget: the watcher loop runs in the background
    // and is cancelled via the AbortController on stop().
    this.watchLoop(planningDir, this.watchAbort.signal).catch(() => {
      // Watcher stopped (abort or error) -- no action needed
    });
  }

  /** Async watcher loop with debounced regeneration. */
  private async watchLoop(dir: string, signal: AbortSignal): Promise<void> {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;

    try {
      const watcher = watch(dir, { recursive: true, signal });

      for await (const event of watcher) {
        // Skip hidden and temp files
        if (
          event.filename &&
          (event.filename.startsWith('.') ||
            event.filename.endsWith('~') ||
            event.filename.endsWith('.swp'))
        ) {
          continue;
        }

        // Debounce rapid changes
        if (debounceTimer !== null) {
          clearTimeout(debounceTimer);
        }
        debounceTimer = setTimeout(() => {
          void this.generate();
        }, this.debounceMs);
      }
    } catch (err) {
      // AbortError is expected on stop() -- rethrow others for the caller
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      throw err;
    } finally {
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
    }
  }

  /**
   * Dynamically import the compiled dashboard generator.
   *
   * Falls back to null if the generator module is not available
   * (e.g., project hasn't been compiled yet).
   */
  private async loadGenerator(): Promise<DashboardGeneratorFn | null> {
    try {
      // Relative path resolved by tsc from src/launcher/ to src/dashboard/
      const mod = await import('../dashboard/generator.js');
      return mod.generate as DashboardGeneratorFn;
    } catch {
      console.error('[dashboard-service] Could not load generator from dist/');
      return null;
    }
  }
}
