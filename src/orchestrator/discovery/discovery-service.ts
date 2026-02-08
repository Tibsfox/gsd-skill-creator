/**
 * GSD Discovery Service.
 *
 * Orchestrates scanning, parsing, and caching for full GSD discovery.
 * Scans the filesystem for commands, agents, and teams, then parses
 * each into typed metadata. Uses VERSION file mtime for cache
 * invalidation, ensuring subsequent discover() calls complete in < 50ms.
 *
 * This service is the primary API surface for all downstream phases (37-44).
 */

import { readFile, stat, access } from 'fs/promises';
import { join, basename } from 'path';
import { homedir } from 'os';
import { parseCommandFile } from './command-parser.js';
import { parseAgentFile } from './agent-parser.js';
import { parseTeamConfig } from './team-parser.js';
import { scanDirectory, scanDirectoryForDirs } from './scanner.js';
import type {
  DiscoveryResult,
  GsdCommandMetadata,
  GsdAgentMetadata,
  GsdTeamMetadata,
  DiscoveryWarning,
  GsdLocation,
} from './types.js';

/**
 * Detect where GSD is installed by checking for VERSION file presence.
 *
 * Checks global (~/.claude/) first, then local (./.claude/). Returns the
 * first installation found, or null if GSD is not installed in either location.
 *
 * Accepts optional overrides for dependency injection in tests (DISC-08).
 *
 * @param overrides - Optional path overrides for testing
 * @returns Installation info with location and basePath, or null if not found
 */
export async function detectGsdInstallation(
  overrides?: { globalBase?: string; localBase?: string },
): Promise<{ location: GsdLocation; basePath: string } | null> {
  // Check global first (most common installation location)
  const globalBase = overrides?.globalBase ?? join(homedir(), '.claude');
  const globalVersion = join(globalBase, 'get-shit-done', 'VERSION');

  try {
    await access(globalVersion);
    return { location: 'global', basePath: globalBase };
  } catch {
    /* not found -- continue to local */
  }

  // Check local (./.claude/ in current working directory)
  const localBase = overrides?.localBase ?? join(process.cwd(), '.claude');
  const localVersion = join(localBase, 'get-shit-done', 'VERSION');

  try {
    await access(localVersion);
    return { location: 'local', basePath: localBase };
  } catch {
    /* not found */
  }

  return null;
}

/**
 * Factory function to create a configured GsdDiscoveryService.
 *
 * Auto-detects the GSD installation location and returns a ready-to-use
 * service instance, or null if no GSD installation is found.
 *
 * This is the recommended public API entry point for consumers who
 * don't want to manage installation paths manually.
 *
 * @param overrides - Optional path overrides for testing
 * @returns Configured discovery service, or null if no GSD installation found
 */
export async function createDiscoveryService(
  overrides?: { globalBase?: string; localBase?: string },
): Promise<GsdDiscoveryService | null> {
  const installation = await detectGsdInstallation(overrides);
  if (!installation) return null;
  return new GsdDiscoveryService(installation.basePath, installation.location);
}

/**
 * Main discovery service for GSD installations.
 *
 * Usage:
 * ```typescript
 * const service = new GsdDiscoveryService('/home/user/.claude');
 * const result = await service.discover();
 * console.log(result.commands, result.agents, result.teams);
 * ```
 */
export class GsdDiscoveryService {
  private cache: { versionMtime: number; result: DiscoveryResult } | null = null;
  private _warnings: DiscoveryWarning[] = [];

  constructor(
    private basePath: string,
    private location: GsdLocation = 'global',
  ) {}

  /**
   * Warnings from the most recent discover() call.
   * Includes parse errors for malformed files, missing directories, etc.
   */
  get warnings(): ReadonlyArray<DiscoveryWarning> {
    return this._warnings;
  }

