/**
 * JSON activity file loader with validation.
 *
 * Parses JSON arrays of activity records and validates each element
 * against PackActivitySchema from types.ts. Returns discriminated
 * union results with per-element error messages.
 *
 * @module activity-loader
 */

import { PackActivitySchema } from './types.js';
import type { PackActivity } from './types.js';
import { readFile } from 'node:fs/promises';

// ============================================================================
// Result type
// ============================================================================

/**
 * Discriminated union result for activity loading.
 * On success, contains validated PackActivity array.
 * On failure, contains human-readable error messages.
 */
export type ActivitiesResult =
  | { success: true; activities: PackActivity[] }
  | { success: false; errors: string[] };

// ============================================================================
// loadActivities
// ============================================================================

/**
 * Parse a JSON string containing an array of activity records.
 *
 * Validates each element against PackActivitySchema. If any element
 * fails validation, the entire result is a failure containing all
 * validation errors with array indices.
 *
 * @param jsonString - Raw JSON content (expected to be an array)
 * @returns Validated PackActivity array or array of error messages
 */
export async function loadActivities(jsonString: string): Promise<ActivitiesResult> {
  // Parse JSON
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonString);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, errors: [`JSON parse error: ${message}`] };
  }

  // Expect an array
  if (!Array.isArray(parsed)) {
    return {
      success: false,
      errors: ['Expected a JSON array of activities, got ' + typeof parsed],
    };
  }

  // Validate each element
  const activities: PackActivity[] = [];
  const errors: string[] = [];

  for (let i = 0; i < parsed.length; i++) {
    const result = PackActivitySchema.safeParse(parsed[i]);
    if (result.success) {
      activities.push(result.data);
    } else {
      for (const issue of result.error.issues) {
        const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
        errors.push(`activities[${i}].${path}: ${issue.message}`);
      }
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, activities };
}

// ============================================================================
// loadActivitiesFile
// ============================================================================

/**
 * Read a JSON activities file from disk and parse/validate its contents.
 *
 * @param filePath - Absolute or relative path to the activities JSON file
 * @returns Validated PackActivity array or array of error messages
 */
export async function loadActivitiesFile(filePath: string): Promise<ActivitiesResult> {
  let content: string;
  try {
    content = await readFile(filePath, 'utf-8');
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, errors: [`Failed to read ${filePath}: ${message}`] };
  }

  return loadActivities(content);
}
