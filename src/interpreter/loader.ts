/**
 * DACP Bundle loader.
 *
 * Loads validated bundles from filesystem into typed LoadedBundle
 * structures with parsed manifest, data payloads, schema objects,
 * and script metadata.
 *
 * @module interpreter/loader
 */

import type { InterpreterConfig } from './types.js';
import type { LoadedBundle } from './types.js';

/**
 * Load a DACP bundle from the filesystem.
 *
 * @param bundlePath - Absolute path to the bundle directory
 * @param config - Optional interpreter configuration overrides
 * @returns Loaded bundle with all components as typed objects
 * @throws Error if bundle is missing, incomplete, or has provenance issues
 */
export function loadBundle(
  _bundlePath: string,
  _config?: Partial<InterpreterConfig>,
): LoadedBundle {
  // Stub -- will be implemented in GREEN phase
  throw new Error('Not implemented');
}
