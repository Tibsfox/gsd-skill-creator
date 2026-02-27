/**
 * DACP JSON Schema generator.
 *
 * Converts Zod schemas from types.ts to JSON Schema draft 2020-12 files.
 * This ensures a single source of truth: change the Zod schema, regenerate,
 * and all JSON Schema files stay in sync.
 *
 * Uses Zod v4's built-in toJSONSchema conversion (no extra dependencies).
 *
 * @module dacp/schema-generator
 */

import { toJSONSchema } from 'zod/v4/core';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { z } from 'zod';

import {
  BundleManifestSchema,
  HandoffOutcomeSchema,
  DriftScoreSchema,
  BundleTemplateSchema,
  FidelityDecisionSchema,
  ScriptCatalogEntrySchema,
  SchemaLibraryEntrySchema,
  HandoffPatternSchema,
  DACPStatusSchema,
} from './types.js';

// ============================================================================
// Schema Config
// ============================================================================

/** Configuration for a single JSON Schema generation target. */
export interface SchemaConfig {
  /** Human-readable name (e.g., 'bundle-manifest') */
  name: string;

  /** Reference to the Zod schema from types.ts */
  schema: z.ZodType;

  /** Output filename (e.g., 'bundle-manifest.schema.json') */
  filename: string;

  /** Human-readable description for the JSON Schema */
  description: string;
}

/**
 * Configuration for all 9 DACP JSON Schemas.
 * Maps each Zod schema to its output filename and metadata.
 */
export const SCHEMA_CONFIGS: SchemaConfig[] = [
  {
    name: 'bundle-manifest',
    schema: BundleManifestSchema,
    filename: 'bundle-manifest.schema.json',
    description: 'DACP Bundle Manifest: top-level descriptor for a DACP bundle directory containing intent, data, and code manifests with provenance and assembly rationale.',
  },
  {
    name: 'handoff-outcome',
    schema: HandoffOutcomeSchema,
    filename: 'handoff-outcome.schema.json',
    description: 'DACP Handoff Outcome: metrics from a receiving agent processing a bundle, including intent alignment, rework, and verification results.',
  },
  {
    name: 'drift-score',
    schema: DriftScoreSchema,
    filename: 'drift-score.schema.json',
    description: 'DACP Drift Score: composite score with component breakdown and fidelity adjustment recommendation.',
  },
  {
    name: 'bundle-template',
    schema: BundleTemplateSchema,
    filename: 'bundle-template.schema.json',
    description: 'DACP Bundle Template: reusable structure for common handoff types with default fidelity level and artifact references.',
  },
  {
    name: 'fidelity-decision',
    schema: FidelityDecisionSchema,
    filename: 'fidelity-decision.schema.json',
    description: 'DACP Fidelity Decision: input factors the fidelity model evaluates to determine the appropriate fidelity level for a handoff.',
  },
  {
    name: 'script-catalog-entry',
    schema: ScriptCatalogEntrySchema,
    filename: 'script-catalog-entry.schema.json',
    description: 'DACP Script Catalog Entry: indexes a skill script with provenance, function classification, and usage tracking.',
  },
  {
    name: 'schema-library-entry',
    schema: SchemaLibraryEntrySchema,
    filename: 'schema-library-entry.schema.json',
    description: 'DACP Schema Library Entry: indexes a JSON Schema with provenance and usage tracking for the schema library.',
  },
  {
    name: 'handoff-pattern',
    schema: HandoffPatternSchema,
    filename: 'handoff-pattern.schema.json',
    description: 'DACP Handoff Pattern: recurring handoff type with aggregated drift statistics and fidelity recommendations.',
  },
  {
    name: 'dacp-status',
    schema: DACPStatusSchema,
    filename: 'dacp-status.schema.json',
    description: 'DACP System Status: aggregate view of the entire DACP system state including handoff counts, drift scores, and fidelity distribution.',
  },
];

// ============================================================================
// Schema Generation
// ============================================================================

/**
 * Generate a single JSON Schema from a Zod schema with DACP metadata.
 *
 * Converts the Zod schema using Zod v4's built-in toJSONSchema, then
 * augments with $id, description, and ensures additionalProperties is false.
 */
export function generateSingleSchema(config: SchemaConfig): Record<string, unknown> {
  const raw = toJSONSchema(config.schema, {
    target: 'draft-2020-12',
  }) as Record<string, unknown>;

  // Augment with DACP-specific metadata
  const result: Record<string, unknown> = {
    $schema: 'https://json-schema.org/draft/2020-12/schema',
    $id: `https://gsd.tools/schemas/dacp/${config.filename}`,
    description: config.description,
    ...raw,
  };

  // Ensure additionalProperties: false at root
  result.additionalProperties = false;

  // Remove the ~standard property that Zod v4 adds (not part of JSON Schema)
  delete result['~standard'];

  return result;
}

/**
 * Generate all 9 DACP JSON Schema files into the specified directory.
 *
 * Creates the output directory if it doesn't exist, then writes each
 * schema as a pretty-printed JSON file.
 */
export function generateDACPSchemas(outputDir: string): void {
  mkdirSync(outputDir, { recursive: true });

  for (const config of SCHEMA_CONFIGS) {
    const schema = generateSingleSchema(config);
    const outputPath = join(outputDir, config.filename);
    writeFileSync(outputPath, JSON.stringify(schema, null, 2) + '\n', 'utf-8');
  }
}
