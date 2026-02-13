/**
 * Versioned Pipeline library with CRUD, best-match retrieval, and JSON persistence.
 *
 * Stores learned Pipelines indexed by workflow type, tracks version history
 * as feedback refines them, and provides Jaccard similarity-based best-match
 * retrieval for finding the most relevant list for a given execution context.
 *
 * Persistence uses JSON files validated against PipelineSchema on load to
 * ensure only structurally valid lists are retained. Invalid entries are
 * skipped with a warning rather than causing load failure.
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import type { Pipeline } from '../types.js';
import { PipelineSchema } from '../schema.js';
import type { LibraryEntry } from './types.js';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Configuration for the PipelineLibrary.
 */
export interface LibraryConfig {
  /** Maximum versions to retain per workflowType (default 10). */
  maxVersionsPerType: number;
}

/** Default library configuration. */
export const DEFAULT_LIBRARY_CONFIG: LibraryConfig = {
  maxVersionsPerType: 10,
};

// ============================================================================
// Match Result
// ============================================================================

/**
 * Result of a best-match query against the library.
 */
export interface MatchResult {
  /** The matching library entry. */
  entry: LibraryEntry;
  /** Match score (0-1). */
  score: number;
}

// ============================================================================
// Serialization Types
// ============================================================================

/**
 * Serialized format for the library JSON file.
 */
interface SerializedLibrary {
  entries: Array<{
    workflowType: string;
    versions: LibraryEntry[];
  }>;
}

// ============================================================================
// PipelineLibrary
// ============================================================================

/**
 * Versioned Pipeline library with CRUD operations, best-match retrieval,
 * and JSON persistence.
 *
 * Entries are indexed by workflowType for efficient retrieval. Version history
 * is maintained per workflowType, with the latest version being the "current"
 * entry returned by get().
 */
export class PipelineLibrary {
  /**
   * Current (latest) entry per workflowType.
   */
  private currentEntries: Map<string, LibraryEntry> = new Map();

  /**
   * Maps list metadata.name to workflowType for getByName() lookups.
   * Includes names from all versions (current and historical).
   */
  private nameIndex: Map<string, string> = new Map();

  /**
   * Full version history per workflowType (deep copies, ordered by version).
   */
  private versionHistory: Map<string, LibraryEntry[]> = new Map();

  /**
   * Library configuration.
   */
  private config: LibraryConfig;

  constructor(config: Partial<LibraryConfig> = {}) {
    this.config = { ...DEFAULT_LIBRARY_CONFIG, ...config };
  }

  // --------------------------------------------------------------------------
  // CRUD Operations
  // --------------------------------------------------------------------------

  /**
   * Add a new library entry.
   *
   * @throws If an entry with the same list metadata name already exists.
   */
  add(entry: LibraryEntry): void {
    const name = entry.list.metadata.name;

    if (this.nameIndex.has(name)) {
      throw new Error(`Entry with name "${name}" already exists`);
    }

    // Store current entry
    this.currentEntries.set(entry.workflowType, entry);

    // Index by name
    this.nameIndex.set(name, entry.workflowType);

    // Initialize version history with a deep copy
    const history = this.versionHistory.get(entry.workflowType) ?? [];
    history.push(deepCopy(entry));
    this.versionHistory.set(entry.workflowType, history);

    // Trim if exceeds max
    this.trimHistory(entry.workflowType);
  }

  /**
   * Get the latest version of an entry by workflowType.
   *
   * @returns The entry, or undefined if not found.
   */
  get(workflowType: string): LibraryEntry | undefined {
    return this.currentEntries.get(workflowType);
  }

  /**
   * Get an entry by its Pipeline metadata name.
   *
   * Searches both current entries and version history for the given name.
   *
   * @returns The matching entry, or undefined if not found.
   */
  getByName(name: string): LibraryEntry | undefined {
    const workflowType = this.nameIndex.get(name);
    if (workflowType === undefined) {
      return undefined;
    }

    // Check if the current entry has this name
    const current = this.currentEntries.get(workflowType);
    if (current && current.list.metadata.name === name) {
      return current;
    }

    // Check version history for historical names
    const history = this.versionHistory.get(workflowType);
    if (history) {
      for (const entry of history) {
        if (entry.list.metadata.name === name) {
          return entry;
        }
      }
    }

    return undefined;
  }