  /**
   * Discover all GSD commands, agents, and teams.
   *
   * Returns a typed DiscoveryResult with all discovered artifacts.
   * Uses VERSION file mtime for cache invalidation -- subsequent calls
   * return cached results if VERSION file has not been modified.
   */
  async discover(): Promise<DiscoveryResult> {
    // Clear warnings for this run
    this._warnings = [];

    // Check VERSION mtime for cache key
    const versionMtime = await this.getVersionMtime();

    // Cache hit: same mtime, non-zero (zero means VERSION doesn't exist = no caching)
    if (this.cache && this.cache.versionMtime === versionMtime && versionMtime !== 0) {
      return this.cache.result;
    }

    // Full scan
    const commands = await this.discoverCommands();
    const agents = await this.discoverAgents();
    const teams = await this.discoverTeams();
    const version = await this.readVersion();

    const result: DiscoveryResult = {
      commands,
      agents,
      teams,
      location: this.location,
      basePath: this.basePath,
      version,
      discoveredAt: Date.now(),
    };

    // Cache the result
    this.cache = { versionMtime, result };

    return result;
  }

  /**
   * Get the mtime of the VERSION file for cache invalidation.
   * Returns 0 if the file doesn't exist (disables caching).
   */
  private async getVersionMtime(): Promise<number> {
    try {
      const stats = await stat(join(this.basePath, 'get-shit-done', 'VERSION'));
      return stats.mtimeMs;
    } catch {
      return 0;
    }
  }

  /**
   * Read the VERSION file content.
   */
  private async readVersion(): Promise<string | undefined> {
    try {
      const content = await readFile(
        join(this.basePath, 'get-shit-done', 'VERSION'),
        'utf-8',
      );
      return content.trim();
    } catch {
      return undefined;
    }
  }

  /**
   * Discover GSD command files from commands/gsd/ directory.
   */
  private async discoverCommands(): Promise<GsdCommandMetadata[]> {
    const commandsDir = join(this.basePath, 'commands', 'gsd');
    const files = await scanDirectory(commandsDir, '.md');
    const results: GsdCommandMetadata[] = [];

    for (const filePath of files) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const metadata = parseCommandFile(content, filePath);

        if (metadata) {
          results.push(metadata);
        } else {
          this._warnings.push({
            type: 'parse-error',
            path: filePath,
            message: `Failed to parse command file: missing required frontmatter fields`,
          });
        }
      } catch (err) {
        this._warnings.push({
          type: 'parse-error',
          path: filePath,
          message: `Error reading command file: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return results;
  }

  /**
   * Discover GSD agent files from agents/ directory.
   * Only includes files with gsd-* prefix (per DISC-03).
   */
  private async discoverAgents(): Promise<GsdAgentMetadata[]> {
    const agentsDir = join(this.basePath, 'agents');
    const files = await scanDirectory(agentsDir, '.md');

    // Filter to gsd-* prefix only
    const gsdFiles = files.filter((f) => basename(f).startsWith('gsd-'));
    const results: GsdAgentMetadata[] = [];

    for (const filePath of gsdFiles) {
      try {
        const content = await readFile(filePath, 'utf-8');
        const metadata = parseAgentFile(content, filePath);

        if (metadata) {
          results.push(metadata);
        } else {
          this._warnings.push({
            type: 'parse-error',
            path: filePath,
            message: `Failed to parse agent file: missing required frontmatter fields`,
          });
        }
      } catch (err) {
        this._warnings.push({
          type: 'parse-error',
          path: filePath,
          message: `Error reading agent file: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return results;
  }

  /**
   * Discover team configs from teams/ subdirectories.
   * Each team is a subdirectory containing a config.json file.
   */
  private async discoverTeams(): Promise<GsdTeamMetadata[]> {
    const teamsDir = join(this.basePath, 'teams');
    const teamNames = await scanDirectoryForDirs(teamsDir);
    const results: GsdTeamMetadata[] = [];

    for (const teamName of teamNames) {
      const configPath = join(teamsDir, teamName, 'config.json');
      try {
        const content = await readFile(configPath, 'utf-8');
        const metadata = parseTeamConfig(content, configPath);

        if (metadata) {
          results.push(metadata);
        } else {
          this._warnings.push({
            type: 'parse-error',
            path: configPath,
            message: `Failed to parse team config: missing required fields`,
          });
        }
      } catch (err) {
        this._warnings.push({
          type: 'parse-error',
          path: configPath,
          message: `Error reading team config: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
    }

    return results;
  }
}
