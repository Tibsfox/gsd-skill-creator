/**
 * Knowledge Pack progress tracker with localStorage persistence.
 *
 * Tracks per-pack completion state (not-started, in-progress, completed)
 * and persists to localStorage. Follows AminetPanel class-based pattern
 * with constructor options and destroy method.
 *
 * @module knowledge/progress-tracker
 */

import type { PackProgress, ProgressState } from "./types";

/** Options for constructing a ProgressTracker */
export interface ProgressTrackerOptions {
  storageKey?: string;
}

/** Default localStorage key */
const DEFAULT_STORAGE_KEY = "gsd-knowledge-progress";

/**
 * Tracks per-pack progress state with localStorage persistence.
 *
 * Internal storage is a Map<string, PackProgress> keyed by packId.
 * All mutating methods return the updated PackProgress for convenience.
 */
export class ProgressTracker {
  private readonly storageKey: string;
  private progress: Map<string, PackProgress>;

  constructor(options: ProgressTrackerOptions = {}) {
    this.storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
    this.progress = this.load();
  }

  /** Returns progress for a pack, or default "not-started" if not tracked */
  getProgress(packId: string): PackProgress {
    return this.progress.get(packId) ?? this.defaultProgress(packId);
  }

  /** Returns all tracked progress entries */
  getAllProgress(): PackProgress[] {
    return Array.from(this.progress.values());
  }

  /** Sets state to "in-progress", sets startedAt to ISO now, persists */
  startPack(packId: string): PackProgress {
    const existing = this.getProgress(packId);
    const updated: PackProgress = {
      ...existing,
      state: "in-progress",
      startedAt: existing.startedAt ?? new Date().toISOString(),
    };
    this.progress.set(packId, updated);
    this.persist();
    return updated;
  }

  /** Sets state to "completed", sets completedAt to ISO now, persists */
  completePack(packId: string): PackProgress {
    const existing = this.getProgress(packId);
    const updated: PackProgress = {
      ...existing,
      state: "completed",
      completedAt: new Date().toISOString(),
    };
    this.progress.set(packId, updated);
    this.persist();
    return updated;
  }

  /** Resets to "not-started", clears dates, persists */
  resetPack(packId: string): PackProgress {
    const existing = this.getProgress(packId);
    const updated: PackProgress = {
      ...existing,
      state: "not-started",
      startedAt: null,
      completedAt: null,
    };
    this.progress.set(packId, updated);
    this.persist();
    return updated;
  }

  /** Toggles favorited flag, persists */
  toggleFavorite(packId: string): PackProgress {
    const existing = this.getProgress(packId);
    const updated: PackProgress = {
      ...existing,
      favorited: !existing.favorited,
    };
    this.progress.set(packId, updated);
    this.persist();
    return updated;
  }

  /** Returns all favorited packs */
  getFavorites(): PackProgress[] {
    return Array.from(this.progress.values()).filter((p) => p.favorited);
  }

  /** Count of completed packs */
  getCompletedCount(): number {
    return Array.from(this.progress.values()).filter((p) => p.state === "completed").length;
  }

  /** Count of in-progress packs */
  getInProgressCount(): number {
    return Array.from(this.progress.values()).filter((p) => p.state === "in-progress").length;
  }

  /** Cleans up resources (no-op for now, exists for API symmetry with AminetPanel) */
  destroy(): void {
    this.progress.clear();
  }

  // --------------------------------------------------------------------------
  // Private helpers
  // --------------------------------------------------------------------------

  /** Writes entire Map to localStorage as JSON array of [key, value] pairs */
  private persist(): void {
    try {
      const entries = Array.from(this.progress.entries());
      localStorage.setItem(this.storageKey, JSON.stringify(entries));
    } catch {
      // Quota exceeded or other storage error -- silently fail
    }
  }

  /** Reads from localStorage, returns empty Map if missing/corrupt */
  private load(): Map<string, PackProgress> {
    try {
      const raw = localStorage.getItem(this.storageKey);
      if (!raw) return new Map();
      const entries = JSON.parse(raw) as Array<[string, PackProgress]>;
      if (!Array.isArray(entries)) return new Map();
      return new Map(entries);
    } catch {
      // Corrupt data -- start fresh
      return new Map();
    }
  }

  /** Creates a default not-started PackProgress */
  private defaultProgress(packId: string): PackProgress {
    return {
      packId,
      state: "not-started",
      startedAt: null,
      completedAt: null,
      favorited: false,
    };
  }
}

export type { PackProgress, ProgressState };