  /**
   * Update an existing entry, incrementing its version.
   *
   * The entry's workflowType must already exist in the library.
   * The version is automatically incremented from the current version.
   */
  update(entry: LibraryEntry): void {
    const current = this.currentEntries.get(entry.workflowType);

    if (current) {
      // Increment version from the current version
      entry.version = current.version + 1;
      entry.list.metadata.version = entry.version;
      entry.updatedAt = Date.now();
    }

    // Index the new name
    const name = entry.list.metadata.name;
    this.nameIndex.set(name, entry.workflowType);

    // Replace current entry
    this.currentEntries.set(entry.workflowType, entry);

    // Append to version history
    const history = this.versionHistory.get(entry.workflowType) ?? [];
    history.push(deepCopy(entry));
    this.versionHistory.set(entry.workflowType, history);

    // Trim if exceeds max
    this.trimHistory(entry.workflowType);
  }

  /**
   * Remove an entry by workflowType.
   *
   * @returns true if the entry was removed, false if not found.
   */
  remove(workflowType: string): boolean {
    if (!this.currentEntries.has(workflowType)) {
      return false;
    }

    // Remove name index entries for this workflowType
    const history = this.versionHistory.get(workflowType);
    if (history) {
      for (const entry of history) {
        this.nameIndex.delete(entry.list.metadata.name);
      }
    }

    // Also remove current entry name from index
    const current = this.currentEntries.get(workflowType);
    if (current) {
      this.nameIndex.delete(current.list.metadata.name);
    }

    this.currentEntries.delete(workflowType);
    this.versionHistory.delete(workflowType);

    return true;
  }

  /**
   * List all current entries.
   *
   * @returns Array of all current (latest version) entries.
   */
  list(): LibraryEntry[] {
    return Array.from(this.currentEntries.values());
  }

  // --------------------------------------------------------------------------
  // Version History
  // --------------------------------------------------------------------------

  /**
   * Get the full version history for a workflowType.
   *
   * @returns Array of all versions, ordered by version number.
   */
  getVersionHistory(workflowType: string): LibraryEntry[] {
    const history = this.versionHistory.get(workflowType);
    if (!history) {
      return [];
    }
    return [...history].sort((a, b) => a.version - b.version);
  }

  // --------------------------------------------------------------------------
  // Best-Match Retrieval
  // --------------------------------------------------------------------------

  /**
   * Find the best matching entry for a given set of tools and commands.
   *
   * Uses Jaccard similarity on token sets derived from:
   * - Entry: sourcePatterns, tags, workflowType tokens, MOVE instruction names
   * - Query: tools and extracted command names
   *
   * On tie scores, the entry with higher confidence wins.
   *
   * @returns The best match with score, or undefined if no entries or no overlap.
   */
  findBestMatch(query: {
    tools?: string[];
    commands?: string[];
  }): MatchResult | undefined {
    const queryTokens = this.extractQueryTokens(query);
    if (queryTokens.size === 0) {
      return undefined;
    }

    let bestMatch: MatchResult | undefined;

    for (const entry of this.currentEntries.values()) {
      const entryTokens = this.extractEntryTokens(entry);
      const score = jaccardSimilarity(queryTokens, entryTokens);

      if (score === 0) {
        continue;
      }

      if (
        !bestMatch ||
        score > bestMatch.score ||
        (score === bestMatch.score &&
          (entry.list.metadata.confidence ?? 0) >
            (bestMatch.entry.list.metadata.confidence ?? 0))
      ) {
        bestMatch = { entry, score };
      }
    }

    return bestMatch;
  }

  // --------------------------------------------------------------------------
  // Persistence
  // --------------------------------------------------------------------------

