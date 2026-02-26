/**
 * JSONL-backed citation database with indexing and deduplication.
 *
 * Provides full CRUD operations for CitedWork records stored as
 * append-only JSONL. Maintains field indexes for efficient lookups
 * by DOI, ISBN, title, author, and tag. Deduplicates on insert
 * using DOI, ISBN, and title similarity matching.
 *
 * Storage layout:
 *   works.jsonl      -- append-only CitedWork records
 *   works.index.json -- field indexes for O(1) lookups
 *   unresolved.jsonl -- RawCitation queue awaiting resolution
 *   version.json     -- schema version tracking
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

import type { CitedWork, RawCitation, ProvenanceEntry } from '../types/index.js';
import { CitedWorkSchema } from '../types/index.js';
import { getCurrentVersion, migrate } from './migrations.js';

// ============================================================================
// Types
// ============================================================================

/** Field indexes for efficient lookups. */
export interface WorkIndex {
  /** DOI -> work ID */
  doi: Record<string, string>;
  /** ISBN (normalized, no hyphens) -> work ID */
  isbn: Record<string, string>;
  /** Lowercased normalized title -> work ID */
  title_hash: Record<string, string>;
  /** Author family name (lowercase) -> work IDs */
  author_family: Record<string, string[]>;
  /** Tag -> work IDs */
  tag: Record<string, string[]>;
  /** Set of removed IDs */
  removed: string[];
}

/** Result of an import batch operation. */
export interface ImportResult {
  added: number;
  duplicates: number;
}

// ============================================================================
// Title normalization and similarity
// ============================================================================

/**
 * Normalize a title for ID generation and comparison.
 * Lowercase, strip leading articles, collapse whitespace, trim.
 */
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Compute Levenshtein distance between two strings.
 */
function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;

  // Optimize: use single row instead of full matrix
  const row = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) row[j] = j;

  for (let i = 1; i <= m; i++) {
    let prev = row[0];
    row[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const temp = row[j];
      row[j] = Math.min(
        row[j] + 1,       // deletion
        row[j - 1] + 1,   // insertion
        prev + cost,       // substitution
      );
      prev = temp;
    }
  }

  return row[n];
}

/**
 * Compute title similarity as a ratio (0-1).
 * 1.0 = identical, 0.0 = completely different.
 */
export function titleSimilarity(a: string, b: string): number {
  const na = normalizeTitle(a);
  const nb = normalizeTitle(b);
  if (na === nb) return 1.0;
  const maxLen = Math.max(na.length, nb.length);
  if (maxLen === 0) return 1.0;
  return 1 - levenshteinDistance(na, nb) / maxLen;
}

/**
 * Normalize ISBN by stripping hyphens and spaces.
 */
function normalizeIsbn(isbn: string): string {
  return isbn.replace(/[-\s]/g, '');
}

/**
 * Generate a deterministic citation ID from title, first author, and year.
 * SHA-256 of normalize(title) + authors[0].family.toLowerCase() + year.
 */
export function generateCitationId(
  title: string,
  firstAuthorFamily: string,
  year: number,
): string {
  const input = normalizeTitle(title) + firstAuthorFamily.toLowerCase() + year;
  return crypto.createHash('sha256').update(input).digest('hex');
}

// ============================================================================
// CitationStore
// ============================================================================

export class CitationStore {
  private readonly basePath: string;
  private readonly worksPath: string;
  private readonly indexPath: string;
  private readonly unresolvedPath: string;
  private readonly versionPath: string;

  private index: WorkIndex | null = null;

  constructor(basePath?: string) {
    this.basePath = basePath ?? path.join(process.cwd(), '.citations', 'db');
    this.worksPath = path.join(this.basePath, 'works.jsonl');
    this.indexPath = path.join(this.basePath, 'works.index.json');
    this.unresolvedPath = path.join(this.basePath, 'unresolved.jsonl');
    this.versionPath = path.join(this.basePath, 'version.json');
  }

  // --------------------------------------------------------------------------
  // Initialization
  // --------------------------------------------------------------------------

