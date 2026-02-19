/**
 * Aminet browser panel: four-pane Workbench-style browser for GSD-OS.
 *
 * Renders search bar (top), category tree (left), results list (center),
 * and detail pane (right) with Amiga Workbench 3.x aesthetic.
 *
 * @module aminet/aminet-panel
 */

/** Options for constructing an AminetPanel. */
export interface AminetPanelOptions {
  container: HTMLElement;
  onSearch?: (query: string) => void;
  onCategorySelect?: (category: string) => void;
  onResultSelect?: (filename: string) => void;
}

/** Simplified package data for display (no src/aminet/ imports). */
export interface AminetPackageView {
  filename: string;
  category: string;
  sizeKb: number;
  description: string;
  status: "clean" | "suspicious" | "infected" | "not-mirrored" | "unscanned";
}

/** Simplified category for display. */
export interface AminetCategoryView {
  path: string;
  name: string;
  count: number;
  children?: AminetCategoryView[];
}

/** Simplified package detail for display. */
export interface AminetDetailView {
  filename: string;
  category: string;
  description: string;
  author?: string;
  version?: string;
  architecture?: string;
  requires?: string;
  status: string;
  scanResult?: string;
  installedAt?: string;
}

/** Workbench CSS injected into the panel root. */
const WORKBENCH_CSS = `
.aminet-panel {
  font-family: "Topaz", "Amiga Topaz", monospace;
  background: #0055aa;
  color: #ffffff;
  display: grid;
  grid-template-rows: auto 1fr;
  grid-template-columns: 200px 1fr 300px;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
.aminet-search {
  grid-column: 1 / -1;
  padding: 4px;
  border-bottom: 2px solid #ffffff;
  background: #0055aa;
}
.aminet-search input {
  width: 100%;
  box-sizing: border-box;
  padding: 4px 6px;
  background: #ffffff;
  color: #000000;
  font-family: inherit;
  border: 2px solid #ffffff;
  outline: none;
}
.aminet-categories {
  border-right: 2px solid #ffffff;
  overflow-y: auto;
  padding: 4px;
}
.aminet-results {
  overflow-y: auto;
  padding: 4px;
}
.aminet-detail {
  border-left: 2px solid #ffffff;
  overflow-y: auto;
  padding: 4px;
}
.aminet-result-row {
  cursor: pointer;
  padding: 2px 4px;
}
.aminet-result-row:hover {
  background: #ff8800;
}
.aminet-category-item {
  cursor: pointer;
  padding: 2px 4px;
}
.aminet-category-item:hover {
  color: #ff8800;
}
.aminet-detail-row {
  padding: 2px 0;
}
.aminet-detail-label {
  font-weight: bold;
  color: #ff8800;
}
.aminet-empty {
  padding: 8px;
  opacity: 0.7;
  font-style: italic;
}
`;

/**
 * Aminet browser panel with four-pane Workbench-style layout.
 *
 * Receives all data as constructor parameters and method calls --
 * never imports from src/aminet/ (desktop/src boundary rule).
 */
export class AminetPanel {
  private readonly root: HTMLDivElement;
  private readonly styleEl: HTMLStyleElement;
  private readonly searchInput: HTMLInputElement;
  private readonly categoriesPane: HTMLDivElement;
  private readonly resultsPane: HTMLDivElement;
  private readonly detailPane: HTMLDivElement;
  private readonly container: HTMLElement;

  private readonly opts: AminetPanelOptions;

  /** Event listeners tracked for cleanup. */
  private readonly cleanupFns: Array<() => void> = [];
  private destroyed = false;

