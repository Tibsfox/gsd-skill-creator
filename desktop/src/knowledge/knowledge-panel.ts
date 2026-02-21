/**
 * Knowledge Pack browser panel with tier grouping and card grid.
 *
 * Renders all knowledge packs grouped by 3 tiers (Core Academic,
 * Applied & Practical, Specialized & Deepening) with collapsible
 * sections. Core Academic expands by default. Packs sort by
 * prerequisite chain order within tiers. Integrates PackSearch
 * for real-time filtering.
 *
 * Follows AminetPanel pattern: class-based, CSS-in-JS, event
 * callbacks, destroy method, DOM manipulation.
 *
 * @module knowledge/knowledge-panel
 */

import type { PackCardView, TierGroup, SearchScope, SearchResult } from "./types";
import { TIER_LABELS, TIER_ORDER } from "./types";
import { PackSearch } from "./pack-search";

/** Options for constructing a KnowledgePanel */
export interface KnowledgePanelOptions {
  container: HTMLElement;
  topologicalOrder: string[]; // prerequisite chain order for sorting
  onPackSelect?: (packId: string) => void;
  onSearch?: (query: string) => void;
}

/** Scoped CSS for the knowledge panel */
const PANEL_CSS = `
.knowledge-panel { display: flex; flex-direction: column; height: 100%; overflow: hidden; font-family: system-ui, sans-serif; background: var(--kp-bg, #1a1a2e); color: var(--kp-fg, #e0e0e0); }
.knowledge-search { padding: 8px 12px; border-bottom: 1px solid var(--kp-border, #333); display: flex; gap: 8px; }
.knowledge-search input { flex: 1; padding: 6px 10px; background: var(--kp-input-bg, #16213e); color: var(--kp-fg, #e0e0e0); border: 1px solid var(--kp-border, #333); border-radius: 4px; }
.knowledge-tiers { flex: 1; overflow-y: auto; padding: 8px 12px; }
.knowledge-tier-header { cursor: pointer; padding: 8px 0; font-weight: bold; font-size: 14px; border-bottom: 1px solid var(--kp-border, #333); user-select: none; }
.knowledge-tier-header::before { content: ""; display: inline-block; width: 0; height: 0; border-left: 6px solid currentColor; border-top: 4px solid transparent; border-bottom: 4px solid transparent; margin-right: 8px; transition: transform 0.2s; }
.knowledge-tier-header--expanded::before { transform: rotate(90deg); }
.knowledge-card-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; padding: 10px 0; }
.knowledge-pack-card { background: var(--kp-card-bg, #16213e); border: 1px solid var(--kp-border, #333); border-radius: 6px; padding: 12px; cursor: pointer; transition: border-color 0.15s; }
.knowledge-pack-card:hover { border-color: var(--kp-accent, #e94560); }
.knowledge-pack-card--prereqs-unmet { opacity: 0.75; }
.knowledge-pack-card__name { font-weight: bold; font-size: 14px; margin-bottom: 4px; }
.knowledge-pack-card__desc { font-size: 12px; color: var(--kp-muted, #888); margin-bottom: 8px; }
.knowledge-pack-card__meta { font-size: 11px; color: var(--kp-muted, #888); display: flex; gap: 8px; flex-wrap: wrap; }
.knowledge-pack-card__prereq--unmet { color: var(--kp-muted, #666); }
.knowledge-pack-card__progress { display: inline-block; width: 8px; height: 8px; border-radius: 50%; }
.knowledge-pack-card__progress--not-started { background: #555; }
.knowledge-pack-card__progress--in-progress { background: #f0a500; }
.knowledge-pack-card__progress--completed { background: #00c853; }
.knowledge-scope-toggle { padding: 4px 10px; background: var(--kp-input-bg, #16213e); color: var(--kp-fg, #e0e0e0); border: 1px solid var(--kp-border, #333); border-radius: 4px; cursor: pointer; font-size: 12px; white-space: nowrap; }
.knowledge-empty { padding: 20px; text-align: center; color: var(--kp-muted, #888); font-style: italic; }
`;

/**
 * Knowledge pack browser panel with tier grouping.
 *
 * Receives all data via constructor parameters and method calls.
 * Never imports from src/knowledge/ (desktop/src boundary rule).
 */
export class KnowledgePanel {
  private readonly root: HTMLDivElement;
  private readonly styleEl: HTMLStyleElement;
  private readonly searchInput: HTMLInputElement;
  private readonly scopeButton: HTMLButtonElement;
  private readonly tiersContainer: HTMLDivElement;
  private readonly container: HTMLElement;
  private readonly opts: KnowledgePanelOptions;

  private packs: PackCardView[] = [];
  private tierGroups: TierGroup[] = [];
  private search: PackSearch;
  private searchScope: SearchScope = "all";
  private searchDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private currentQuery = "";

