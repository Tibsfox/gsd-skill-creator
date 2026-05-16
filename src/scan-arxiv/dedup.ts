// === Dedup State Manager ===
//
// Manages .planning/arxiv-cache/seen-ids.json — tracks which arxiv papers have
// already been ingested via sc:learn so bridge can skip them on subsequent runs.
//
// Atomic-write pattern: write to seen-ids.json.tmp, then fs.renameSync to
// seen-ids.json. If the process crashes between the two steps, the original
// file remains intact.

import * as fs from 'node:fs';
import * as path from 'node:path';

// === Types ===

export interface SeenEntry {
  ingestedAt: string;
  reportPath: string;
}

export interface SeenIdsState {
  ids: Record<string, SeenEntry>;
  version: 1;
}

// === Default path ===

export const DEFAULT_SEEN_IDS_PATH = '.planning/arxiv-cache/seen-ids.json';

// === State helpers ===

export function emptyState(): SeenIdsState {
  return { ids: {}, version: 1 };
}

/**
 * Load seen-ids.json from `filePath` (defaults to DEFAULT_SEEN_IDS_PATH).
 * Returns an empty state if the file does not exist.
 */
export function loadSeenIds(filePath?: string): SeenIdsState {
  const target = filePath ?? DEFAULT_SEEN_IDS_PATH;
  if (!fs.existsSync(target)) {
    return emptyState();
  }
  try {
    const raw = fs.readFileSync(target, 'utf-8');
    const parsed = JSON.parse(raw) as SeenIdsState;
    // Basic schema guard
    if (parsed.version !== 1 || typeof parsed.ids !== 'object') {
      return emptyState();
    }
    return parsed;
  } catch {
    return emptyState();
  }
}

/**
 * Return a new state with `arxivId` recorded.
 * Does NOT write to disk — call saveSeenIds() after this.
 */
export function recordSeen(
  state: SeenIdsState,
  arxivId: string,
  reportPath: string,
): SeenIdsState {
  return {
    ...state,
    ids: {
      ...state.ids,
      [arxivId]: {
        ingestedAt: new Date().toISOString(),
        reportPath,
      },
    },
  };
}

/**
 * Returns true if `arxivId` is already in the seen-ids state.
 */
export function isSeen(state: SeenIdsState, arxivId: string): boolean {
  return Object.prototype.hasOwnProperty.call(state.ids, arxivId);
}

/**
 * Atomically persist `state` to `filePath` (defaults to DEFAULT_SEEN_IDS_PATH).
 * Writes to a .tmp file then renames — safe against mid-write crashes.
 */
export function saveSeenIds(state: SeenIdsState, filePath?: string): void {
  const target = filePath ?? DEFAULT_SEEN_IDS_PATH;
  const dir = path.dirname(target);
  fs.mkdirSync(dir, { recursive: true });
  const tmp = `${target}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(state, null, 2), 'utf-8');
  fs.renameSync(tmp, target);
}
