/**
 * Dependency detection for Aminet .readme Requires: field entries.
 *
 * Classifies requirements into 5 types (package, os_version, hardware,
 * library, unknown) and cross-references package dependencies against
 * mirror state for satisfaction checking.
 *
 * @module
 */

import type { Dependency, DependencyType, MirrorState } from './types.js';
import { getEntry } from './mirror-state.js';

/**
 * Classify a raw dependency string from the .readme Requires: field.
 *
 * @param raw - Raw string from the Requires: field
 * @returns Classified type and fullPath (for package type only)
 */
export function classifyDependency(_raw: string): { type: DependencyType; fullPath: string | null } {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Check whether a classified dependency is satisfied.
 *
 * Non-package types are always satisfied (informational only).
 * Package types are satisfied only if installed in mirror state.
 *
 * @param dep - Classified dependency with type and fullPath
 * @param state - Current mirror state
 * @returns Whether the dependency is satisfied
 */
export function checkDependencySatisfied(
  _dep: { type: DependencyType; fullPath: string | null },
  _state: MirrorState,
): boolean {
  // TODO: implement
  throw new Error('Not implemented');
}

/**
 * Detect and classify all dependencies from a requires array.
 *
 * For each raw string: classifies the type, checks satisfaction against
 * mirror state, and builds a full Dependency object.
 *
 * @param requires - Array of raw requirement strings from .readme
 * @param state - Current mirror state
 * @returns Array of classified Dependency objects
 */
export function detectDependencies(_requires: string[], _state: MirrorState): Dependency[] {
  // TODO: implement
  throw new Error('Not implemented');
}
