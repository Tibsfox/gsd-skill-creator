/**
 * LOD 200 — Memory Index (MEMORY.md Manager)
 *
 * Manages the MEMORY.md file that serves as the always-loaded index
 * for Claude's context. Each entry is a one-line pointer to a deeper
 * markdown file containing the full memory.
 *
 * Format: `- [Title](file.md) — one-line hook`
 *
 * The index is capped at 200 lines to stay within context budget.
 * Individual .md files are LOD 300 (loaded on demand).
 *
 * @module memory/index-manager
 */

import { readFile, writeFile, readdir, stat, mkdir } from 'fs/promises';
import { join, basename, relative, resolve } from 'path';
import { randomUUID } from 'crypto';
import { LodLevel } from '../lod/types.js';
import type {
  MemoryRecord,
  MemoryQuery,
  MemoryResult,
  MemoryStore,
  MemoryType,
} from './types.js';

// ─── Constants ──────────────────────────────────────────────────────────────

/** Maximum lines allowed in MEMORY.md before truncation warning. */
const MAX_INDEX_LINES = 200;

/** Regex to parse a MEMORY.md index line. */
const INDEX_LINE_REGEX = /^-\s+\[(.+?)\]\((.+?)\)\s*—\s*(.+)$/;

/** Token estimation: ~4 chars per token. */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// ─── Index Entry ────────────────────────────────────────────────────────────

/** A parsed entry from the MEMORY.md index. */
export interface IndexEntry {
  /** Display title (from markdown link text). */
  title: string;

  /** Relative path to the .md file. */
  file: string;

  /** One-line description hook. */
  description: string;

  /** Line number in MEMORY.md (1-based). */
  lineNumber: number;
}

// ─── Frontmatter ────────────────────────────────────────────────────────────

/** Parsed frontmatter from a memory .md file. */
export interface MemoryFrontmatter {
  name?: string;
  description?: string;
  type?: MemoryType;
  tags?: string[];
  confidence?: number;
  [key: string]: unknown;
}

/**
 * Parse YAML frontmatter delimited by `---` from markdown content.
 * Returns the parsed key-value pairs and the body after frontmatter.
 */
function parseFrontmatter(content: string): { meta: MemoryFrontmatter; body: string } {
  const meta: MemoryFrontmatter = {};

  if (!content.startsWith('---')) {
    return { meta, body: content };
  }

  const endIdx = content.indexOf('---', 3);
  if (endIdx === -1) {
    return { meta, body: content };
  }

  const yamlBlock = content.slice(3, endIdx).trim();
  const body = content.slice(endIdx + 3).trim();

  // Simple YAML key: value parser (no nested objects — memory files are flat)
  for (const line of yamlBlock.split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let value: string | string[] | number = line.slice(colonIdx + 1).trim();

    // Strip quotes
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle arrays: `tags: [a, b, c]` or `tags: a, b, c`
    if (key === 'tags') {
      const raw = value.replace(/^\[|\]$/g, '');
      meta.tags = raw.split(',').map(t => t.trim()).filter(Boolean);
      continue;
    }

    // Handle numbers
    if (key === 'confidence') {
      const num = parseFloat(value);
      if (!isNaN(num)) {
        meta.confidence = num;
        continue;
      }
    }

    (meta as Record<string, unknown>)[key] = value;
  }

  return { meta, body };
}

// ─── IndexManager ───────────────────────────────────────────────────────────

/** Configuration for the IndexManager. */
export interface IndexManagerConfig {
  /** Path to the memory directory containing MEMORY.md and .md files. */
  memoryDir?: string;

  /** Name of the index file (default: MEMORY.md). */
  indexFile?: string;
}

/**
 * LOD 200 memory store — manages the MEMORY.md index file.
 *
 * The index is always loaded into Claude's context window. Each line
 * points to a deeper .md file (LOD 300) that contains the full memory.
 * This class handles reading, writing, querying, and syncing the index.
 */
export class IndexManager implements MemoryStore {
  readonly lod = LodLevel.SCHEMATIC;  // LOD 200

