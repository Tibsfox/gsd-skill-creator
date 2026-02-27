/**
 * Structure analyzer: parses Python source files to map class hierarchy,
 * method signatures, module dependencies, and docstrings.
 *
 * Phase 405 Plan 01 — Track A of the learn engine.
 */

import type { RepoManifest } from '../../types.js';

// --- Rich analysis types (extend the simpler types.ts shapes) ---

export interface ParameterInfo {
  name: string;
  type: string | null;
  default: string | null;
  isRequired: boolean;
}

export interface MethodInfo {
  name: string;
  parameters: ParameterInfo[];
  returnType: string | null;
  docstring: string | null;
  isPublic: boolean;
  isOverride: boolean;
}

export interface ImportInfo {
  module: string;
  names: string[];
  isRelative: boolean;
}

export interface AnalyzedClassNode {
  name: string;
  module: string;
  bases: string[];
  docstring: string | null;
  methods: MethodInfo[];
  isAbstract: boolean;
  isPublic: boolean;
}

export interface AnalyzedModuleNode {
  path: string;
  classes: string[];
  functions: string[];
  imports: ImportInfo[];
  linesOfCode: number;
}

export interface AnalyzeResult {
  classes: AnalyzedClassNode[];
  modules: AnalyzedModuleNode[];
}

/** Analyze Python source files to extract class hierarchy and module structure. */
export function analyzeStructure(
  _sources: { path: string; content: string }[],
  _manifest: RepoManifest,
): AnalyzeResult {
  // Stub — will be implemented in Task 2 (GREEN phase)
  throw new Error('Not implemented');
}
