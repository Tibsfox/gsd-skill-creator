/**
 * DACP Bundle loader.
 *
 * Loads validated bundles from the filesystem into typed LoadedBundle
 * structures with parsed manifest, data payloads, schema objects,
 * and script metadata.
 *
 * Enforces:
 * - Bundle completeness (.complete marker must exist)
 * - Script provenance (SAFE-06: empty source_skill causes rejection)
 *
 * @module interpreter/loader
 */

import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { BundleManifestSchema, type BundleManifest } from '../dacp/types.js';
import {
  DEFAULT_INTERPRETER_CONFIG,
  type InterpreterConfig,
  type LoadedBundle,
  type BundleScript,
} from './types.js';

// ============================================================================
// Main Loader
// ============================================================================

/**
 * Load a DACP bundle from the filesystem.
 *
 * @param bundlePath - Path to the bundle directory
 * @param config - Optional interpreter configuration overrides
 * @returns Loaded bundle with all components as typed objects
 * @throws Error if bundle is missing, incomplete, or has provenance issues
 */
export function loadBundle(
  bundlePath: string,
  config?: Partial<InterpreterConfig>,
): LoadedBundle {
  const cfg = { ...DEFAULT_INTERPRETER_CONFIG, ...config };
  const resolvedPath = resolve(bundlePath);

  // --------------------------------------------------------------------------
  // Pre-checks
  // --------------------------------------------------------------------------
  if (!existsSync(resolvedPath)) {
    throw new Error(`Bundle not found: ${resolvedPath}`);
  }

  if (!existsSync(join(resolvedPath, '.complete'))) {
    throw new Error(`Bundle incomplete: ${resolvedPath} is missing .complete marker`);
  }

  // --------------------------------------------------------------------------
  // Load manifest
  // --------------------------------------------------------------------------
  const manifestPath = join(resolvedPath, 'manifest.json');
  if (!existsSync(manifestPath)) {
    throw new Error(`Bundle missing manifest: ${resolvedPath}/manifest.json not found`);
  }

  const rawManifest = readFileSync(manifestPath, 'utf-8');
  let manifest: BundleManifest;
  try {
    const parsed = JSON.parse(rawManifest);
    const result = BundleManifestSchema.safeParse(parsed);
    if (!result.success) {
      throw new Error(`Invalid manifest: ${result.error.issues.map(i => i.message).join(', ')}`);
    }
    manifest = result.data;
  } catch (err) {
    if (err instanceof SyntaxError) {
      throw new Error(`Malformed manifest JSON: ${err.message}`);
    }
    throw err;
  }

  // --------------------------------------------------------------------------
  // Load intent
  // --------------------------------------------------------------------------
  const intentPath = join(resolvedPath, 'intent.md');
  const intent = existsSync(intentPath) ? readFileSync(intentPath, 'utf-8') : '';

  // --------------------------------------------------------------------------
  // Load data payloads
  // --------------------------------------------------------------------------
  const data: Record<string, unknown> = {};
  const schemas: Record<string, unknown> = {};

  for (const [filename, entry] of Object.entries(manifest.data_manifest)) {
    const filePath = join(resolvedPath, 'data', filename);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      data[filename] = JSON.parse(content);
    }

    // Load referenced schema
    if (entry.schema_ref) {
      const schemaPath = join(resolvedPath, 'data', entry.schema_ref);
      if (existsSync(schemaPath) && !(entry.schema_ref in schemas)) {
        const schemaContent = readFileSync(schemaPath, 'utf-8');
        schemas[entry.schema_ref] = JSON.parse(schemaContent);
      }
    }
  }

  // --------------------------------------------------------------------------
  // Load scripts (SAFE-06 enforced)
  // --------------------------------------------------------------------------
  const scripts: BundleScript[] = [];

  for (const [filename, entry] of Object.entries(manifest.code_manifest)) {
    // Provenance enforcement
    if (cfg.requireProvenance && (!entry.source_skill || entry.source_skill.trim() === '')) {
      throw new Error(
        `Script ${filename} rejected: missing provenance (source skill required)`,
      );
    }

    const scriptPath = join(resolvedPath, 'code', filename);
    if (existsSync(scriptPath)) {
      const content = readFileSync(scriptPath, 'utf-8');
      const sizeBytes = Buffer.byteLength(content, 'utf-8');

      scripts.push({
        name: filename,
        path: resolve(scriptPath),
        purpose: entry.purpose,
        language: entry.language,
        sourceSkill: entry.source_skill,
        deterministic: entry.deterministic,
        content,
        sizeBytes,
      });
    }
  }

  // --------------------------------------------------------------------------
  // Return LoadedBundle
  // --------------------------------------------------------------------------
  return {
    bundlePath: resolvedPath,
    manifest,
    intent,
    data,
    schemas,
    scripts,
    fidelityLevel: manifest.fidelity_level,
  };
}
