/**
 * Community chipset variant intake and staging.
 *
 * Validates and stages community-submitted chipset variant files. Validation
 * checks YAML structure and required top-level keys. Full schema validation
 * against the chipset schema conventions is deferred to the staging pipeline.
 *
 * INTEG-03: chipset variant staging for the cloud-ops crew.
 *
 * @module cloud-ops/staging/chipset-variants
 */

import { mkdir, writeFile, readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { existsSync } from 'node:fs';
import type { StagedVariantInfo } from './types.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Required top-level keys in a chipset variant YAML file. */
const REQUIRED_VARIANT_KEYS = ['name', 'description', 'skills', 'agents', 'teams'] as const;

/** Keys whose values must be arrays. */
const ARRAY_KEYS = ['skills', 'agents', 'teams'] as const;

/** Staging directory for chipset variants (relative to project root). */
const CHIPSET_VARIANTS_INBOX = '.planning/staging/inbox/chipset-variants';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/**
 * Validate the structural correctness of a chipset variant YAML file.
 *
 * Pure function (no I/O). Checks:
 * 1. Content is non-empty and contains at least one YAML key
 * 2. All required top-level keys are present (name, description, skills, agents, teams)
 * 3. skills, agents, and teams values begin array syntax (- item)
 * 4. Unbalanced braces/brackets are detected as structural errors
 *
 * NOTE: Full chipset schema validation (activation profiles, budget rules, etc.)
 * is deferred to the staging pipeline. This function validates the minimal
 * structure required for variant identification and listing.
 *
 * @param content - Raw YAML string content of the chipset variant file.
 * @returns Validation result with valid flag and errors array.
 */
export function validateChipsetVariant(content: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!content || content.trim().length === 0) {
    errors.push('Variant content is empty');
    return { valid: false, errors };
  }

  const lines = content.split('\n');

  // Check for at least one YAML key (not a comment, not empty)
  const yamlKeyPattern = /^\s*[\w-]+\s*:/;
  const hasAnyKey = lines.some(line => yamlKeyPattern.test(line) && !line.trimStart().startsWith('#'));
  if (!hasAnyKey) {
    errors.push('Variant file contains no YAML key-value pairs -- invalid YAML structure');
    return { valid: false, errors };
  }

  // Check for unbalanced braces/brackets
  const openBraces = (content.match(/\{/g) ?? []).length;
  const closeBraces = (content.match(/\}/g) ?? []).length;
  const openBrackets = (content.match(/\[/g) ?? []).length;
  const closeBrackets = (content.match(/\]/g) ?? []).length;

  if (openBraces !== closeBraces) {
    errors.push('Malformed YAML: unbalanced curly braces { }');
  }
  if (openBrackets !== closeBrackets) {
    errors.push('Malformed YAML: unbalanced square brackets [ ]');
  }

  // Check required top-level keys
  for (const key of REQUIRED_VARIANT_KEYS) {
    // Match "key:" or "key: value" at the start of a line (no leading spaces = top-level)
    const topLevelKeyPattern = new RegExp(`^${key}\\s*:`);
    const hasKey = lines.some(line => topLevelKeyPattern.test(line));
    if (!hasKey) {
      errors.push(`Missing required top-level key: '${key}'`);
    }
  }

  // Check that array keys are followed by list items (- item) or are empty arrays ([])
  // This is a heuristic: after "key:", the next non-empty line should start with "  -" or be "[]"
  for (const arrayKey of ARRAY_KEYS) {
    const keyLineIndex = lines.findIndex(line => new RegExp(`^${arrayKey}\\s*:`).test(line));
    if (keyLineIndex === -1) continue; // already caught above as missing key

    const keyLine = lines[keyLineIndex];
    const inlineValue = keyLine.split(':')[1]?.trim() ?? '';

    if (inlineValue === '[]') {
      // Empty array inline -- valid
      continue;
    }

    if (inlineValue.length > 0 && inlineValue !== '') {
      // Non-empty inline value that is not [] -- invalid for an array key
      errors.push(`Key '${arrayKey}' must be a YAML list (use '- item' syntax or '[]'), got inline value: ${inlineValue}`);
      continue;
    }

    // Check that at least the first non-empty line after the key starts with "  -"
    let foundListItem = false;
    for (let i = keyLineIndex + 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      if (/^\s+-\s/.test(line)) {
        foundListItem = true;
        break;
      }
      // Non-list, non-empty line means the array block ended without items
      break;
    }

    if (!foundListItem) {
      errors.push(`Key '${arrayKey}' must be a YAML list with at least one item (use '- item' syntax)`);
    }
  }

  return { valid: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Staging
// ---------------------------------------------------------------------------

/** Result of staging a chipset variant. */
export interface StageChipsetVariantResult {
  /** Absolute path to the staged chipset.yaml file. */
  variantPath: string;
  /** Absolute path to the companion metadata file. */
  metadataPath: string;
}

/**
 * Stage a community chipset variant into the staging inbox.
 *
 * Creates `.planning/staging/inbox/chipset-variants/{name}/` on first use,
 * writes `chipset.yaml` and a companion `.meta.json` with source, timestamp,
 * and the validation result.
 *
 * @param options.basePath - Project root (parent of .planning/)
 * @param options.name - Variant name (used as the subdirectory name)
 * @param options.content - Raw YAML content of the chipset variant
 * @param options.source - Origin of the submission
 * @returns Paths to both the variant file and metadata file
 */
export async function stageChipsetVariant(options: {
  basePath: string;
  name: string;
  content: string;
  source: string;
}): Promise<StageChipsetVariantResult> {
  const { basePath, name, content, source } = options;

  // Validate variant structure
  const validation = validateChipsetVariant(content);

  // Create variant-specific subdirectory (idempotent)
  const variantDir = join(basePath, CHIPSET_VARIANTS_INBOX, name);
  await mkdir(variantDir, { recursive: true });

  // File paths
  const variantPath = join(variantDir, 'chipset.yaml');
  const metadataPath = join(variantDir, 'chipset.yaml.meta.json');

  // Build metadata
  const metadata = {
    submitted_at: new Date().toISOString(),
    source,
    status: 'inbox' as const,
    variantName: name,
    validated: validation.valid,
    validationErrors: validation.errors,
  };

  // Write variant and metadata in parallel
  await Promise.all([
    writeFile(variantPath, content, 'utf-8'),
    writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8'),
  ]);

  return { variantPath, metadataPath };
}

/**
 * List all staged chipset variants in the staging inbox.
 *
 * Scans `.planning/staging/inbox/chipset-variants/` and returns summary
 * information for each variant directory that contains a `chipset.yaml` file.
 * Returns an empty array if the directory does not exist.
 *
 * @param basePath - Project root (parent of .planning/)
 * @returns Array of staged variant info objects, sorted by name.
 */
export async function listStagedVariants(basePath: string): Promise<StagedVariantInfo[]> {
  const inboxDir = join(basePath, CHIPSET_VARIANTS_INBOX);

  // Return empty array if the directory has not been created yet
  if (!existsSync(inboxDir)) {
    return [];
  }

  let entries: string[];
  try {
    entries = await readdir(inboxDir);
  } catch {
    return [];
  }

  const results: StagedVariantInfo[] = [];

  for (const entry of entries) {
    const variantDir = join(inboxDir, entry);
    const chipsetPath = join(variantDir, 'chipset.yaml');
    const metadataPath = join(variantDir, 'chipset.yaml.meta.json');

    // Skip entries that are not chipset variant directories
    if (!existsSync(chipsetPath)) continue;

    let stagedAt = '';
    let validated = false;

    // Read metadata if it exists
    if (existsSync(metadataPath)) {
      try {
        const raw = await readFile(metadataPath, 'utf-8');
        const meta = JSON.parse(raw) as { submitted_at?: string; validated?: boolean };
        stagedAt = meta.submitted_at ?? '';
        validated = meta.validated ?? false;
      } catch {
        // Corrupted metadata -- include variant with defaults
        stagedAt = '';
        validated = false;
      }
    }

    results.push({
      name: entry,
      path: chipsetPath,
      stagedAt,
      validated,
    });
  }

  // Sort alphabetically by name for consistent ordering
  results.sort((a, b) => a.name.localeCompare(b.name));

  return results;
}
