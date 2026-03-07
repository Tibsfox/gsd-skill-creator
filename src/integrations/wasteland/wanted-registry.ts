/**
 * wanted-registry.ts — R5.2: WantedRegistry bridging Dolt to pack-style search.
 *
 * Provides a PackRegistry-compatible interface over wasteland wanted items,
 * enabling the learn pipeline and session drivers to discover available work
 * through the same search patterns used for educational packs.
 *
 * @module wanted-registry
 */

/**
 * A wanted item in registry-friendly format.
 */
export interface WantedEntry {
  id: string;
  title: string;
  status: string;
  effortLevel: string;
  tags: string[];
  postedBy: string;
  claimedBy?: string;
}

/**
 * Search criteria for wanted items.
 */
export interface WantedSearchCriteria {
  status?: string;
  effortLevel?: string;
  tag?: string;
  text?: string;
}

/**
 * Data provider interface — abstracts the actual Dolt query.
 * Implementations can use DoltClient, mock data, or static JSON.
 */
export interface WantedDataProvider {
  queryWanted(criteria: WantedSearchCriteria): Promise<WantedEntry[]>;
}

/**
 * WantedRegistry — discover wasteland work items through pack-style search.
 *
 * Mirrors the PackRegistry interface pattern:
 * - search(criteria) → filtered list of entries
 * - getById(id) → single entry
 * - getCategories() → available effort levels and tags
 *
 * The registry is read-only — it discovers, not modifies.
 */
export class WantedRegistry {
  private provider: WantedDataProvider;
  private cache: WantedEntry[] | null = null;
  private cacheAge: number = 0;
  private cacheTtlMs: number;

  constructor(provider: WantedDataProvider, cacheTtlMs: number = 60_000) {
    this.provider = provider;
    this.cacheTtlMs = cacheTtlMs;
  }

  /**
   * Search for wanted items matching the criteria.
   * Results are cached for cacheTtlMs to avoid redundant queries.
   */
  async search(criteria: WantedSearchCriteria = {}): Promise<WantedEntry[]> {
    const entries = await this.getAll(criteria);
    return this.filter(entries, criteria);
  }

  /**
   * Get a single wanted item by ID.
   */
  async getById(id: string): Promise<WantedEntry | undefined> {
    const entries = await this.getAll({});
    return entries.find(e => e.id === id);
  }

  /**
   * Get available categories (effort levels and tags) from current data.
   */
  async getCategories(): Promise<{ effortLevels: string[]; tags: string[] }> {
    const entries = await this.getAll({});
    const effortLevels = [...new Set(entries.map(e => e.effortLevel).filter(Boolean))];
    const tags = [...new Set(entries.flatMap(e => e.tags))];
    return { effortLevels, tags };
  }

  /**
   * Invalidate the cache, forcing a fresh query on next access.
   */
  invalidateCache(): void {
    this.cache = null;
    this.cacheAge = 0;
  }

  private async getAll(criteria: WantedSearchCriteria): Promise<WantedEntry[]> {
    const now = Date.now();
    if (this.cache && (now - this.cacheAge) < this.cacheTtlMs) {
      return this.cache;
    }

    this.cache = await this.provider.queryWanted(criteria);
    this.cacheAge = now;
    return this.cache;
  }

  private filter(entries: WantedEntry[], criteria: WantedSearchCriteria): WantedEntry[] {
    let result = entries;

    if (criteria.status) {
      result = result.filter(e => e.status === criteria.status);
    }
    if (criteria.effortLevel) {
      result = result.filter(e => e.effortLevel === criteria.effortLevel);
    }
    if (criteria.tag) {
      result = result.filter(e => e.tags.includes(criteria.tag!));
    }
    if (criteria.text) {
      const lower = criteria.text.toLowerCase();
      result = result.filter(e => e.title.toLowerCase().includes(lower));
    }

    return result;
  }
}