  /** Event listeners tracked for cleanup */
  private readonly cleanupFns: Array<() => void> = [];
  private destroyed = false;

  constructor(opts: KnowledgePanelOptions) {
    this.opts = opts;
    this.container = opts.container;

    // Initialize search engine (empty until setPacks called)
    this.search = new PackSearch({
      packs: [],
      topologicalOrder: opts.topologicalOrder,
    });

    // Root element
    this.root = document.createElement("div");
    this.root.className = "knowledge-panel";

    // Inject scoped CSS
    this.styleEl = document.createElement("style");
    this.styleEl.textContent = PANEL_CSS;
    this.root.appendChild(this.styleEl);

    // Search bar
    const searchBar = document.createElement("div");
    searchBar.className = "knowledge-search";

    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Search packs...";
    searchBar.appendChild(this.searchInput);

    // Scope toggle button
    this.scopeButton = document.createElement("button");
    this.scopeButton.className = "knowledge-scope-toggle";
    this.scopeButton.textContent = "All";
    searchBar.appendChild(this.scopeButton);

    this.root.appendChild(searchBar);

    // Tiers container
    this.tiersContainer = document.createElement("div");
    this.tiersContainer.className = "knowledge-tiers";
    this.root.appendChild(this.tiersContainer);

    // Wire search input (debounced 150ms)
    const inputHandler = (): void => {
      if (this.searchDebounceTimer !== null) {
        clearTimeout(this.searchDebounceTimer);
      }
      this.searchDebounceTimer = setTimeout(() => {
        this.currentQuery = this.searchInput.value.trim();
        if (this.currentQuery.length === 0) {
          this.clearSearch();
        } else {
          const results = this.search.search(
            this.currentQuery,
            this.searchScope,
            this.getActiveTier(),
          );
          this.renderSearchResults(results);
          this.opts.onSearch?.(this.currentQuery);
        }
      }, 150);
    };
    this.searchInput.addEventListener("input", inputHandler);
    this.cleanupFns.push(() =>
      this.searchInput.removeEventListener("input", inputHandler),
    );

    // Wire scope toggle
    const scopeHandler = (): void => {
      if (this.searchScope === "all") {
        this.setSearchScope("tier");
      } else {
        this.setSearchScope("all");
      }
    };
    this.scopeButton.addEventListener("click", scopeHandler);
    this.cleanupFns.push(() =>
      this.scopeButton.removeEventListener("click", scopeHandler),
    );

    // Mount into container
    opts.container.appendChild(this.root);
  }

  /** Sets pack data, rebuilds tier groupings, and renders */
  setPacks(packs: PackCardView[]): void {
    this.packs = packs;
    this.search.updatePacks(packs);
    this.buildTierGroups();
    this.renderTiers();
  }

  /** Updates search scope, re-runs search if query active */
  setSearchScope(scope: SearchScope): void {
    this.searchScope = scope;
    this.scopeButton.textContent = scope === "all" ? "All" : "Current Tier";
    if (this.currentQuery.length > 0) {
      const results = this.search.search(
        this.currentQuery,
        this.searchScope,
        this.getActiveTier(),
      );
      this.renderSearchResults(results);
    }
  }

  /** Returns current search scope */
  getSearchScope(): SearchScope {
    return this.searchScope;
  }

  /** Remove all DOM and clean up listeners */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    if (this.searchDebounceTimer !== null) {
      clearTimeout(this.searchDebounceTimer);
    }

    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns.length = 0;

