/**
 * Config.json parser.
 *
 * Parses GSD config files into typed GsdConfig objects with Zod
 * defaults filling missing fields. Handles both the simplified flat
 * format (e.g., this project's config.json with top-level commit_docs)
 * and the full template format (nested planning.commit_docs, object
 * parallelization, gates, safety, git sections).
 *
 * Returns null for empty, invalid, or non-object JSON input.
 */

import { GsdConfigSchema } from './types.js';
import type { GsdConfig } from './types.js';

/**
 * Parse a config.json string into a typed GsdConfig.
 *
 * Normalization before Zod validation:
 * 1. If `planning.commit_docs` exists and top-level `commit_docs` does NOT,
 *    hoists `planning.commit_docs` to top level.
 * 2. If `planning.search_gitignored` exists, hoists similarly.
 * 3. Top-level values always take precedence over nested `planning.*` values.
 *
 * Zod handles parallelization's dual format (boolean | object) via z.union().
 *
 * @param content - Raw config.json file content
 * @returns Parsed config with defaults applied, or null if invalid
 */
export function parseConfig(content: string): GsdConfig | null {
  if (!content || !content.trim()) {
    return null;
  }

  let raw: unknown;
  try {
    raw = JSON.parse(content);
  } catch {
    return null;
  }

  // Must be a plain object (not array, string, number, null)
  if (raw === null || typeof raw !== 'object' || Array.isArray(raw)) {
    return null;
  }

  const obj = raw as Record<string, unknown>;

  // Normalize: hoist planning.commit_docs to top level if not already set
  normalizeFromPlanning(obj, 'commit_docs');
  normalizeFromPlanning(obj, 'search_gitignored');

  // Validate with Zod (defaults fill missing fields)
  const result = GsdConfigSchema.safeParse(obj);
  if (!result.success) {
    return null;
  }

  return result.data;
}

/**
 * Hoist a field from `planning.*` to top level if not already present.
 *
 * Mutates the input object. Top-level values always take precedence.
 */
function normalizeFromPlanning(obj: Record<string, unknown>, field: string): void {
  const planning = obj.planning as Record<string, unknown> | undefined;
  if (planning && typeof planning === 'object' && field in planning) {
    if (!(field in obj)) {
      obj[field] = planning[field];
    }
  }
}
