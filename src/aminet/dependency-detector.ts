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

/** Pattern for OS version requirements (e.g., "OS 3.0+", "AmigaOS 2.0") */
const OS_VERSION_RE = /^(?:amiga)?os\s*\d/i;

/** Pattern for hardware requirements (e.g., "68020+", "AGA", "RTG", "EGS", "CyberGraphX") */
const HARDWARE_RE = /^(?:680[234]0\+?|aga|rtg|egs|cgfx)/i;

/**
 * Classify a raw dependency string from the .readme Requires: field.
 *
 * Classification rules (in priority order):
 * 1. Contains `/` and ends with `.lha` -> package (with fullPath)
 * 2. Matches OS version pattern -> os_version
 * 3. Matches hardware pattern -> hardware
 * 4. Ends with `.library` -> library
 * 5. Otherwise -> unknown
 *
 * @param raw - Raw string from the Requires: field
 * @returns Classified type and fullPath (for package type only)
 */
export function classifyDependency(raw: string): { type: DependencyType; fullPath: string | null } {
  const trimmed = raw.trim();

  // Package: contains / and ends with .lha
  if (trimmed.includes('/') && trimmed.endsWith('.lha')) {
    return { type: 'package', fullPath: trimmed };
  }

  // OS version: "OS 3.0+", "AmigaOS 2.0", etc.
  if (OS_VERSION_RE.test(trimmed)) {
    return { type: 'os_version', fullPath: null };
  }

  // Hardware: 680x0 processors, AGA, RTG, EGS, CyberGraphX
  if (HARDWARE_RE.test(trimmed)) {
    return { type: 'hardware', fullPath: null };
  }

  // Library: ends with .library
  if (trimmed.endsWith('.library')) {
    return { type: 'library', fullPath: null };
  }

  // Unknown: anything else
  return { type: 'unknown', fullPath: null };
}

/**
 * Check whether a classified dependency is satisfied.
 *
 * Non-package types are always satisfied (informational only -- we report
 * them but do not block installation). Package types are satisfied only
 * when the referenced package exists in mirror state with status 'installed'.
 *
 * @param dep - Classified dependency with type and fullPath
 * @param state - Current mirror state
 * @returns Whether the dependency is satisfied
 */
export function checkDependencySatisfied(
  dep: { type: DependencyType; fullPath: string | null },
  state: MirrorState,
): boolean {
  // Non-package types are informational only -- always satisfied
  if (dep.type !== 'package') {
    return true;
  }

  // Defensive: package type should always have fullPath
  if (dep.fullPath === null) {
    return false;
  }

  // Cross-reference against mirror state
  const entry = getEntry(state, dep.fullPath);
  return entry !== undefined && entry.status === 'installed';
}

/**
 * Detect and classify all dependencies from a requires array.
 *
 * For each raw string: classifies the type, checks satisfaction against
 * mirror state, and builds a full Dependency object.
 *
 * @param requires - Array of raw requirement strings from .readme
 * @param state - Current mirror state
 * @returns Array of classified Dependency objects with satisfaction status
 */
export function detectDependencies(requires: string[], state: MirrorState): Dependency[] {
  return requires.map((raw) => {
    const classified = classifyDependency(raw);
    const satisfied = checkDependencySatisfied(classified, state);
    return {
      raw,
      type: classified.type,
      fullPath: classified.fullPath,
      satisfied,
    };
  });
}
