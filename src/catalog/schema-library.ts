/**
 * SchemaLibrary: indexes JSON schemas by data type and source skill with
 * mandatory provenance tracking.
 *
 * The library is the second lookup table for DACP -- it enables the
 * assembler and interpreter to find relevant schemas for data validation.
 * Supports search by data_type, field names, and regex name patterns.
 *
 * Persistence: saves to ~/.gsd/dacp/catalog/schemas.json by default.
 *
 * @module catalog/schema-library
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { SchemaLibraryEntry } from '../dacp/types.js';
import type { SchemaSearchQuery, SchemaPersistenceData } from './types.js';

/** Default index file path under user home. */
const DEFAULT_INDEX_PATH = path.join(
  process.env['HOME'] ?? process.env['USERPROFILE'] ?? '.',
  '.gsd',
  'dacp',
  'catalog',
  'schemas.json',
);

/** Subdirectories to scan for schema files within a skill directory. */
const SCHEMA_DIRS = ['references', 'resources'];

export class SchemaLibrary {
  private entries: Map<string, SchemaLibraryEntry>;
  private indexPath: string;
  /** Cache of parsed schema objects keyed by schema_path. */
  private schemaCache: Map<string, object>;

  constructor(indexPath?: string) {
    this.entries = new Map();
    this.indexPath = indexPath ?? DEFAULT_INDEX_PATH;
    this.schemaCache = new Map();
  }

  /**
   * Build index by scanning skill directories for .schema.json files.
   * Looks in references/ and resources/ subdirectories of each skill.
   */
  async buildIndex(skillsRoot: string): Promise<void> {
    try {
      const topEntries = await fs.promises.readdir(skillsRoot, { withFileTypes: true });

      for (const topEntry of topEntries) {
        if (!topEntry.isDirectory() || topEntry.name.startsWith('.')) continue;

        const skillName = topEntry.name;

        for (const schemaDir of SCHEMA_DIRS) {
          const schemaDirPath = path.join(skillsRoot, skillName, schemaDir);

          try {
            const stat = await fs.promises.stat(schemaDirPath);
            if (!stat.isDirectory()) continue;

            const files = await fs.promises.readdir(schemaDirPath);

            for (const file of files) {
              if (!file.endsWith('.schema.json')) continue;

              const fullPath = path.join(schemaDirPath, file);
              const fileStat = await fs.promises.stat(fullPath);
              if (!fileStat.isFile()) continue;

              const schemaPath = path.join(schemaDir, file);
              const dataType = file.replace('.schema.json', '');

              // Parse schema to extract field names
              let fields: string[] = [];
              try {
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                const parsed = JSON.parse(content);
                if (parsed.properties && typeof parsed.properties === 'object') {
                  fields = Object.keys(parsed.properties);
                }
              } catch {
                // Failed to parse schema — use empty fields
              }

              const id = crypto
                .createHash('sha256')
                .update(`${skillName}:${schemaPath}`)
                .digest('hex')
                .slice(0, 16);

              const entry: SchemaLibraryEntry = {
                id,
                name: dataType,
                schema_path: fullPath,
                data_type: dataType.replace(/-schema$/, ''),
                source_skill: skillName,
                version: '1.0.0',
                fields,
                last_updated: new Date().toISOString(),
                reference_count: 0,
              };

              this.entries.set(id, entry);
            }
          } catch {
            // Schema dir does not exist — skip silently
          }
        }
      }
    } catch {
      // Skills root does not exist — no-op
    }
  }

  /**
   * Search the library using AND logic on all provided query fields.
   * Returns empty array when no matches found (never throws).
   */
  search(query: SchemaSearchQuery): SchemaLibraryEntry[] {
    return Array.from(this.entries.values()).filter((entry) => {
      if (query.data_type !== undefined && entry.data_type !== query.data_type) {
        return false;
      }
      if (query.fields !== undefined && query.fields.length > 0) {
        const hasAllFields = query.fields.every((f) => entry.fields.includes(f));
        if (!hasAllFields) return false;
      }
      if (query.name_pattern !== undefined) {
        const regex = new RegExp(query.name_pattern);
        if (!regex.test(entry.name)) return false;
      }
      return true;
    });
  }

  /**
   * Get a specific entry by ID.
   * Returns null if not found.
   */
  get(id: string): SchemaLibraryEntry | null {
    return this.entries.get(id) ?? null;
  }

  /**
   * Resolve a schema path to a parsed JSON object.
   * Returns null if the file does not exist or is invalid JSON.
   * Caches parsed schemas to avoid repeated reads.
   */
  resolve(schemaPath: string): object | null {
    const cached = this.schemaCache.get(schemaPath);
    if (cached) return cached;

    try {
      const content = fs.readFileSync(schemaPath, 'utf-8');
      const parsed = JSON.parse(content) as object;
      this.schemaCache.set(schemaPath, parsed);
      return parsed;
    } catch {
      return null;
    }
  }

  /**
   * Add a single entry with provenance enforcement.
   * Rejects entries with empty source_skill.
   */
  addEntry(entry: SchemaLibraryEntry): void {
    if (!entry.source_skill || entry.source_skill.trim() === '') {
      throw new Error('Provenance enforcement: source_skill must not be empty');
    }
    this.entries.set(entry.id, { ...entry });
  }

  /**
   * Remove all entries from a given source skill.
   */
  removeSkill(skillName: string): void {
    for (const [id, entry] of this.entries) {
      if (entry.source_skill === skillName) {
        this.entries.delete(id);
      }
    }
  }

  /**
   * Persist library to disk as JSON.
   * Creates parent directories with recursive mkdir.
   */
  async save(): Promise<void> {
    const dir = path.dirname(this.indexPath);
    await fs.promises.mkdir(dir, { recursive: true });

    const data: SchemaPersistenceData = {
      version: '1.0',
      entries: Array.from(this.entries.values()),
      last_built: new Date().toISOString(),
    };

    await fs.promises.writeFile(this.indexPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Load library from disk JSON file.
   * Validates version field and populates entries map.
   */
  async load(): Promise<void> {
    const raw = await fs.promises.readFile(this.indexPath, 'utf-8');
    const data: SchemaPersistenceData = JSON.parse(raw);

    if (!data.version) {
      throw new Error('Invalid schema library file: missing version field');
    }

    this.entries.clear();
    for (const entry of data.entries) {
      this.entries.set(entry.id, entry);
    }
  }

  /** Number of entries in the library. */
  get size(): number {
    return this.entries.size;
  }
}
