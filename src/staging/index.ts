/**
 * Staging pipeline module -- document intake and state management.
 *
 * Public API for the staging layer. Documents are submitted through
 * intake and progress through filesystem states.
 *
 * @module staging
 */

// Types
export type { StagingState, StagingMetadata } from './types.js';

// Constants
export { STAGING_STATES, STAGING_DIRS, ALL_STAGING_DIRS } from './types.js';

// Schema
export { StagingMetadataSchema } from './schema.js';

// Directory management
export { ensureStagingDirectory } from './directory.js';

// Document intake
export type { StageDocumentResult } from './intake.js';
export { stageDocument } from './intake.js';

// State machine
export type { MoveDocumentResult } from './state-machine.js';
export { moveDocument, VALID_TRANSITIONS } from './state-machine.js';
