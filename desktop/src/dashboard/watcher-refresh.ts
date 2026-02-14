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
  constructor(_options: WatcherRefreshOptions) {
    throw new Error("not implemented");
  }
  async start(): Promise<void> {
    throw new Error("not implemented");
  }
  stop(): void {
    throw new Error("not implemented");
  }
  get isActive(): boolean {
    throw new Error("not implemented");
  }
  /**
   * Determine which page is affected by a file path.
   * Returns undefined if no page affected.
   */
  static fileToPage(
    _filePath: string,
  ): DashboardPage | "all" | undefined {
    throw new Error("not implemented");
  }
}
