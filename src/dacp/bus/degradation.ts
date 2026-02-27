/**
 * Graceful degradation utilities for DACP bus integration.
 *
 * Provides defensive helper functions that DACP-aware agents use
 * to check for bundle companions. Both functions are fully defensive:
 * they catch all filesystem errors and return null/false rather than
 * throwing. This ensures agents never crash if DACP is partially
 * installed, bundles are missing, or the filesystem is in an
 * unexpected state.
 */

import { stat } from 'node:fs/promises';

// ============================================================================
// tryLoadBundle
// ============================================================================

/**
 * Attempt to locate a bundle companion for a .msg file.
 *
 * Derives the expected bundle path by replacing the .msg suffix with
 * .bundle and checking if that directory exists. Never throws --
 * returns null on any error.
 *
 * @param msgPath - Absolute path to the .msg file
 * @returns Absolute path to the .bundle/ directory, or null if unavailable
 */
export async function tryLoadBundle(msgPath: string): Promise<string | null> {
  try {
    const bundlePath = msgPath.replace(/\.msg$/, '.bundle');

    const st = await stat(bundlePath);
    if (st.isDirectory()) {
      return bundlePath;
    }

    // Exists but is not a directory (malformed)
    return null;
  } catch {
    // File/directory does not exist or is inaccessible
    return null;
  }
}

// ============================================================================
// isBundleAvailable
// ============================================================================

/**
 * Check if a .msg file has a bundle companion available.
 *
 * Convenience wrapper around tryLoadBundle for conditional logic.
 * Never throws -- returns false on any error.
 *
 * @param msgPath - Absolute path to the .msg file
 * @returns true if a companion .bundle/ directory exists and is valid
 */
export async function isBundleAvailable(msgPath: string): Promise<boolean> {
  const result = await tryLoadBundle(msgPath);
  return result !== null;
}