  /** Ensure storage directory and files exist. Run migrations if needed. */
  async init(): Promise<void> {
    fs.mkdirSync(this.basePath, { recursive: true });

    if (!fs.existsSync(this.worksPath)) {
      fs.writeFileSync(this.worksPath, '');
    }
    if (!fs.existsSync(this.unresolvedPath)) {
      fs.writeFileSync(this.unresolvedPath, '');
    }
    if (!fs.existsSync(this.versionPath)) {
      fs.writeFileSync(this.versionPath, JSON.stringify({ version: 1, migrated_at: new Date().toISOString() }));
    }

    await migrate(this.basePath);
    await this.loadIndex();
  }

  // --------------------------------------------------------------------------
  // Index management
  // --------------------------------------------------------------------------

  private async loadIndex(): Promise<WorkIndex> {
    if (this.index) return this.index;

    if (fs.existsSync(this.indexPath)) {
      const raw = fs.readFileSync(this.indexPath, 'utf-8');
      this.index = JSON.parse(raw) as WorkIndex;
    } else {
      this.index = this.emptyIndex();
      await this.saveIndex();
    }

    return this.index;
  }

  private emptyIndex(): WorkIndex {
    return {
      doi: {},
      isbn: {},
      title_hash: {},
      author_family: {},
      tag: {},
      removed: [],
    };
  }

  private async saveIndex(): Promise<void> {
    if (!this.index) return;
    fs.writeFileSync(this.indexPath, JSON.stringify(this.index, null, 2));
  }

  private indexWork(work: CitedWork): void {
    if (!this.index) return;

    if (work.doi) {
      this.index.doi[work.doi.toLowerCase()] = work.id;
    }
    if (work.isbn) {
      this.index.isbn[normalizeIsbn(work.isbn)] = work.id;
    }

    this.index.title_hash[normalizeTitle(work.title)] = work.id;

    for (const author of work.authors) {
      const key = author.family.toLowerCase();
      if (!this.index.author_family[key]) {
        this.index.author_family[key] = [];
      }
      if (!this.index.author_family[key].includes(work.id)) {
        this.index.author_family[key].push(work.id);
      }
    }

    for (const tag of work.tags) {
      const key = tag.toLowerCase();
      if (!this.index.tag[key]) {
        this.index.tag[key] = [];
      }
      if (!this.index.tag[key].includes(work.id)) {
        this.index.tag[key].push(work.id);
      }
    }
  }

  // --------------------------------------------------------------------------
  // CRUD operations
  // --------------------------------------------------------------------------

  /**
   * Add a cited work. Deduplicates by DOI, ISBN, then title similarity.
   * If duplicate found, merges provenance and raw_citations into existing.
   * Returns the work ID (existing or new).
   */
  async add(work: CitedWork): Promise<string> {
    const idx = await this.loadIndex();

    // Check dedup: DOI
    if (work.doi) {
      const existingId = idx.doi[work.doi.toLowerCase()];
      if (existingId && !idx.removed.includes(existingId)) {
        return this.mergeInto(existingId, work);
      }
    }

    // Check dedup: ISBN
    if (work.isbn) {
      const existingId = idx.isbn[normalizeIsbn(work.isbn)];
      if (existingId && !idx.removed.includes(existingId)) {
        return this.mergeInto(existingId, work);
      }
    }

    // Check dedup: title similarity + same first author + year ±1
    if (work.authors.length > 0) {
      const authorFamily = work.authors[0].family.toLowerCase();
      const authorWorks = idx.author_family[authorFamily] ?? [];

      for (const candidateId of authorWorks) {
        if (idx.removed.includes(candidateId)) continue;
        const candidate = await this.get(candidateId);
        if (!candidate) continue;

        if (
          Math.abs(candidate.year - work.year) <= 1 &&
          titleSimilarity(candidate.title, work.title) > 0.92
        ) {
          return this.mergeInto(candidateId, work);
        }
      }
    }

    // No duplicate: append new record
    const id = work.id || generateCitationId(
      work.title,
      work.authors[0].family,
      work.year,
    );
    const record = { ...work, id };

    this.appendJsonl(this.worksPath, record);
    this.indexWork(record);
    await this.saveIndex();

    return id;
  }

