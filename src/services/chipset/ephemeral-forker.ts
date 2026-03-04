/**
 * Ephemeral forker — fork/execute/merge for parallel muse consultation.
 *
 * All operations are synchronous pure functions (no I/O).
 */

import type { MuseId } from './muse-schema-validator.js';
import type { MuseRegistry, LoadedMuse } from './muse-loader.js';
import type { AugmentedContext, ForkRequest, MusePerspective, MergedResult, MergeStrategy } from './muse-forking.js';

export class EphemeralForker {
  // Stub
  constructor(private registry: MuseRegistry) {}

  fork(_request: ForkRequest): Map<MuseId, AugmentedContext> {
    throw new Error('Not implemented');
  }

  execute(_museId: MuseId, _augmented: AugmentedContext): MusePerspective {
    throw new Error('Not implemented');
  }

  merge(_perspectives: MusePerspective[], _strategy: MergeStrategy): MergedResult {
    throw new Error('Not implemented');
  }

  consult(_request: ForkRequest): MergedResult {
    throw new Error('Not implemented');
  }
}