  private readonly memoryDir: string;
  private readonly indexFile: string;
  private readonly indexPath: string;

  constructor(config: IndexManagerConfig = {}) {
    this.memoryDir = config.memoryDir ?? this.detectMemoryDir();
    this.indexFile = config.indexFile ?? 'MEMORY.md';
    this.indexPath = join(this.memoryDir, this.indexFile);
  }

  // ─── MemoryStore Interface ────────────────────────────────────────────────

  /**
   * Store a memory in the index.
   * Adds a new line to MEMORY.md and writes the .md file.
   * If a record with the same ID already exists, updates it.
   */
  async store(record: MemoryRecord): Promise<void> {
    const entries = await this.parseIndex();
    const filename = this.recordToFilename(record);
    const existingIdx = entries.findIndex(e => e.file === filename);

    const newEntry: IndexEntry = {
      title: record.name,
      file: filename,
      description: this.truncateDescription(record.description),
      lineNumber: existingIdx >= 0 ? entries[existingIdx].lineNumber : entries.length + 1,
    };

    if (existingIdx >= 0) {
      entries[existingIdx] = newEntry;
    } else {
      entries.push(newEntry);
    }

    // Check line limit
    if (entries.length > MAX_INDEX_LINES) {
      console.warn(
        `[IndexManager] MEMORY.md has ${entries.length} lines, exceeding limit of ${MAX_INDEX_LINES}. ` +
        `Consider demoting old entries to LOD 300+.`
      );
    }

    // Write the index
    await this.writeIndex(entries);

    // Write the individual .md file with frontmatter
    const mdPath = join(this.memoryDir, filename);
    const frontmatter = [
      '---',
      `name: "${record.name}"`,
      `description: "${record.description}"`,
      `type: ${record.type}`,
      `tags: [${record.tags.join(', ')}]`,
      `confidence: ${record.confidence}`,
      `id: ${record.id}`,
      `created: ${record.createdAt.toISOString()}`,
      `updated: ${record.updatedAt.toISOString()}`,
      '---',
      '',
    ].join('\n');

    await this.ensureDir(this.memoryDir);
    await writeFile(mdPath, frontmatter + record.content, 'utf-8');
  }

  /**
   * Query the index using substring matching on index lines.
   * Matches against title, filename, and description.
   */
  async query(q: MemoryQuery): Promise<MemoryResult[]> {
    const entries = await this.parseIndex();
    const limit = q.limit ?? 10;
    const queryLower = q.text.toLowerCase();
    const queryTerms = queryLower.split(/\s+/).filter(t => t.length > 1);

    const results: MemoryResult[] = [];

    for (const entry of entries) {
      const searchText = `${entry.title} ${entry.file} ${entry.description}`.toLowerCase();

      // Count how many query terms match
      let matchCount = 0;
      for (const term of queryTerms) {
        if (searchText.includes(term)) matchCount++;
      }

      if (matchCount === 0) continue;

      const score = queryTerms.length > 0 ? matchCount / queryTerms.length : 0;

      // Create a lightweight record from the index entry
      // (full content requires a get() call to the .md file)
      const record: MemoryRecord = {
        id: entry.file.replace(/\.md$/, ''),
        type: 'reference',
        name: entry.title,
        description: entry.description,
        content: '',  // Loaded on demand via get()
        lodCurrent: LodLevel.SCHEMATIC,
        tags: [],
        confidence: 0.5,
        validFrom: new Date(),
        validTo: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastAccessed: new Date(),
        accessCount: 0,
        provenance: { scope: 'project', visibility: 'internal', domains: [] },
        temporalClass: 'seasonal',
        sourceFile: join(this.memoryDir, entry.file),
        relatedTo: [],
      };

      results.push({
        record,
        score,
        sourceLod: LodLevel.SCHEMATIC,
        tokenEstimate: estimateTokens(entry.title + entry.description),
      });
    }

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    const limited = results.slice(0, limit);

    // Apply token budget
    if (q.tokenBudget) {
      let tokenSum = 0;
      const budgeted: MemoryResult[] = [];
      for (const r of limited) {
        if (tokenSum + r.tokenEstimate > q.tokenBudget) break;
        tokenSum += r.tokenEstimate;
        budgeted.push(r);
      }
      return budgeted;
    }

    return limited;
  }