  /**
   * Merge incoming work's provenance and raw_citations into an existing record.
   */
  private async mergeInto(existingId: string, incoming: CitedWork): Promise<string> {
    const existing = await this.get(existingId);
    if (!existing) return existingId;

    // Merge provenance entries (avoid exact duplicates by artifact_path)
    const existingPaths = new Set(existing.cited_by.map(e => e.artifact_path));
    const newProvenance = incoming.cited_by.filter(e => !existingPaths.has(e.artifact_path));

    // Merge raw_citations (avoid exact duplicates by text)
    const existingTexts = new Set(existing.raw_citations.map(r => r.text));
    const newRaws = incoming.raw_citations.filter(r => !existingTexts.has(r.text));

    if (newProvenance.length > 0 || newRaws.length > 0) {
      const merged: CitedWork = {
        ...existing,
        cited_by: [...existing.cited_by, ...newProvenance],
        raw_citations: [...existing.raw_citations, ...newRaws],
      };
      this.appendJsonl(this.worksPath, merged);
      this.indexWork(merged);
      await this.saveIndex();
    }

    return existingId;
  }

  /**
   * Retrieve a cited work by ID. Returns null if not found or removed.
   */
  async get(id: string): Promise<CitedWork | null> {
    const idx = await this.loadIndex();
    if (idx.removed.includes(id)) return null;

    // Scan JSONL in reverse (most recent version is last)
    const lines = this.readJsonlLines(this.worksPath);
    for (let i = lines.length - 1; i >= 0; i--) {
      const work = this.parseLine(lines[i]);
      if (work && work.id === id) return work;
    }

    return null;
  }

  /**
   * Update fields on an existing record. Appends updated version to JSONL.
   */
  async update(id: string, partial: Partial<CitedWork>): Promise<CitedWork | null> {
    const existing = await this.get(id);
    if (!existing) return null;

    const updated: CitedWork = { ...existing, ...partial, id };
    this.appendJsonl(this.worksPath, updated);
    this.indexWork(updated);
    await this.saveIndex();

    return updated;
  }

  /**
   * Remove a record by marking it in the index and appending a tombstone.
   */
  async remove(id: string): Promise<boolean> {
    const existing = await this.get(id);
    if (!existing) return false;

    const idx = await this.loadIndex();
    idx.removed.push(id);

    // Append tombstone entry
    this.appendJsonl(this.worksPath, { ...existing, _tombstone: true });
    await this.saveIndex();

    return true;
  }

  // --------------------------------------------------------------------------
  // Index lookup operations
  // --------------------------------------------------------------------------

  /** Find a work by DOI. */
  async findByDoi(doi: string): Promise<CitedWork | null> {
    const idx = await this.loadIndex();
    const id = idx.doi[doi.toLowerCase()];
    if (!id || idx.removed.includes(id)) return null;
    return this.get(id);
  }

  /** Find a work by ISBN (normalizes hyphens). */
  async findByIsbn(isbn: string): Promise<CitedWork | null> {
    const idx = await this.loadIndex();
    const id = idx.isbn[normalizeIsbn(isbn)];
    if (!id || idx.removed.includes(id)) return null;
    return this.get(id);
  }

  /**
   * Find works with title similarity above threshold.
   * Checks all title_hash entries in the index.
   */
  async findByTitle(title: string, threshold = 0.92): Promise<CitedWork[]> {
    const idx = await this.loadIndex();
    const results: CitedWork[] = [];

    for (const [indexedTitle, id] of Object.entries(idx.title_hash)) {
      if (idx.removed.includes(id)) continue;
      const sim = titleSimilarity(title, indexedTitle);
      if (sim >= threshold) {
        const work = await this.get(id);
        if (work) results.push(work);
      }
    }

    return results;
  }

  /** Find all works by author family name. */
  async findByAuthor(authorFamily: string): Promise<CitedWork[]> {
    const idx = await this.loadIndex();
    const ids = idx.author_family[authorFamily.toLowerCase()] ?? [];
    const results: CitedWork[] = [];

    for (const id of ids) {
      if (idx.removed.includes(id)) continue;
      const work = await this.get(id);
      if (work) results.push(work);
    }

    return results;
  }

