/**
 * Dashboard host: renders generator HTML inside a GSD-OS window with
 * instant page navigation and caching.
 *
 * @module dashboard/dashboard-host
 */

import { DASHBOARD_PAGES } from "./types";
import { generateDashboard } from "./ipc";
import type { DashboardPage } from "./types";

/** Human-readable labels for each dashboard page. */
const PAGE_LABELS: Record<DashboardPage, string> = {
  index: "Dashboard",
  requirements: "Requirements",
  roadmap: "Roadmap",
  milestones: "Milestones",
  state: "State",
  console: "Console",
};

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
  private readonly opts: DashboardHostOptions;
  private readonly nav: HTMLElement;
  private readonly content: HTMLDivElement;
  private readonly cache = new Map<DashboardPage, string>();
  private readonly linkClickHandlers = new Map<HTMLAnchorElement, (e: Event) => void>();
  private activePage: DashboardPage = "index";

  constructor(options: DashboardHostOptions) {
    this.opts = options;

    // Build navigation bar
    this.nav = document.createElement("nav");
    this.nav.className = "dash-host-nav";

    for (const page of DASHBOARD_PAGES) {
      const link = document.createElement("a");
      link.href = "#";
      link.className = "dash-host-nav__link";
      link.dataset.page = page;
      link.textContent = PAGE_LABELS[page];

      if (page === "index") {
        link.dataset.active = "true";
      }

      const handler = (e: Event): void => {
        e.preventDefault();
        void this.loadPage(page);
      };
      link.addEventListener("click", handler);
      this.linkClickHandlers.set(link, handler);

      this.nav.appendChild(link);
    }

    // Build content area
    this.content = document.createElement("div");
    this.content.className = "dash-host-content";

    // Mount into container
    options.container.appendChild(this.nav);
    options.container.appendChild(this.content);
  }

  /** Returns the currently active page name. */
  get currentPage(): DashboardPage {
    return this.activePage;
  }

  /**
   * Load a dashboard page. Uses cache if available, otherwise fetches
   * via IPC and caches the result.
   */
  async loadPage(page: DashboardPage): Promise<void> {
    // Use cached content if available
    const cached = this.cache.get(page);
    if (cached !== undefined) {
      this.renderContent(page, cached);
      return;
    }

    // Fetch via IPC
    this.opts.onLoading?.(true);
    try {
      const response = await generateDashboard(page, this.opts.planningDir);
      if (response.error) {
        this.opts.onError?.(response.error);
        return;
      }
      this.setHtml(page, response.html);
    } finally {
      this.opts.onLoading?.(false);
    }
  }

  /**
   * Set HTML content for a page. Sanitizes the HTML (strips scripts and
   * external stylesheets), caches the result, and renders it.
   */
  setHtml(page: DashboardPage, html: string): void {
    const sanitized = this.sanitize(html);
    this.cache.set(page, sanitized);
    this.renderContent(page, sanitized);
  }

  /**
   * Invalidate cached pages. If a page is specified, only that page is
   * cleared. With no arguments, all cached pages are cleared.
   */
  invalidateCache(page?: DashboardPage): void {
    if (page !== undefined) {
      this.cache.delete(page);
    } else {
      this.cache.clear();
    }
  }

  /** Remove all DOM elements and clean up event listeners. */
  destroy(): void {
    // Remove event listeners
    for (const [link, handler] of this.linkClickHandlers) {
      link.removeEventListener("click", handler);
    }
    this.linkClickHandlers.clear();

    // Remove DOM elements
    this.nav.remove();
    this.content.remove();

    // Clear cache
    this.cache.clear();
  }

  // -- Private helpers --

  /**
   * Sanitize HTML by stripping script tags and external stylesheet links.
   * Extracts <main> content if present, preserving embedded <style> blocks.
   */
  private sanitize(html: string): string {
    // Strip <script> tags
    let clean = html.replace(/<script[\s\S]*?<\/script>/gi, "");

    // Strip <link rel="stylesheet"> tags
    clean = clean.replace(/<link[^>]*rel=["']stylesheet["'][^>]*>/gi, "");

    // Extract embedded <style> content
    const styleMatches: string[] = [];
    clean = clean.replace(/<style[\s\S]*?<\/style>/gi, (match) => {
      styleMatches.push(match);
      return "";
    });

    // Extract <main> content if present (full-page HTML from generator)
    const mainMatch = clean.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
    if (mainMatch) {
      clean = mainMatch[1];
    }

    // Prepend styles back (scoped dashboard component styles)
    if (styleMatches.length > 0) {
      clean = styleMatches.join("") + clean;
    }

    return clean;
  }

  /** Render sanitized content into the content area and update nav state. */
  private renderContent(page: DashboardPage, html: string): void {
    const previousPage = this.activePage;
    this.activePage = page;
    this.content.innerHTML = html;

    // Update active nav link
    const links = this.nav.querySelectorAll("a");
    for (const link of links) {
      if (link.dataset.page === page) {
        link.dataset.active = "true";
      } else {
        delete link.dataset.active;
      }
    }

    // Fire callback if page actually changed
    if (page !== previousPage) {
      this.opts.onPageChange?.(page);
    }
  }
}