  /**
   * Retrieve a memory by ID.
   * Reads the pointed-to .md file and parses its frontmatter
   * to reconstruct a full MemoryRecord.
   */
  async get(id: string): Promise<MemoryRecord | null> {
    // ID can be a filename stem or UUID — try both patterns
    const entries = await this.parseIndex();
    const entry = entries.find(e =>
      e.file === id ||
      e.file === `${id}.md` ||
      e.file.replace(/\.md$/, '') === id
    );

    if (!entry) return null;

    const mdPath = join(this.memoryDir, entry.file);

    let content: string;
    try {
      content = await readFile(mdPath, 'utf-8');
    } catch {
      // File referenced in index but not on disk
      return null;
    }

    const { meta, body } = parseFrontmatter(content);

    return {
      id: (meta.id as string) ?? entry.file.replace(/\.md$/, ''),
      type: (meta.type as MemoryType) ?? 'reference',
      name: meta.name ?? entry.title,
      description: meta.description ?? entry.description,
      content: body,
      lodCurrent: LodLevel.SCHEMATIC,
      tags: meta.tags ?? [],
      confidence: meta.confidence ?? 0.5,
      validFrom: meta.created ? new Date(meta.created as string) : new Date(),
      validTo: null,
      createdAt: meta.created ? new Date(meta.created as string) : new Date(),
      updatedAt: meta.updated ? new Date(meta.updated as string) : new Date(),
      lastAccessed: new Date(),
      accessCount: 0,
      provenance: {
        scope: (meta.scope as any) ?? 'project',
        visibility: (meta.visibility as any) ?? 'internal',
        domains: Array.isArray(meta.domains) ? meta.domains.map(String) : [],
      },
      temporalClass: (meta.temporalClass as any) ?? 'seasonal',
      sourceFile: mdPath,
      relatedTo: [],
    };
  }

  /**
   * Remove a memory from the MEMORY.md index.
   * Does NOT delete the underlying .md file (demotion, not deletion).
   */
  async remove(id: string): Promise<boolean> {
    const entries = await this.parseIndex();
    const initialLength = entries.length;

    const filtered = entries.filter(e =>
      e.file !== id &&
      e.file !== `${id}.md` &&
      e.file.replace(/\.md$/, '') !== id
    );

    if (filtered.length === initialLength) return false;

    await this.writeIndex(filtered);
    return true;
  }

  /** Check if a memory has an entry in the index. */
  async has(id: string): Promise<boolean> {
    const entries = await this.parseIndex();
    return entries.some(e =>
      e.file === id ||
      e.file === `${id}.md` ||
      e.file.replace(/\.md$/, '') === id
    );
  }

  /** Count entries in the MEMORY.md index. */
  async count(): Promise<number> {
    const entries = await this.parseIndex();
    return entries.length;
  }

  // ─── Index-Specific Methods ───────────────────────────────────────────────

  /**
   * Parse the MEMORY.md file and return structured entries.
   * Each entry corresponds to one `- [Title](file.md) — description` line.
   */
  async parseIndex(): Promise<IndexEntry[]> {
    let content: string;
    try {
      content = await readFile(this.indexPath, 'utf-8');
    } catch {
      // File doesn't exist yet — empty index
      return [];
    }

    const entries: IndexEntry[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const match = lines[i].match(INDEX_LINE_REGEX);
      if (match) {
        entries.push({
          title: match[1],
          file: match[2],
          description: match[3].trim(),
          lineNumber: i + 1,
        });
      }
    }

    return entries;
  }

