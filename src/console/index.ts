/**
 * Console message bridge module -- filesystem-based communication.
 *
 * Public API for the message bridge between dashboard and Claude
 * Code session. Consumers should import from this module.
 *
 * @module console
 */

// Types
export type {
  MessageSource,
  MessageType,
  MessageEnvelope,
} from './types.js';

// Constants
export { CONSOLE_DIRS, ALL_CONSOLE_DIRS } from './types.js';

// Schema
export { MessageEnvelopeSchema } from './schema.js';

// Directory management
export { ensureConsoleDirectory } from './directory.js';

// Writer
export { MessageWriter } from './writer.js';

// Reader
export { MessageReader } from './reader.js';

// Helper endpoint (browser-to-filesystem bridge)
export type { HelperRouter } from './helper.js';
export { createHelperRouter } from './helper.js';
