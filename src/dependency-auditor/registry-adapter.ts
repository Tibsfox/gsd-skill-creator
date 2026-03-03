/**
 * RegistryAdapter interface — the single contract all ecosystem adapters implement.
 */

import type { DependencyRecord, RegistryHealth } from './types.js';

export interface RegistryAdapter {
  /** Fetch registry health for a single dependency. Never throws on 404. */
  fetchHealth(dep: DependencyRecord): Promise<RegistryHealth>;
}
