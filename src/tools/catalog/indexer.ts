/**
 * Unified skill indexer: scans skill directories in a single pass to
 * populate both ScriptCatalog and SchemaLibrary.
 *
 * Wraps the individual buildIndex methods while adding consolidated
 * error handling and timing. Skips hidden directories.
 *
 * @module catalog/indexer
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';
import type { ScriptCatalogEntry, SchemaLibraryEntry } from '../../dacp/types.js';
import type { IndexResult } from './types.js';
import type { ScriptCatalog } from './script-catalog.js';
import type { SchemaLibrary } from './schema-library.js';

/** Subdirectories to scan for schema files. */
const SCHEMA_DIRS = ['references', 'resources'];

/**
 * Infer function type from a script filename.
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

/**
 * Scan skill directories and populate both ScriptCatalog and SchemaLibrary
 * in a single pass.
 *
 * @param skillsRoot - Root directory containing skill subdirectories
 * @param catalog - ScriptCatalog instance to populate
 * @param library - SchemaLibrary instance to populate
 * @returns IndexResult with counts, errors, and duration
 */
export async function indexSkills(
  skillsRoot: string,
  catalog: ScriptCatalog,
  library: SchemaLibrary,
): Promise<IndexResult> {
  const startTime = performance.now();
  const errors: string[] = [];
  let scriptsIndexed = 0;
  let schemasIndexed = 0;
  let skillsScanned = 0;

  try {
    const topEntries = await fs.promises.readdir(skillsRoot, { withFileTypes: true });

    for (const topEntry of topEntries) {
      if (!topEntry.isDirectory() || topEntry.name.startsWith('.')) continue;

      skillsScanned++;
      const skillName = topEntry.name;
      const skillDir = path.join(skillsRoot, skillName);

      // --- Index scripts ---
      const scriptsDir = path.join(skillDir, 'scripts');
      try {
        const stat = await fs.promises.stat(scriptsDir);
        if (stat.isDirectory()) {
          const scriptFiles = await fs.promises.readdir(scriptsDir);

          for (const scriptFile of scriptFiles) {
            const fullPath = path.join(scriptsDir, scriptFile);
            try {
              const fileStat = await fs.promises.stat(fullPath);
              if (!fileStat.isFile()) continue;

              const content = await fs.promises.readFile(fullPath, 'utf-8');
              const hash = crypto.createHash('sha256').update(content).digest('hex').slice(0, 16);
              const scriptPath = path.join('scripts', scriptFile);

              const id = crypto
                .createHash('sha256')
                .update(`${skillName}:${scriptPath}`)
                .digest('hex')
                .slice(0, 16);

              const entry: ScriptCatalogEntry = {
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

              try {
                catalog.addEntry(entry);
                scriptsIndexed++;
              } catch (err) {
                errors.push(`Catalog addEntry failed for ${fullPath}: ${(err as Error).message}`);
              }
            } catch (err) {
              errors.push(`Failed to index script ${fullPath}: ${(err as Error).message}`);
            }
          }
        }
      } catch {
        // No scripts directory — skip silently
      }

      // --- Index schemas ---
      for (const schemaDir of SCHEMA_DIRS) {
        const schemaDirPath = path.join(skillDir, schemaDir);
        try {
          const stat = await fs.promises.stat(schemaDirPath);
          if (!stat.isDirectory()) continue;

          const files = await fs.promises.readdir(schemaDirPath);

          for (const file of files) {
            if (!file.endsWith('.schema.json')) continue;

            const fullPath = path.join(schemaDirPath, file);
            try {
              const fileStat = await fs.promises.stat(fullPath);
              if (!fileStat.isFile()) continue;

              const schemaRelPath = path.join(schemaDir, file);
              const dataType = file.replace('.schema.json', '').replace(/-schema$/, '');

              // Parse schema to extract field names
              let fields: string[] = [];
              try {
                const content = await fs.promises.readFile(fullPath, 'utf-8');
                const parsed = JSON.parse(content);
                if (parsed.properties && typeof parsed.properties === 'object') {
                  fields = Object.keys(parsed.properties);
                }
              } catch {
                // Failed to parse — use empty fields
              }

              const id = crypto
                .createHash('sha256')
                .update(`${skillName}:${schemaRelPath}`)
                .digest('hex')
                .slice(0, 16);

              const schemaEntry: SchemaLibraryEntry = {
                id,
                name: file.replace('.schema.json', ''),
                schema_path: fullPath,
                data_type: dataType,
                source_skill: skillName,
                version: '1.0.0',
                fields,
                last_updated: new Date().toISOString(),
                reference_count: 0,
              };

              try {
                library.addEntry(schemaEntry);
                schemasIndexed++;
              } catch (err) {
                errors.push(`Library addEntry failed for ${fullPath}: ${(err as Error).message}`);
              }
            } catch (err) {
              errors.push(`Failed to index schema ${fullPath}: ${(err as Error).message}`);
            }
          }
        } catch {
          // Schema dir does not exist — skip silently
        }
      }
    }
  } catch (err) {
    errors.push(`Failed to read skills root ${skillsRoot}: ${(err as Error).message}`);
  }

  return {
    scripts_indexed: scriptsIndexed,
    schemas_indexed: schemasIndexed,
    skills_scanned: skillsScanned,
    errors,
    duration_ms: performance.now() - startTime,
  };
}