  /** Find all works with a given tag. */
  async findByTag(tag: string): Promise<CitedWork[]> {
    const idx = await this.loadIndex();
    const ids = idx.tag[tag.toLowerCase()] ?? [];
    const results: CitedWork[] = [];

    for (const id of ids) {
      if (idx.removed.includes(id)) continue;
      const work = await this.get(id);
      if (work) results.push(work);
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Bulk operations
  // --------------------------------------------------------------------------

  /** Return all active (non-removed) records. */
  async all(): Promise<CitedWork[]> {
    const idx = await this.loadIndex();
    const lines = this.readJsonlLines(this.worksPath);
    const latest = new Map<string, CitedWork>();

    for (const line of lines) {
      const work = this.parseLine(line);
      if (work && !idx.removed.includes(work.id)) {
        latest.set(work.id, work);
      }
    }

    return Array.from(latest.values());
  }

  /** Return count of active records. */
  async count(): Promise<number> {
    const works = await this.all();
    return works.length;
  }

  /** Add an unresolved raw citation to the queue. */
  async addUnresolved(citation: RawCitation): Promise<void> {
    this.appendJsonl(this.unresolvedPath, citation);
  }

  /** Read all unresolved citations. */
  async getUnresolved(): Promise<RawCitation[]> {
    const lines = this.readJsonlLines(this.unresolvedPath);
    return lines
      .map(line => {
        try { return JSON.parse(line) as RawCitation; }
        catch { return null; }
      })
      .filter((c): c is RawCitation => c !== null);
  }

  /** Remove resolved entries from the unresolved queue by matching text. */
  async clearResolved(texts: string[]): Promise<void> {
    const textSet = new Set(texts);
    const remaining = (await this.getUnresolved())
      .filter(c => !textSet.has(c.text));

    fs.writeFileSync(this.unresolvedPath, '');
    for (const c of remaining) {
      this.appendJsonl(this.unresolvedPath, c);
    }
  }

  // --------------------------------------------------------------------------
  // Maintenance
  // --------------------------------------------------------------------------

  /**
   * Compact the JSONL file: rewrite with only the latest version of each
   * active record, removing tombstones and superseded entries.
   */
  async compact(): Promise<number> {
    const active = await this.all();
    fs.writeFileSync(this.worksPath, '');
    for (const work of active) {
      this.appendJsonl(this.worksPath, work);
    }
    return active.length;
  }

  /** Export all active records. */
  async exportAll(): Promise<CitedWork[]> {
    return this.all();
  }

  /**
   * Import a batch of works. Deduplicates each on insert.
   * Returns count of added vs duplicates.
   */
  async importBatch(works: CitedWork[]): Promise<ImportResult> {
    const beforeCount = await this.count();
    for (const work of works) {
      await this.add(work);
    }
    const afterCount = await this.count();
    const added = afterCount - beforeCount;
    return { added, duplicates: works.length - added };
  }

  /**
   * Rebuild indexes from scratch by scanning the JSONL file.
   */
  async rebuildIndexes(): Promise<void> {
    this.index = this.emptyIndex();
    const active = await this.allFromJsonl();

    for (const work of active) {
      this.indexWork(work);
    }

    await this.saveIndex();
  }

  // --------------------------------------------------------------------------
  // JSONL helpers
  // --------------------------------------------------------------------------

  private readJsonlLines(filePath: string): string[] {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').filter(line => line.trim().length > 0);
  }

  private parseLine(line: string): CitedWork | null {
    try {
      const parsed = JSON.parse(line);
      if (parsed._tombstone) return null;
      return CitedWorkSchema.parse(parsed);
    } catch {
      return null;
    }
  }

  private appendJsonl(filePath: string, record: unknown): void {
    fs.appendFileSync(filePath, JSON.stringify(record) + '\n');
  }

  /**
   * Read all active records directly from JSONL without relying on index.
   * Used during index rebuild.
   */
  private allFromJsonl(): CitedWork[] {
    const lines = this.readJsonlLines(this.worksPath);
    const latest = new Map<string, CitedWork>();

    for (const line of lines) {
      const work = this.parseLine(line);
      if (work) {
        latest.set(work.id, work);
      }
    }

    return Array.from(latest.values());
  }
}
