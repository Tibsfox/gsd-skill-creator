/**
 * LOD 300 — Markdown File Store.
 *
 * Manages individual memory files in a directory, each as a `.md` file
 * with YAML frontmatter + content body. Implements keyword-scored search
 * across name, description, content, and tags.
 *
 * Filename convention: `{type}_{slugified-name}.md`
 * Example: `feedback_no-trailing-summaries.md`
 *
 * @module memory/file-store
 */

import { readdir, readFile, writeFile, unlink, stat, mkdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import { LodLevel } from '../lod/types.js';
import type {
  MemoryRecord,
  MemoryQuery,
  MemoryResult,
  MemoryStore,
  MemoryType,
} from './types.js';

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Slugify a name to a safe filename segment: lowercase, hyphens, no special chars. */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Build the canonical filename for a memory record. */
function toFilename(record: MemoryRecord): string {
  return `${record.type}_${slugify(record.name)}.md`;
}

/** Serialize a Date to ISO string for frontmatter. */
function dateStr(d: Date | null | undefined): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : String(d);
}

/** Parse a value back to a Date, returning null for falsy values. */
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(value as string);
  return isNaN(d.getTime()) ? null : d;
}

/** Parse a value to a required Date, falling back to now. */
function requireDate(value: unknown): Date {
  return parseDate(value) ?? new Date();
}

// ─── YAML Frontmatter ───────────────────────────────────────────────────────

