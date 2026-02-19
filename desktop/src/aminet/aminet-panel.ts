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

/** Aminet browser panel -- stub (not yet implemented). */
export class AminetPanel {
  constructor(_opts: AminetPanelOptions) {
    // stub
  }

  setCategories(_categories: AminetCategoryView[]): void {
    // stub
  }

  setResults(_results: AminetPackageView[]): void {
    // stub
  }

  setDetail(_detail: AminetDetailView): void {
    // stub
  }

  destroy(): void {
    // stub
  }
}
