/**
 * Watcher-driven dashboard refresh.
 *
 * Connects native file watcher events (Phase 159) to the DashboardHost,
 * mapping file paths to dashboard pages and debouncing rapid changes
 * to avoid excessive re-renders.
 */

import { onFileChanged } from "../ipc/watcher";
import type { WatcherEventBatch } from "../ipc/watcher";
import type { DashboardPage } from "./types";

export interface WatcherRefreshOptions {
  /** Function to invalidate page cache */
  invalidateCache: (page?: DashboardPage) => void;
  /** Function to reload the current page */
  reloadCurrentPage: () => Promise<void>;
  /** Debounce interval in ms (default: 300) */
  debounceMs?: number;
  /** Callback when refresh is triggered */
  onRefresh?: () => void;
}

export class WatcherRefresh {
  private readonly _options: WatcherRefreshOptions;
  private readonly _debounceMs: number;
  private _active = false;
  private _unlisten: (() => void) | null = null;
  private _debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private _pendingPages: Set<DashboardPage | "all"> = new Set();

  constructor(options: WatcherRefreshOptions) {
    this._options = options;
    this._debounceMs = options.debounceMs ?? 300;
  }

  async start(): Promise<void> {
    this._unlisten = await onFileChanged((batch: WatcherEventBatch) => {
      this._handleBatch(batch);
    });
    this._active = true;
  }

  stop(): void {
    if (this._unlisten) {
      this._unlisten();
      this._unlisten = null;
    }
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
      this._debounceTimer = null;
    }
    this._pendingPages.clear();
    this._active = false;
  }

  get isActive(): boolean {
    return this._active;
  }

  /**
   * Determine which dashboard page is affected by a file path.
   * Returns undefined if the file is not a recognized planning artifact.
   */
  static fileToPage(
    filePath: string,
  ): DashboardPage | "all" | undefined {
    const lower = filePath.toLowerCase();

    // Config affects all pages
    if (lower === "config.json" || lower === "skill-creator.json")
      return "all";

    // Direct markdown files
    if (lower === "state.md") return "state";
    if (lower === "roadmap.md") return "roadmap";
    if (lower === "requirements.md") return "requirements";
    if (lower === "project.md") return "index";
    if (lower === "milestones.md") return "milestones";

    // Phase directories affect roadmap
    if (lower.startsWith("phases/")) return "roadmap";

    // Milestone archives
    if (lower.startsWith("milestones/")) return "milestones";

    // Console data
    if (lower.startsWith("console/")) return "console";

    // Patterns directory (may affect metrics on index)
    if (lower.startsWith("patterns/")) return "index";

    return undefined;
  }

  /** Handle an incoming batch of file change events. */
  private _handleBatch(batch: WatcherEventBatch): void {
    for (const event of batch.events) {
      const page = WatcherRefresh.fileToPage(event.path);
      if (page !== undefined) {
        this._pendingPages.add(page);
      }
    }

    // Reset debounce timer
    if (this._debounceTimer !== null) {
      clearTimeout(this._debounceTimer);
    }

    this._debounceTimer = setTimeout(() => {
      this._flush();
    }, this._debounceMs);
  }

  /** Flush accumulated pages: invalidate caches and reload. */
  private _flush(): void {
    const pages = this._pendingPages;
    this._pendingPages = new Set();
    this._debounceTimer = null;

    if (pages.size === 0) return;

    if (pages.has("all") || pages.size > 2) {
      // Invalidate all pages
      this._options.invalidateCache();
    } else {
      // Invalidate specific pages
      for (const page of pages) {
        this._options.invalidateCache(page as DashboardPage);
      }
    }

    this._options.reloadCurrentPage();

    if (this._options.onRefresh) {
      this._options.onRefresh();
    }
  }
}