/** Minimal YAML frontmatter serializer (no external dependencies). */
function serializeFrontmatter(record: MemoryRecord): string {
  const lines: string[] = ['---'];

  const field = (key: string, value: unknown): void => {
    if (value === null || value === undefined) {
      lines.push(`${key}: null`);
    } else if (typeof value === 'string') {
      // Quote strings that contain special YAML chars
      if (/[:#\[\]{}&*!|>%@`,"']/.test(value) || value.includes('\n')) {
        lines.push(`${key}: "${value.replace(/"/g, '\\"')}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    } else if (typeof value === 'number' || typeof value === 'boolean') {
      lines.push(`${key}: ${value}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${key}: []`);
      } else {
        lines.push(`${key}:`);
        for (const item of value) {
          lines.push(`  - ${typeof item === 'string' && /[:#\[\]{}&*!|>%@`,"']/.test(item) ? `"${item.replace(/"/g, '\\"')}"` : item}`);
        }
      }
    }
  };

  field('id', record.id);
  field('name', record.name);
  field('description', record.description);
  field('type', record.type);
  field('tags', record.tags);
  field('confidence', record.confidence);
  field('lodCurrent', record.lodCurrent);
  field('validFrom', dateStr(record.validFrom));
  field('validTo', dateStr(record.validTo));
  field('createdAt', dateStr(record.createdAt));
  field('updatedAt', dateStr(record.updatedAt));
  field('lastAccessed', dateStr(record.lastAccessed));
  field('accessCount', record.accessCount);
  field('relatedTo', record.relatedTo);
  if (record.sourceSession) field('sourceSession', record.sourceSession);
  if (record.sourceFile) field('sourceFile', record.sourceFile);

  lines.push('---');
  return lines.join('\n');
}

/** Minimal YAML frontmatter parser. Returns { meta, content }. */
function parseFrontmatter(raw: string): { meta: Record<string, unknown>; content: string } {
  const meta: Record<string, unknown> = {};

  if (!raw.startsWith('---')) {
    return { meta, content: raw };
  }

  const endIdx = raw.indexOf('\n---', 3);
  if (endIdx === -1) {
    return { meta, content: raw };
  }

  const yamlBlock = raw.slice(4, endIdx); // skip opening '---\n'
  const content = raw.slice(endIdx + 4).replace(/^\n+/, ''); // skip closing '---\n'

  let currentKey: string | null = null;
  let currentArray: string[] | null = null;

  for (const line of yamlBlock.split('\n')) {
    // Array item
    if (currentKey && /^\s+-\s+/.test(line)) {
      const val = line.replace(/^\s+-\s+/, '').replace(/^"(.*)"$/, '$1');
      if (!currentArray) currentArray = [];
      currentArray.push(val);
      continue;
    }

    // Flush pending array
    if (currentKey && currentArray) {
      meta[currentKey] = currentArray;
      currentArray = null;
      currentKey = null;
    }

    const match = line.match(/^(\w[\w.-]*)\s*:\s*(.*)/);
    if (!match) continue;

    const [, key, rawValue] = match;
    const value = rawValue.trim();

    if (value === '' || value.endsWith(':')) {
      // Start of array or nested
      currentKey = key;
      currentArray = [];
      continue;
    }

    if (value === '[]') {
      meta[key] = [];
    } else if (value === 'null') {
      meta[key] = null;
    } else if (value === 'true') {
      meta[key] = true;
    } else if (value === 'false') {
      meta[key] = false;
    } else if (/^-?\d+(\.\d+)?$/.test(value)) {
      meta[key] = Number(value);
    } else if (value.startsWith('"') && value.endsWith('"')) {
      meta[key] = value.slice(1, -1).replace(/\\"/g, '"');
    } else {
      meta[key] = value;
    }

    currentKey = null;
  }

  // Flush trailing array
  if (currentKey && currentArray) {
    meta[currentKey] = currentArray;
  }

  return { meta, content };
}

/** Convert parsed frontmatter meta + content into a MemoryRecord. */
function metaToRecord(
  meta: Record<string, unknown>,
  content: string,
  filePath: string,
): MemoryRecord {
  return {
    id: String(meta.id ?? ''),
    type: (meta.type as MemoryType) ?? 'reference',
    name: String(meta.name ?? ''),
    description: String(meta.description ?? ''),
    content,
    lodCurrent: (meta.lodCurrent as LodLevel) ?? LodLevel.DETAILED,
    tags: Array.isArray(meta.tags) ? meta.tags.map(String) : [],
    confidence: typeof meta.confidence === 'number' ? meta.confidence : 1.0,
    validFrom: requireDate(meta.validFrom),
    validTo: parseDate(meta.validTo),
    createdAt: requireDate(meta.createdAt),
    updatedAt: requireDate(meta.updatedAt),
    lastAccessed: requireDate(meta.lastAccessed),
    accessCount: typeof meta.accessCount === 'number' ? meta.accessCount : 0,
    provenance: {
      scope: (meta.scope as any) ?? 'project',
      visibility: (meta.visibility as any) ?? 'internal',
      domains: Array.isArray(meta.domains) ? meta.domains.map(String) : [],
    },
    temporalClass: (meta.temporalClass as any) ?? 'seasonal',
    sourceFile: filePath,
    sourceSession: meta.sourceSession ? String(meta.sourceSession) : undefined,
    relatedTo: Array.isArray(meta.relatedTo) ? meta.relatedTo.map(String) : [],
  };
}

// ─── Score Calculation ──────────────────────────────────────────────────────

/**
 * Score a memory record against search keywords.
 * - Exact match on name: 1.0
 * - Keyword hits on description: 0.7
 * - Tag match: 0.5
 * - Keyword hits on content: 0.3
 * Returns the maximum individual score (capped at 1.0).
 */
function scoreRecord(record: MemoryRecord, keywords: string[]): number {
  if (keywords.length === 0) return 0;

  const nameLower = record.name.toLowerCase();
  const descLower = record.description.toLowerCase();
  const contentLower = record.content.toLowerCase();
  const tagsLower = record.tags.map((t) => t.toLowerCase());

  let maxScore = 0;

  // Check full query as exact name match
  const fullQuery = keywords.join(' ');
  if (nameLower === fullQuery) {
    return 1.0;
  }

  for (const kw of keywords) {
    // Name contains keyword
    if (nameLower.includes(kw)) {
      maxScore = Math.max(maxScore, 1.0);
    }

    // Description contains keyword
    if (descLower.includes(kw)) {
      maxScore = Math.max(maxScore, 0.7);
    }

    // Tag match
    if (tagsLower.some((t) => t.includes(kw))) {
      maxScore = Math.max(maxScore, 0.5);
    }

    // Content contains keyword
    if (contentLower.includes(kw)) {
      maxScore = Math.max(maxScore, 0.3);
    }
  }

  return Math.min(maxScore, 1.0);
}

/** Rough token estimate (~4 chars per token). */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── FileStore ──────────────────────────────────────────────────────────────

/**
 * LOD 300 Markdown File Store.
 *
 * Each memory is persisted as a `.md` file with YAML frontmatter in the
 * configured memory directory. Implements the MemoryStore interface for
 * keyword-based search and CRUD operations.
 */
export class FileStore implements MemoryStore {
  readonly lod = LodLevel.DETAILED;

  /** In-memory index: memory ID -> filename. Built lazily on first access. */
  private index: Map<string, string> | null = null;

  constructor(private readonly memoryDir: string) {}

  // ─── Public API ──────────────────────────────────────────────────────────

  /**
   * Store a memory record as a markdown file.
   * Creates the memory directory if it does not exist.
   * Overwrites any existing file for the same record.
   */
  async store(record: MemoryRecord): Promise<void> {
    await this.ensureDir();

    const filename = toFilename(record);
    const filePath = join(this.memoryDir, filename);

    // Update sourceFile to reflect storage location
    const storedRecord: MemoryRecord = {
      ...record,
      sourceFile: filePath,
      updatedAt: new Date(),
    };

    const frontmatter = serializeFrontmatter(storedRecord);
    const fileContent = `${frontmatter}\n${storedRecord.content}\n`;

    await writeFile(filePath, fileContent, 'utf-8');

    // Update index
    if (this.index) {
      this.index.set(record.id, filename);
    }
  }

  /**
   * Retrieve a memory by ID.
   * Updates `lastAccessed` and increments `accessCount` on each retrieval.
   * Returns null if the memory does not exist.
   */
  async get(id: string): Promise<MemoryRecord | null> {
    const filename = await this.findFileById(id);
    if (!filename) return null;

    const filePath = join(this.memoryDir, filename);
    const record = await this.readRecord(filePath);
    if (!record || record.id !== id) return null;

    // Update access metadata
    record.lastAccessed = new Date();
    record.accessCount += 1;

    // Persist the updated access metadata
    await this.store(record);

    return record;
  }

  /**
   * Query memories by keyword search.
   * Matches against name, description, content, and tags.
   * Applies type and tag filters from the query.
   * Returns results sorted by relevance score descending.
   */
  async query(q: MemoryQuery): Promise<MemoryResult[]> {
    const allRecords = await this.readAllRecords();
    const keywords = q.text
      .toLowerCase()
      .split(/\s+/)
      .filter((k) => k.length > 0);

    const results: MemoryResult[] = [];

    for (const record of allRecords) {
      // Type filter
      if (q.type && record.type !== q.type) continue;

      // Tag filter
      if (q.tags && q.tags.length > 0) {
        const recordTagsLower = record.tags.map((t) => t.toLowerCase());
        const hasMatchingTag = q.tags.some((t) =>
          recordTagsLower.includes(t.toLowerCase()),
        );
        if (!hasMatchingTag) continue;
      }

      // Temporal filter
      if (q.asOf) {
        if (record.validFrom > q.asOf) continue;
        if (record.validTo && record.validTo < q.asOf) continue;
      }

      // Score
      const score = scoreRecord(record, keywords);
      if (score <= 0) continue;

      results.push({
        record,
        score,
        sourceLod: LodLevel.DETAILED,
        tokenEstimate: estimateTokens(record.content),
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    const limit = q.limit ?? results.length;
    return results.slice(0, limit);
  }

  /**
   * Remove a memory file by ID.
   * Returns true if the file was deleted, false if it did not exist.
   */
  async remove(id: string): Promise<boolean> {
    const filename = await this.findFileById(id);
    if (!filename) return false;

    const filePath = join(this.memoryDir, filename);
    try {
      await unlink(filePath);
      if (this.index) {
        this.index.delete(id);
      }
      return true;
    } catch {
      return false;
    }
  }

  /** Check if a memory exists at this tier by ID. */
  async has(id: string): Promise<boolean> {
    const filename = await this.findFileById(id);
    return filename !== null;
  }

  /** Count the number of `.md` memory files in the directory. */
  async count(): Promise<number> {
    const files = await this.listMdFiles();
    return files.length;
  }

  /**
   * List all memory records in the directory.
   * Reads and parses every `.md` file.
   */
  async list(): Promise<MemoryRecord[]> {
    return this.readAllRecords();
  }

  // ─── Private Helpers ─────────────────────────────────────────────────────

  /** Ensure the memory directory exists. */
  private async ensureDir(): Promise<void> {
    try {
      await mkdir(this.memoryDir, { recursive: true });
    } catch {
      // Directory already exists — fine
    }
  }

  /** List all `.md` files in the memory directory. */
  private async listMdFiles(): Promise<string[]> {
    try {
      const entries = await readdir(this.memoryDir);
      return entries.filter((f) => f.endsWith('.md'));
    } catch {
      return [];
    }
  }

  /** Read and parse a single `.md` file into a MemoryRecord. */
  private async readRecord(filePath: string): Promise<MemoryRecord | null> {
    try {
      const raw = await readFile(filePath, 'utf-8');
      const { meta, content } = parseFrontmatter(raw);
      return metaToRecord(meta, content, filePath);
    } catch {
      return null;
    }
  }

  /** Read all `.md` files and return parsed MemoryRecords. */
  private async readAllRecords(): Promise<MemoryRecord[]> {
    const files = await this.listMdFiles();
    const records: MemoryRecord[] = [];

    for (const file of files) {
      const filePath = join(this.memoryDir, file);
      const record = await this.readRecord(filePath);
      if (record) records.push(record);
    }

    return records;
  }

  /**
   * Find the filename for a given memory ID.
   * Uses a lazy-built index, falling back to scanning all files.
   */
  private async findFileById(id: string): Promise<string | null> {
    // Check cached index first
    if (this.index) {
      const cached = this.index.get(id);
      if (cached) return cached;
    }

    // Build/rebuild index by scanning all files
    this.index = new Map();
    const files = await this.listMdFiles();

    for (const file of files) {
      const filePath = join(this.memoryDir, file);
      try {
        const raw = await readFile(filePath, 'utf-8');
        // Quick ID extraction without full parse
        const idMatch = raw.match(/^id:\s*(.+)$/m);
        if (idMatch) {
          const fileId = idMatch[1].trim().replace(/^["']|["']$/g, '');
          this.index.set(fileId, file);
        }
      } catch {
        // Skip unreadable files
      }
    }

    return this.index.get(id) ?? null;
  }
}
