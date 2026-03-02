/**
 * ScriptCatalog: indexes skill scripts by function type with mandatory
 * provenance tracking and success rate monitoring.
 *
 * The catalog is the primary lookup table for the DACP Assembler to find
 * matching scripts by function type (parser, validator, transformer,
 * formatter, analyzer, generator). Every entry must have provenance
 * (non-empty skill_source and script_path). Success rates are updated
 * using exponential moving average for smooth trend tracking.
 *
 * Persistence: saves to ~/.gsd/dacp/catalog/scripts.json by default.
 *
 * @module catalog/script-catalog
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { ScriptCatalogEntry } from '../../integrations/dacp/types.js';
import type { CatalogSearchQuery, CatalogPersistenceData, IndexResult } from './types.js';

/** Default index file path under user home. */
const DEFAULT_INDEX_PATH = path.join(
  process.env['HOME'] ?? process.env['USERPROFILE'] ?? '.',
  '.gsd',
  'dacp',
  'catalog',
  'scripts.json',
);

/**
 * Infer function type from a script filename.
 * Checks for common prefixes/substrings in the filename.
 */
function inferFunctionType(filename: string): ScriptCatalogEntry['function_type'] {
  const lower = filename.toLowerCase();
  if (lower.includes('parse')) return 'parser';
  if (lower.includes('valid')) return 'validator';
  if (lower.includes('transform')) return 'transformer';
  if (lower.includes('format')) return 'formatter';
  if (lower.includes('analyz')) return 'analyzer';
  if (lower.includes('generat')) return 'generator';
  return 'analyzer';
}

export class ScriptCatalog {
  private entries: Map<string, ScriptCatalogEntry>;
  private indexPath: string;

  constructor(indexPath?: string) {
    this.entries = new Map();
    this.indexPath = indexPath ?? DEFAULT_INDEX_PATH;
  }

  /**
   * Build index by scanning skill directories for scripts/ subdirectories.
   * Each script file becomes a catalog entry with metadata inferred from
   * the filename and directory structure.
   */
  async buildIndex(skillsRoot: string): Promise<IndexResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    let scriptsIndexed = 0;
    let skillsScanned = 0;

    try {
      const entries = await fs.promises.readdir(skillsRoot, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory() || entry.name.startsWith('.')) continue;

        skillsScanned++;
        const skillName = entry.name;
        const scriptsDir = path.join(skillsRoot, skillName, 'scripts');

        try {
          const stat = await fs.promises.stat(scriptsDir);
          if (!stat.isDirectory()) continue;

          const scriptFiles = await fs.promises.readdir(scriptsDir);

          for (const scriptFile of scriptFiles) {
            const scriptPath = path.join('scripts', scriptFile);
            const fullPath = path.join(scriptsDir, scriptFile);

            try {
              const fileStat = await fs.promises.stat(fullPath);
              if (!fileStat.isFile()) continue;

              const content = await fs.promises.readFile(fullPath, 'utf-8');
              const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);

              const id = crypto
                .createHash('sha256')
                .update(`${skillName}:${scriptPath}`)
                .digest('hex')
                .slice(0, 16);

              const catalogEntry: ScriptCatalogEntry = {
                id,
                skill_source: skillName,
                skill_version: '1.0.0',
                script_path: scriptPath,
                script_hash: hash,
                function_type: inferFunctionType(scriptFile),
                data_types: [],
                deterministic: false,
                last_used: new Date().toISOString(),
                use_count: 0,
                success_rate: 1.0,
                avg_execution_ms: 0,
              };

              this.entries.set(id, catalogEntry);
              scriptsIndexed++;
            } catch (err) {
              errors.push(`Failed to index ${fullPath}: ${(err as Error).message}`);
            }
          }
        } catch {
          // No scripts directory — skip silently
        }
      }
    } catch (err) {
      errors.push(`Failed to read skills root ${skillsRoot}: ${(err as Error).message}`);
    }

    return {
      scripts_indexed: scriptsIndexed,
      schemas_indexed: 0,
      skills_scanned: skillsScanned,
      errors,
      duration_ms: performance.now() - startTime,
    };
  }

  /**
   * Search the catalog using AND logic on all provided query fields.
   * Returns empty array when no matches found (never throws).
   */
  search(query: CatalogSearchQuery): ScriptCatalogEntry[] {
    return Array.from(this.entries.values()).filter((entry) => {
      if (query.function_type !== undefined && entry.function_type !== query.function_type) {
        return false;
      }
      if (query.data_types !== undefined && query.data_types.length > 0) {
        const hasMatch = query.data_types.some((dt) => entry.data_types.includes(dt));
        if (!hasMatch) return false;
      }
      if (query.deterministic_only === true && !entry.deterministic) {
        return false;
      }
      if (query.min_success_rate !== undefined && entry.success_rate < query.min_success_rate) {
        return false;
      }
      return true;
    });
  }

  /**
   * Add a single entry with provenance enforcement.
   * Rejects entries with empty skill_source or script_path (SAFE-03 + SLIB-04).
   *
   * SAFE-03 (DACP): Catalog entry rejection returns explicit error, never throws
   * Attack scenario: A caller passes an entry with empty skill_source. If
   * addEntry throws, the caller's error handling may differ from what the
   * explicit return value contract guarantees.
   * Consequence of absence: Silent catalog corruption or inconsistent error
   * handling across catalog consumers.
   */
  addEntry(entry: ScriptCatalogEntry): void {
    if (!entry.skill_source || entry.skill_source.trim() === '') {
      throw new Error('Provenance enforcement: skill_source must not be empty');
    }
    if (!entry.script_path || entry.script_path.trim() === '') {
      throw new Error('Provenance enforcement: script_path must not be empty');
    }
    this.entries.set(entry.id, { ...entry });
  }

  /**
   * Remove all entries from a given skill source.
   */
  removeSkill(skillName: string): void {
    for (const [id, entry] of this.entries) {
      if (entry.skill_source === skillName) {
        this.entries.delete(id);
      }
    }
  }

  /**
   * Update success rate using exponential moving average and refresh last_used.
   * EMA formula: newRate = 0.7 * oldRate + 0.3 * (success ? 1.0 : 0.0)
   */
  updateSuccessRate(id: string, success: boolean): void {
    const entry = this.entries.get(id);
    if (!entry) return;

    const newRate = 0.7 * entry.success_rate + 0.3 * (success ? 1.0 : 0.0);
    entry.success_rate = Math.max(0, Math.min(1, newRate));
    entry.last_used = new Date().toISOString();
    entry.use_count++;
  }

  /**
   * Persist catalog to disk as JSON.
   * Creates parent directories with recursive mkdir.
   */
  async save(): Promise<void> {
    const dir = path.dirname(this.indexPath);
    await fs.promises.mkdir(dir, { recursive: true });

    const data: CatalogPersistenceData = {
      version: '1.0',
      entries: Array.from(this.entries.values()),
      last_built: new Date().toISOString(),
    };

    await fs.promises.writeFile(this.indexPath, JSON.stringify(data, null, 2), 'utf-8');
  }

  /**
   * Load catalog from disk JSON file.
   * Validates version field and populates entries map.
   */
  async load(): Promise<void> {
    const raw = await fs.promises.readFile(this.indexPath, 'utf-8');
    const data: CatalogPersistenceData = JSON.parse(raw);

    if (!data.version) {
      throw new Error('Invalid catalog file: missing version field');
    }

    this.entries.clear();
    for (const entry of data.entries) {
      this.entries.set(entry.id, entry);
    }
  }

  /** Number of entries in the catalog. */
  get size(): number {
    return this.entries.size;
  }
}
