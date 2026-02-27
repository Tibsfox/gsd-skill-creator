/**
 * API surface mapper: catalogs shared interface, variant extensions,
 * and plotter API from analyzed class hierarchy.
 *
 * Phase 405 Plan 01 — Track A of the learn engine.
 */

import type { AnalyzedClassNode, AnalyzedModuleNode } from './structure-analyzer.js';

// --- API surface types ---

export interface AnalyzedAPIMethod {
  name: string;
  signature: string;
  description: string;
  examples: string[];
  returnDescription: string;
}

export interface APIProperty {
  name: string;
  type: string;
  description: string;
  readOnly: boolean;
}

export interface APIParameter {
  name: string;
  type: string;
  default: string | null;
  description: string;
}

export interface APISurface {
  sharedInterface: {
    methods: AnalyzedAPIMethod[];
    properties: APIProperty[];
  };
  variantExtensions: {
    className: string;
    additionalMethods: AnalyzedAPIMethod[];
    additionalParameters: APIParameter[];
    uniqueFeatures: string[];
  }[];
  plotterAPI: {
    functions: AnalyzedAPIMethod[];
  };
}

/** Map the public API surface from analyzed class hierarchy and module data. */
export function mapAPISurface(
  _classes: AnalyzedClassNode[],
  _modules: AnalyzedModuleNode[],
): APISurface {
  // Stub — will be implemented in Task 2 (GREEN phase)
  throw new Error('Not implemented');
}
