/**
 * RegistryAdapter interface — the single contract all ecosystem adapters implement.
 */

import type { DependencyRecord, RegistryHealth } from './types.js';
import type { EgressContext } from '../security/egress-context.js';

export interface RegistryAdapter {
  /**
   * Fetch registry health for a single dependency. Never throws on 404.
   *
   * Role: NOT an egress caller. This is the interface, not a concrete
   * adapter. Wired adapters (v1.49.809+: npm) accept the optional `ctx` and
   * call `ensureEgressAllowed` BEFORE their network call so denials
   * propagate (per Lesson #10427); unwired adapters ignore `ctx`.
   */
  fetchHealth(dep: DependencyRecord, ctx?: EgressContext): Promise<RegistryHealth>;
}
