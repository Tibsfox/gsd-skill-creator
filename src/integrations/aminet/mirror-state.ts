/**
 * Mirror state persistence for Aminet package tracking.
 *
 * Manages .mirror-state.json with atomic write-then-rename to prevent
 * corruption from interrupted writes. All state operations are pure --
 * updateEntry returns a new state object without mutating the input.
 *
 * @module
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { MirrorStateSchema } from './types.js';
import type { MirrorEntry, MirrorState } from './types.js';

/** Filename for the mirror state file within the cache directory. */
const STATE_FILENAME = '.mirror-state.json';

/**
 * Load mirror state from `${cacheDir}/.mirror-state.json`.
 *
 * Returns the parsed MirrorState if the file exists and is valid JSON.
 * Returns an empty default state if the file does not exist.
 *
 * @param cacheDir - Directory containing the state file
 * @returns Parsed MirrorState
 */
export function loadMirrorState(cacheDir: string): MirrorState {
  const filePath = join(cacheDir, STATE_FILENAME);

  if (!existsSync(filePath)) {
    return {
      entries: {},
      lastUpdated: new Date().toISOString(),
      version: 1,
    };
  }

  const raw = readFileSync(filePath, 'utf-8');
  return MirrorStateSchema.parse(JSON.parse(raw));
}

/**
 * Save mirror state to `${cacheDir}/.mirror-state.json` atomically.
 *
 * Uses write-then-rename to prevent corruption: writes to a `.tmp`
 * file first, then renames over the real file. Creates the cache
 * directory recursively if it does not exist.
 *
 * @param state - MirrorState to persist
 * @param cacheDir - Directory to write the state file into
 */
export function saveMirrorState(state: MirrorState, cacheDir: string): void {
  mkdirSync(cacheDir, { recursive: true });

  const filePath = join(cacheDir, STATE_FILENAME);
  const tmpPath = `${filePath}.tmp`;

  writeFileSync(tmpPath, JSON.stringify(state, null, 2), 'utf-8');
  renameSync(tmpPath, filePath);
}

/**
 * Update a single entry in the mirror state.
 *
 * Returns a NEW state object with the entry at `fullPath` merged with
 * the provided updates. Does NOT mutate the original state.
 *
 * If no entry exists at `fullPath`, a new one is created from the
 * updates (the caller must provide at least fullPath, status, sizeKb).
 *
 * @param state - Current mirror state
 * @param fullPath - Aminet package path (e.g., "mus/edit/ProTracker36.lha")
 * @param updates - Partial entry fields to merge
 * @returns New MirrorState with the updated entry
 */
export function updateEntry(
  state: MirrorState,
  fullPath: string,
  updates: Partial<MirrorEntry>,
): MirrorState {
  const existing = state.entries[fullPath];
  const merged = existing
    ? { ...existing, ...updates }
    : {
        fullPath,
        status: 'not-mirrored' as const,
        sizeKb: 0,
        sha256: null,
        localPath: null,
        downloadedAt: null,
        lastChecked: null,
        ...updates,
      };

  return {
    ...state,
    entries: {
      ...state.entries,
      [fullPath]: merged as MirrorEntry,
    },
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Look up a single entry by fullPath.
 *
 * @param state - Current mirror state
 * @param fullPath - Aminet package path to look up
 * @returns The MirrorEntry if found, undefined otherwise
 */
export function getEntry(
  state: MirrorState,
  fullPath: string,
): MirrorEntry | undefined {
  return state.entries[fullPath];
}
