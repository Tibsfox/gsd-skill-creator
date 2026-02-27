/**
 * DACP Interpreter type definitions.
 *
 * Defines types specific to the interpreter module: loaded bundles,
 * script metadata, execution context, and interpreter configuration.
 * These types are consumed by the validator, loader, and context builder.
 *
 * @module interpreter/types
 */

import type { BundleManifest, FidelityLevel } from '../dacp/types.js';

// ============================================================================
// Bundle Script
// ============================================================================

/** A loaded script with its metadata and content available for review. */
export interface BundleScript {
  /** Filename (e.g., "process.sh") */
  name: string;

  /** Absolute path on filesystem */
  path: string;

  /** From CodeManifestEntry.purpose */
  purpose: string;

  /** From CodeManifestEntry.language */
  language: string;

  /** From CodeManifestEntry.source_skill (provenance) */
  sourceSkill: string;

  /** From CodeManifestEntry.deterministic */
  deterministic: boolean;

  /** Full script content loaded for review (NOT execution) */
  content: string;

  /** Script size in bytes for limit enforcement */
  sizeBytes: number;
}

// ============================================================================
// Loaded Bundle
// ============================================================================

/** Complete loaded bundle with all components accessible as typed objects. */
export interface LoadedBundle {
  /** Absolute path to bundle directory */
  bundlePath: string;

  /** Parsed manifest */
  manifest: BundleManifest;

  /** Raw markdown from intent.md */
  intent: string;

  /** Parsed JSON payloads keyed by filename */
  data: Record<string, unknown>;

  /** Parsed schema definitions keyed by filename */
  schemas: Record<string, unknown>;

  /** All loaded scripts with content */
  scripts: BundleScript[];

  /** Convenience: manifest.fidelity_level */
  fidelityLevel: FidelityLevel;
}

// ============================================================================
// Execution Context
// ============================================================================

/** Structured execution context provided to the receiving agent. */
export interface ExecutionContext {
  /** From manifest.intent_summary */
  intentSummary: string;

  /** Full intent.md content */
  intentMarkdown: string;

  /** Parsed data payloads */
  typedData: Record<string, unknown>;

  /** Scripts staged for review (NOT execution) */
  scriptReferences: Array<{
    name: string;
    purpose: string;
    deterministic: boolean;
    sourceSkill: string;
    content: string;
  }>;

  /** Bundle fidelity level */
  fidelityLevel: FidelityLevel;

  /** Source agent identifier */
  sourceAgent: string;

  /** Target agent identifier */
  targetAgent: string;

  /** Why bundle was composed this way (human-readable) */
  assemblyRationale: string;
}

// ============================================================================
// Interpreter Config
// ============================================================================

/** Configuration for the interpreter. */
export interface InterpreterConfig {
  /** Default: true -- reject scripts without provenance */
  requireProvenance: boolean;

  /** Default: 100 * 1024 (100KB total) */
  maxBundleSizeBytes: number;

  /** Default: 10 * 1024 (10KB per script) */
  maxScriptSizeBytes: number;

  /** Default: 50 * 1024 (50KB data total) */
  maxDataSizeBytes: number;

  /** Default: true -- fail if contents don't match claimed level */
  strictFidelityCheck: boolean;
}

/** Default interpreter configuration. */
export const DEFAULT_INTERPRETER_CONFIG: InterpreterConfig = {
  requireProvenance: true,
  maxBundleSizeBytes: 100 * 1024,
  maxScriptSizeBytes: 10 * 1024,
  maxDataSizeBytes: 50 * 1024,
  strictFidelityCheck: true,
};
