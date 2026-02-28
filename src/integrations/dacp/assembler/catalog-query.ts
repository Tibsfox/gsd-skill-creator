/**
 * DACP catalog query engine.
 *
 * Searches the skill library's script catalog and schema library for
 * matching entries based on function type, data type, and handoff context.
 * The CatalogQuery is injectable (takes arrays of entries) so it can be
 * tested without filesystem reads.
 *
 * @module dacp/assembler/catalog-query
 */

import type { ScriptCatalogEntry, SchemaLibraryEntry } from '../types.js';

/**
 * CatalogQuery searches for matching scripts and schemas from catalog data.
 *
 * Constructor takes pre-loaded catalog arrays for testability. No filesystem
 * reads happen inside this class.
 */
export class CatalogQuery {
  private readonly scripts: ScriptCatalogEntry[];
  private readonly schemas: SchemaLibraryEntry[];

  constructor(scripts: ScriptCatalogEntry[], schemas: SchemaLibraryEntry[]) {
    this.scripts = scripts;
    this.schemas = schemas;
  }

  /**
   * Find scripts matching a function type with at least one data type overlap.
   *
   * Results are sorted by:
   * 1. success_rate descending (most reliable first)
   * 2. last_used recency descending (most recently used first)
   *
   * @param functionType - The script function type to match (parser, validator, etc.)
   * @param dataTypes - Data types the script must handle (at least one overlap required)
   * @returns Matching script catalog entries, sorted by relevance
   */
  findScripts(functionType: string, dataTypes: string[]): ScriptCatalogEntry[] {
    const matches = this.scripts.filter((script) => {
      if (script.function_type !== functionType) return false;
      return script.data_types.some((dt) => dataTypes.includes(dt));
    });

    return matches.sort((a, b) => {
      // Primary: success_rate descending
      if (b.success_rate !== a.success_rate) {
        return b.success_rate - a.success_rate;
      }
      // Secondary: last_used recency descending
      return b.last_used.localeCompare(a.last_used);
    });
  }

  /**
   * Find schemas matching a data type.
   *
   * Results are sorted by version descending (newest first).
   *
   * @param dataType - The data type to search for
   * @returns Matching schema library entries, sorted by version
   */
  findSchemas(dataType: string): SchemaLibraryEntry[] {
    const matches = this.schemas.filter(
      (schema) => schema.data_type === dataType,
    );

    return matches.sort((a, b) => b.version.localeCompare(a.version));
  }

  /**
   * Count unique skill sources across matching scripts and schemas.
   *
   * Searches scripts by handoff type (as function_type) and data types,
   * plus schemas by each data type. Returns the count of unique skill_source
   * / source_skill values across all matches.
   *
   * This feeds into FidelityDecision.available_skills.
   *
   * @param handoffType - The handoff type (maps to function type search)
   * @param dataTypes - Data types to search for
   * @returns Count of unique skill sources
   */
  countAvailableSkills(handoffType: string, dataTypes: string[]): number {
    const skillSources = new Set<string>();

    // Search scripts across all standard function types for the given data types
    for (const script of this.scripts) {
      if (script.data_types.some((dt) => dataTypes.includes(dt))) {
        skillSources.add(script.skill_source);
      }
    }

    // Search schemas for each data type
    for (const dataType of dataTypes) {
      for (const schema of this.schemas) {
        if (schema.data_type === dataType) {
          skillSources.add(schema.source_skill);
        }
      }
    }

    return skillSources.size;
  }
}