  /**
   * Save the library to a JSON file.
   *
   * Creates parent directories if needed. Serializes all version history
   * per workflowType.
   */
  async save(filePath: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });

    const data: SerializedLibrary = {
      entries: Array.from(this.versionHistory.entries()).map(
        ([workflowType, versions]) => ({
          workflowType,
          versions,
        }),
      ),
    };

    await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Load the library from a JSON file.
   *
   * Each entry's list is validated against PipelineSchema. Invalid entries
   * are skipped with a warning to stderr. If the file does not exist, this
   * is a silent no-op.
   */
  async load(filePath: string): Promise<void> {
    let raw: string;
    try {
      raw = await readFile(filePath, 'utf-8');
    } catch (err: unknown) {
      // File doesn't exist -- silent no-op
      if (isNodeError(err) && err.code === 'ENOENT') {
        return;
      }
      throw err;
    }

    const data: SerializedLibrary = JSON.parse(raw);

    // Clear existing state
    this.currentEntries.clear();
    this.nameIndex.clear();
    this.versionHistory.clear();

    for (const group of data.entries) {
      const validVersions: LibraryEntry[] = [];

      for (const entry of group.versions) {
        // Validate the list against PipelineSchema
        const result = PipelineSchema.safeParse(entry.list);
        if (!result.success) {
          process.stderr.write(
            `Warning: Skipping invalid entry "${entry.list?.metadata?.name ?? 'unknown'}" ` +
              `in workflowType "${group.workflowType}": ${result.error.message}\n`,
          );
          continue;
        }

        // Use the validated (possibly default-filled) list
        entry.list = result.data as unknown as Pipeline;
        validVersions.push(entry);
      }

      if (validVersions.length === 0) {
        continue;
      }

      // Sort by version
      validVersions.sort((a, b) => a.version - b.version);

      // Store version history
      this.versionHistory.set(group.workflowType, validVersions);

      // Set current entry to the latest version
      const latest = validVersions[validVersions.length - 1];
      this.currentEntries.set(group.workflowType, latest);

      // Index all names
      for (const entry of validVersions) {
        this.nameIndex.set(entry.list.metadata.name, group.workflowType);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Private Helpers
  // --------------------------------------------------------------------------

  /**
   * Trim version history for a workflowType to maxVersionsPerType.
   * Removes the oldest versions when the limit is exceeded.
   */
  private trimHistory(workflowType: string): void {
    const history = this.versionHistory.get(workflowType);
    if (!history) return;

    while (history.length > this.config.maxVersionsPerType) {
      const removed = history.shift();
      if (removed) {
        this.nameIndex.delete(removed.list.metadata.name);
      }
    }
  }

  /**
   * Extract search tokens from a query.
   */
  private extractQueryTokens(query: {
    tools?: string[];
    commands?: string[];
  }): Set<string> {
    const tokens = new Set<string>();

    if (query.tools) {
      for (const tool of query.tools) {
        tokens.add(tool.toLowerCase());
      }
    }

    if (query.commands) {
      for (const cmd of query.commands) {
        // Extract the main command name from compound commands
        // e.g., "npx vitest" -> "vitest", "npm run test" -> "test"
        const parts = cmd.trim().split(/\s+/);
        for (const part of parts) {
          const normalized = part.toLowerCase();
          if (!RUNNER_PREFIXES.has(normalized)) {
            tokens.add(normalized);
          }
        }
      }
    }

    return tokens;
  }

  /**
   * Extract search tokens from a library entry.
   */
  private extractEntryTokens(entry: LibraryEntry): Set<string> {
    const tokens = new Set<string>();

    // From sourcePatterns
    if (entry.list.metadata.sourcePatterns) {
      for (const pattern of entry.list.metadata.sourcePatterns) {
        tokens.add(pattern.toLowerCase());
      }
    }

    // From tags
    if (entry.list.metadata.tags) {
      for (const tag of entry.list.metadata.tags) {
        tokens.add(tag.toLowerCase());
      }
    }

    // From workflowType tokens (split on dashes)
    for (const token of entry.workflowType.split('-')) {
      if (token.length > 0) {
        tokens.add(token.toLowerCase());
      }
    }

    // From MOVE instruction names
    for (const instr of entry.list.instructions) {
      if (instr.type === 'move') {
        tokens.add(instr.name.toLowerCase());
      }
    }

    return tokens;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/** Runner prefixes to strip from commands during token extraction. */
const RUNNER_PREFIXES = new Set(['npx', 'npm', 'run', 'yarn', 'pnpm']);

/**
 * Compute Jaccard similarity between two sets: |intersection| / |union|.
 */
function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 0;

  let intersection = 0;
  for (const item of a) {
    if (b.has(item)) {
      intersection++;
    }
  }

  const union = a.size + b.size - intersection;
  if (union === 0) return 0;

  return intersection / union;
}

/**
 * Deep copy a LibraryEntry using JSON serialization.
 */
function deepCopy(entry: LibraryEntry): LibraryEntry {
  return JSON.parse(JSON.stringify(entry));
}

/**
 * Type guard for Node.js errors with a code property.
 */
function isNodeError(err: unknown): err is NodeJS.ErrnoException {
  return err instanceof Error && 'code' in err;
}