  /**
   * Scan the memory directory for .md files and ensure each has
   * a corresponding entry in the MEMORY.md index.
   *
   * Files without index entries are added with frontmatter-derived
   * titles and descriptions. Returns the number of new entries added.
   */
  async syncFromFiles(): Promise<number> {
    await this.ensureDir(this.memoryDir);

    let files: string[];
    try {
      files = await readdir(this.memoryDir);
    } catch {
      return 0;
    }

    const mdFiles = files.filter(f =>
      f.endsWith('.md') &&
      f !== this.indexFile &&
      !f.startsWith('.')
    );

    const entries = await this.parseIndex();
    const indexedFiles = new Set(entries.map(e => e.file));
    let added = 0;

    for (const file of mdFiles) {
      if (indexedFiles.has(file)) continue;

      // Read frontmatter to get title and description
      const filePath = join(this.memoryDir, file);
      let content: string;
      try {
        content = await readFile(filePath, 'utf-8');
      } catch {
        continue;
      }

      const { meta } = parseFrontmatter(content);
      const title = meta.name ?? file.replace(/\.md$/, '').replace(/[-_]/g, ' ');
      const description = meta.description ?? 'Unindexed memory file';

      entries.push({
        title,
        file,
        description: this.truncateDescription(description),
        lineNumber: entries.length + 1,
      });
      added++;
    }

    if (added > 0) {
      await this.writeIndex(entries);
    }

    if (entries.length > MAX_INDEX_LINES) {
      console.warn(
        `[IndexManager] After sync, MEMORY.md has ${entries.length} lines ` +
        `(limit: ${MAX_INDEX_LINES}). Consider pruning stale entries.`
      );
    }

    return added;
  }

  /**
   * Get the full content of MEMORY.md as a string.
   * Returns empty string if the file doesn't exist.
   */
  async getIndexContent(): Promise<string> {
    try {
      return await readFile(this.indexPath, 'utf-8');
    } catch {
      return '';
    }
  }

  /**
   * Get the resolved path to the MEMORY.md file.
   */
  getIndexPath(): string {
    return this.indexPath;
  }

  /**
   * Get the resolved path to the memory directory.
   */
  getMemoryDir(): string {
    return this.memoryDir;
  }

  // ─── Private Helpers ──────────────────────────────────────────────────────

  /**
   * Write the index entries back to MEMORY.md.
   * Preserves the standard format: `- [Title](file.md) — description`
   */
  private async writeIndex(entries: IndexEntry[]): Promise<void> {
    await this.ensureDir(this.memoryDir);

    const header = `# Memory\n\n`;
    const lines = entries.map(e =>
      `- [${e.title}](${e.file}) — ${e.description}`
    );

    // Re-number entries
    for (let i = 0; i < entries.length; i++) {
      entries[i].lineNumber = i + 3; // Account for header + blank line
    }

    const content = header + lines.join('\n') + '\n';
    await writeFile(this.indexPath, content, 'utf-8');
  }

  /**
   * Convert a MemoryRecord into a kebab-case filename.
   * Uses sourceFile if available, otherwise derives from name.
   */
  private recordToFilename(record: MemoryRecord): string {
    if (record.sourceFile) {
      return basename(record.sourceFile);
    }

    const slug = record.name
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);

    return `${slug}.md`;
  }

  /** Truncate a description to fit on one index line (~120 chars). */
  private truncateDescription(desc: string): string {
    if (desc.length <= 120) return desc;
    return desc.slice(0, 117) + '...';
  }

  /** Auto-detect the memory directory from common project locations. */
  private detectMemoryDir(): string {
    // Check common locations in order of preference
    // Default to .claude/memory relative to cwd
    return resolve(process.cwd(), '.claude', 'memory');
  }

  /** Ensure a directory exists, creating it recursively if needed. */
  private async ensureDir(dir: string): Promise<void> {
    try {
      await mkdir(dir, { recursive: true });
    } catch {
      // Directory already exists or can't be created
    }
  }
}

// ─── Exports ────────────────────────────────────────────────────────────────

export { parseFrontmatter };
export type { MemoryFrontmatter as Frontmatter };