  constructor(opts: AminetPanelOptions) {
    this.opts = opts;
    this.container = opts.container;

    // Root element
    this.root = document.createElement("div");
    this.root.className = "aminet-panel";
    this.root.setAttribute("data-theme", "workbench");

    // Inject Workbench styles
    this.styleEl = document.createElement("style");
    this.styleEl.textContent = WORKBENCH_CSS;
    this.root.appendChild(this.styleEl);

    // Search bar
    const searchBar = document.createElement("div");
    searchBar.className = "aminet-search";
    this.searchInput = document.createElement("input");
    this.searchInput.type = "text";
    this.searchInput.placeholder = "Search Aminet...";
    searchBar.appendChild(this.searchInput);
    this.root.appendChild(searchBar);

    // Wire search Enter key
    const searchHandler = (e: KeyboardEvent): void => {
      if (e.key === "Enter" && opts.onSearch) {
        opts.onSearch(this.searchInput.value.trim());
      }
    };
    this.searchInput.addEventListener("keydown", searchHandler);
    this.cleanupFns.push(() =>
      this.searchInput.removeEventListener("keydown", searchHandler),
    );

    // Category tree pane
    this.categoriesPane = document.createElement("div");
    this.categoriesPane.className = "aminet-categories";
    this.root.appendChild(this.categoriesPane);

    // Results list pane
    this.resultsPane = document.createElement("div");
    this.resultsPane.className = "aminet-results";
    this.root.appendChild(this.resultsPane);

    // Detail pane
    this.detailPane = document.createElement("div");
    this.detailPane.className = "aminet-detail";
    this.root.appendChild(this.detailPane);

    // Mount into container
    opts.container.appendChild(this.root);
  }

  /** Populate the category tree with clickable items. */
  setCategories(categories: AminetCategoryView[]): void {
    this.categoriesPane.innerHTML = "";
    this.renderCategoryLevel(categories, 0);
  }

  /** Populate the results list with package entries. */
  setResults(results: AminetPackageView[]): void {
    this.resultsPane.innerHTML = "";

    if (results.length === 0) {
      const empty = document.createElement("div");
      empty.className = "aminet-empty";
      empty.textContent = "No packages found";
      this.resultsPane.appendChild(empty);
      return;
    }

    for (const pkg of results) {
      const row = document.createElement("div");
      row.className = "aminet-result-row";
      row.textContent = `${pkg.filename}  ${pkg.sizeKb}K  ${pkg.description}`;

      const handler = (): void => {
        this.opts.onResultSelect?.(pkg.filename);
      };
      row.addEventListener("click", handler);
      this.cleanupFns.push(() => row.removeEventListener("click", handler));

      this.resultsPane.appendChild(row);
    }
  }

  /** Populate the detail pane with package metadata. */
  setDetail(detail: AminetDetailView): void {
    this.detailPane.innerHTML = "";

    const fields: Array<[string, string | undefined]> = [
      ["Filename", detail.filename],
      ["Category", detail.category],
      ["Description", detail.description],
      ["Author", detail.author],
      ["Version", detail.version],
      ["Architecture", detail.architecture],
      ["Requires", detail.requires],
      ["Status", detail.status],
      ["Scan Result", detail.scanResult],
      ["Installed At", detail.installedAt],
    ];

    for (const [label, value] of fields) {
      if (value === undefined) continue;
      const row = document.createElement("div");
      row.className = "aminet-detail-row";
      row.innerHTML = `<span class="aminet-detail-label">${label}:</span> ${value}`;
      this.detailPane.appendChild(row);
    }
  }

  /** Remove all DOM elements and clean up event listeners. */
  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;

    // Remove all tracked event listeners
    for (const cleanup of this.cleanupFns) {
      cleanup();
    }
    this.cleanupFns.length = 0;

    // Remove root from container
    this.root.remove();
  }

  // -- Private helpers --

  /** Recursively render category items with indentation. */
  private renderCategoryLevel(
    categories: AminetCategoryView[],
    depth: number,
  ): void {
    for (const cat of categories) {
      const item = document.createElement("div");
      item.className = "aminet-category-item";
      item.style.paddingLeft = `${depth * 12 + 4}px`;
      item.textContent = `${cat.name} (${cat.count})`;

      const handler = (): void => {
        this.opts.onCategorySelect?.(cat.path);
      };
      item.addEventListener("click", handler);
      this.cleanupFns.push(() => item.removeEventListener("click", handler));

      this.categoriesPane.appendChild(item);

      if (cat.children && cat.children.length > 0) {
        this.renderCategoryLevel(cat.children, depth + 1);
      }
    }
  }
}
