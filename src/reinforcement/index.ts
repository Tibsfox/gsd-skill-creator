/**
 * MA-6 Canonical Reinforcement Taxonomy — barrel export.
 *
 * Phase 652, Refinement Wave MA-6.
 *
 * @module reinforcement
 */

// Types (re-exported for convenience; authoritative home is src/types/reinforcement.ts)
export type {
  ReinforcementChannel,
  ReinforcementEvent,
  ReinforcementValue,
  ExplicitCorrectionMetadata,
  OutcomeObservedMetadata,
  BranchResolvedMetadata,
  SurpriseTriggeredMetadata,
  QuintessenceUpdatedMetadata,
} from '../types/reinforcement.js';

export {
  REINFORCEMENT_CHANNELS,
  isReinforcementChannel,
  directionFromMagnitude,
  clampMagnitude,
  r,
} from '../types/reinforcement.js';

// Emitters
export {
  emitExplicitCorrection,
  emitOutcomeObserved,
  emitBranchResolved,
  emitSurpriseTriggered,
  emitQuintessenceUpdated,
  DEFAULT_CORRECTION_MAGNITUDE,
  BRANCH_COMMIT_MAGNITUDE,
  BRANCH_ABORT_MAGNITUDE,
  DEFAULT_SURPRISE_MAGNITUDE,
  DEFAULT_QUINTESSENCE_MAGNITUDE,
} from './emitters.js';

export type {
  EmitExplicitCorrectionInput,
  EmitOutcomeObservedInput,
  EmitBranchResolvedInput,
  EmitSurpriseTriggeredInput,
  EmitQuintessenceUpdatedInput,
} from './emitters.js';

// Writer
export {
  DEFAULT_REINFORCEMENT_PATH,
  writeReinforcementEvent,
  writeReinforcementEvents,
  readReinforcementEvents,
  redactReinforcementEvent,
  validateReinforcementEvent,
  ReinforcementWriter,
} from './writer.js';

// Channel sources
export {
  recordExplicitCorrection,
  recordOutcomeObserved,
  recordBranchResolved,
  recordSurpriseTriggered,
  recordQuintessenceUpdated,
} from './channel-sources.js';

export type { ChannelSourceOptions } from './channel-sources.js';
