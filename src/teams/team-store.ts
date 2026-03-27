/**
 * Team configuration persistence layer.
 *
 * TeamStore handles reading, writing, listing, and deleting team configs
 * at project or user scope. Follows the SkillStore pattern from
 * src/storage/skill-store.ts.
 *
 * Configs are stored as JSON at {teamsDir}/{teamName}/config.json.
 * Validation is performed via validateTeamConfig() before writing.
 */

import { readFile, writeFile, mkdir, readdir, stat, rm } from 'fs/promises';
import { join, resolve } from 'path';
import { homedir } from 'node:os';
import { validateTeamConfig } from '../validation/team-validation.js';
import type { TeamConfig } from '../types/team.js';
import {
  validateSafeName,
  assertSafePath,
  PathTraversalError,
} from '../validation/path-safety.js';

// ============================================================================
// Scope Types
// ============================================================================

/**
 * Scope determines where team configs are stored.
 * - 'user': User-level teams in ~/.claude/teams/ (shared across projects)
 * - 'project': Project-level teams in .claude/teams/ (project-specific)
 */
export type TeamScope = 'user' | 'project';

// ============================================================================
// Path Helpers
// ============================================================================

/**
 * Get the base path for teams storage based on scope.
 *
 * @param scope - 'user' for ~/.claude/teams, 'project' for .claude/teams
 * @returns Path to teams directory
 */
export function getTeamsBasePath(scope: TeamScope): string {
  if (scope === 'user') {
    return join(homedir(), '.claude', 'teams');
  }
  return join('.claude', 'teams');
}

/**
 * Get the base path for agent files.
 *
 * Always returns project-scope path due to bug #11205 where user-level
 * agents in ~/.claude/agents/ may not be discovered by Claude Code.
 *
 * @returns Path to agents directory (always project scope)
 */
export function getAgentsBasePath(): string {
  return join('.claude', 'agents');
}

// ============================================================================
// TeamStore
// ============================================================================

/**
 * Persistence layer for team configurations.
 *
 * Provides CRUD operations for team config.json files within a
 * teams directory. Validates configs before writing.
 */
export class TeamStore {
  constructor(private teamsDir: string) {}

  /**
   * Validate that a name is safe for filesystem use (no traversal).
   * @throws PathTraversalError if name contains traversal sequences
   */
  private assertSafeName(name: string): void {
    const result = validateSafeName(name);
    if (!result.valid) {
      throw new PathTraversalError(result.error!);
    }
  }

  /**
   * Verify a resolved path stays within the teams directory.
   * @throws PathTraversalError if path escapes the base directory
   */
  private assertSafeTeamPath(resolvedPath: string): void {
    assertSafePath(resolve(resolvedPath), resolve(this.teamsDir));
  }

  /**
   * Save a team configuration to disk.
   *
   * Validates the config with validateTeamConfig() before writing.
   * Creates the team directory if it doesn't exist.
   *
   * @param config - Team configuration to save
   * @returns Path to the written config.json file
   * @throws Error if config fails validation
   */
  async save(config: TeamConfig): Promise<string> {
    this.assertSafeName(config.name);

    const validation = validateTeamConfig(config);
    if (!validation.valid) {
      throw new Error(
        `Invalid team config: ${validation.errors.join('; ')}`
      );
    }

    const teamDir = join(this.teamsDir, config.name);
    const configPath = join(teamDir, 'config.json');
    this.assertSafeTeamPath(teamDir);

    await mkdir(teamDir, { recursive: true });
    await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

    return configPath;
  }

  /**
   * Read a team configuration from disk.
   *
   * @param teamName - Name of the team to read
   * @returns Parsed TeamConfig object
   * @throws Error if config file doesn't exist
   */
  async read(teamName: string): Promise<TeamConfig> {
    this.assertSafeName(teamName);
    const configPath = join(this.teamsDir, teamName, 'config.json');
    this.assertSafeTeamPath(configPath);
    const content = await readFile(configPath, 'utf-8');
    return JSON.parse(content) as TeamConfig;
  }

  /**
   * Check if a team configuration exists.
   *
   * @param teamName - Name of the team to check
   * @returns true if config.json exists for this team
   */
  async exists(teamName: string): Promise<boolean> {
    this.assertSafeName(teamName);
    const configPath = join(this.teamsDir, teamName, 'config.json');
    this.assertSafeTeamPath(configPath);
    try {
      await stat(configPath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * List all team names in the teams directory.
   *
   * Reads the teams directory, filters to subdirectories that contain
   * a config.json file. Returns empty array if directory doesn't exist.
   *
   * @returns Array of team names
   */
  async list(): Promise<string[]> {
    try {
      const entries = await readdir(this.teamsDir, { withFileTypes: true });
      const teamNames: string[] = [];

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const configPath = join(this.teamsDir, entry.name, 'config.json');
          try {
            await stat(configPath);
            teamNames.push(entry.name);
          } catch {
            // No config.json, skip
          }
        }
      }

      return teamNames;
    } catch {
      // Teams directory doesn't exist yet
      return [];
    }
  }

  /**
   * Delete a team configuration and its directory.
   *
   * @param teamName - Name of the team to delete
   */
  async delete(teamName: string): Promise<void> {
    this.assertSafeName(teamName);
    const teamDir = join(this.teamsDir, teamName);
    this.assertSafeTeamPath(teamDir);
    await rm(teamDir, { recursive: true, force: true });
  }
}
