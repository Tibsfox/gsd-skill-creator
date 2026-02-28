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

// Milestone configuration schema + defaults
export type { MilestoneConfig } from './milestone-config.js';
export { MilestoneConfigSchema, DEFAULT_MILESTONE_CONFIG } from './milestone-config.js';

// Bridge logger (structured logging for console operations)
export type { BridgeLogEntry } from './bridge-logger.js';
export { BridgeLogger } from './bridge-logger.js';

// Message handler (type dispatch for incoming messages)
export type { MessageAction } from './message-handler.js';
export { handleMessage } from './message-handler.js';

// Status writer (session progress updates to outbox)
export type { SessionStatus } from './status-writer.js';
export { StatusWriter } from './status-writer.js';

// Question schema (structured questions from session to dashboard)
export type { Question, QuestionType, QuestionUrgency, QuestionStatus, TimeoutFallback } from './question-schema.js';
export { QuestionSchema } from './question-schema.js';

// Question responder (timeout fallback logic)
export type { QuestionTimeoutResult } from './question-responder.js';
export { applyTimeoutFallback } from './question-responder.js';
