/**
 * Dashboard host: renders generator HTML inside a GSD-OS window with
 * instant page navigation and caching.
 *
 * @module dashboard/dashboard-host
 */

import type { DashboardPage } from "./types";

/** Options for constructing a DashboardHost. */
export interface DashboardHostOptions {
  container: HTMLElement;
  planningDir: string;
  onPageChange?: (page: DashboardPage) => void;
  onError?: (error: string) => void;
  onLoading?: (loading: boolean) => void;
}

/**
 * Renders dashboard HTML inside a container element, provides a navigation
 * bar for switching between 6 pages, and caches previously loaded pages
 * for instant switching.
 */
export class DashboardHost {
  constructor(_options: DashboardHostOptions) { throw new Error("not implemented"); }
  get currentPage(): DashboardPage { throw new Error("not implemented"); }
  async loadPage(_page: DashboardPage): Promise<void> { throw new Error("not implemented"); }
  setHtml(_page: DashboardPage, _html: string): void { throw new Error("not implemented"); }
  invalidateCache(_page?: DashboardPage): void { throw new Error("not implemented"); }
  destroy(): void { throw new Error("not implemented"); }
}