    this.root.remove();
  }

  // --------------------------------------------------------------------------
  // Private rendering
  // --------------------------------------------------------------------------

  /** Build tier groups from packs, sorted by topological order */
  private buildTierGroups(): void {
    const grouped = new Map<string, PackCardView[]>();
    for (const tier of TIER_ORDER) {
      grouped.set(tier, []);
    }

    for (const pack of this.packs) {
      const list = grouped.get(pack.classification);
      if (list) {
        list.push(pack);
      }
    }

    // Sort packs within each tier by topological order
    const topoOrder = this.opts.topologicalOrder;
    const getPos = (packId: string): number => {
      const idx = topoOrder.indexOf(packId);
      return idx === -1 ? Infinity : idx;
    };

    this.tierGroups = TIER_ORDER.map((tier) => {
      const packs = grouped.get(tier) ?? [];
      packs.sort((a, b) => getPos(a.packId) - getPos(b.packId));
      return {
        tier,
        label: TIER_LABELS[tier] ?? tier,
        packs,
        expanded: tier === "core_academic", // Core Academic expanded by default
      };
    });
  }

  /** Renders collapsible tier sections with card grids */
  private renderTiers(): void {
    this.tiersContainer.innerHTML = "";

    if (this.packs.length === 0) {
      const empty = document.createElement("div");
      empty.className = "knowledge-empty";
      empty.textContent = "No knowledge packs available";
      this.tiersContainer.appendChild(empty);
      return;
    }

    for (const group of this.tierGroups) {
      const section = document.createElement("div");
      section.className = "knowledge-tier-section";
      section.setAttribute("data-tier", group.tier);

      // Header
      const header = document.createElement("div");
      header.className = "knowledge-tier-header";
      if (group.expanded) {
        header.classList.add("knowledge-tier-header--expanded");
      }
      header.textContent = `${group.label} (${group.packs.length})`;

      // Card grid
      const grid = document.createElement("div");
      grid.className = "knowledge-card-grid";
      if (!group.expanded) {
        grid.style.display = "none";
      }
      for (const pack of group.packs) {
        grid.appendChild(this.renderPackCard(pack));
      }

      // Toggle handler
      const toggleHandler = (): void => {
        group.expanded = !group.expanded;
        header.classList.toggle("knowledge-tier-header--expanded");
        grid.style.display = group.expanded ? "" : "none";
      };
      header.addEventListener("click", toggleHandler);
      this.cleanupFns.push(() =>
        header.removeEventListener("click", toggleHandler),
      );

      section.appendChild(header);
      section.appendChild(grid);
      this.tiersContainer.appendChild(section);
    }
  }

  /** Renders a single pack card with all metadata */
  private renderPackCard(pack: PackCardView): HTMLElement {
    const card = document.createElement("div");
    card.className = "knowledge-pack-card";
    if (!pack.prerequisitesMet) {
      card.classList.add("knowledge-pack-card--prereqs-unmet");
    }

    // Icon + color accent
    const iconSpan = document.createElement("span");
    iconSpan.textContent = pack.icon;
    iconSpan.style.marginRight = "6px";
    if (pack.color) {
      card.style.borderLeftColor = pack.color;
      card.style.borderLeftWidth = "3px";
    }

    // Name
    const name = document.createElement("div");
    name.className = "knowledge-pack-card__name";
    name.appendChild(iconSpan);
    name.appendChild(document.createTextNode(pack.packName));
    card.appendChild(name);

    // Description (truncated to ~100 chars)
    const desc = document.createElement("div");
    desc.className = "knowledge-pack-card__desc";
    desc.textContent =
      pack.description.length > 100
        ? pack.description.slice(0, 97) + "..."
        : pack.description;
    card.appendChild(desc);

    // Meta row
    const meta = document.createElement("div");
    meta.className = "knowledge-pack-card__meta";

    // Module count
    const modules = document.createElement("span");
    modules.textContent = `${pack.moduleCount} modules`;
    meta.appendChild(modules);

    // Prerequisite count
    const prereqs = document.createElement("span");
    prereqs.textContent =
      pack.prerequisiteCount > 0
        ? `Requires: ${pack.prerequisiteCount} packs`
        : "No prerequisites";
    if (!pack.prerequisitesMet && pack.prerequisiteCount > 0) {
      prereqs.className = "knowledge-pack-card__prereq--unmet";
    }
    meta.appendChild(prereqs);

    // Grade range
    const grades = document.createElement("span");
    grades.textContent = pack.gradeRange;
    meta.appendChild(grades);

    // Progress dot
    const progress = document.createElement("span");
    progress.className = `knowledge-pack-card__progress knowledge-pack-card__progress--${pack.progress}`;
    meta.appendChild(progress);

    card.appendChild(meta);

    // Click handler
    const clickHandler = (): void => {
      this.opts.onPackSelect?.(pack.packId);
    };
    card.addEventListener("click", clickHandler);
    this.cleanupFns.push(() => card.removeEventListener("click", clickHandler));

    return card;
  }

  /** Replaces tier view with flat search results */
  private renderSearchResults(results: SearchResult[]): void {
    this.tiersContainer.innerHTML = "";

    if (results.length === 0) {
      const empty = document.createElement("div");
      empty.className = "knowledge-empty";
      empty.textContent = "No packs match your search";
      this.tiersContainer.appendChild(empty);
      return;
    }

    const grid = document.createElement("div");
    grid.className = "knowledge-card-grid";
    for (const result of results) {
      grid.appendChild(this.renderPackCard(result.pack));
    }
    this.tiersContainer.appendChild(grid);
  }

  /** Restores tier view (called when search cleared) */
  private clearSearch(): void {
    this.currentQuery = "";
    this.renderTiers();
  }

  /** Returns the first expanded tier classification, or undefined */
  private getActiveTier(): string | undefined {
    const expanded = this.tierGroups.find((g) => g.expanded);
    return expanded?.tier;
  }
}
