/**
 * Type definitions and constants for the console message bridge.
 *
 * Defines the message envelope protocol and directory layout for
 * filesystem-based communication between dashboard and session.
 *
 * @module console/types
 */

/** Valid message sources -- who sent the message. */
export type MessageSource = 'dashboard' | 'session';

/** Valid message types -- what action the message represents. */
export type MessageType =
  | 'milestone-submit'
  | 'config-update'
  | 'question-response'
  | 'setting-change';

/** A validated message envelope. All messages use this shape. */
export interface MessageEnvelope {
  /** Unique message ID, format: msg-{YYYYMMDD}-{seq} */
  id: string;
  /** What kind of message this is. */
  type: MessageType;
  /** ISO 8601 timestamp of when the message was created. */
  timestamp: string;
  /** Who sent the message. */
  source: MessageSource;
  /** Arbitrary payload -- schema depends on message type. */
  payload: Record<string, unknown>;
}

/**
 * Console directory layout under .planning/console/.
 * Keys are logical names, values are relative paths from project root.
 */
export const CONSOLE_DIRS = {
  root: '.planning/console',
  inboxPending: '.planning/console/inbox/pending',
  inboxAcknowledged: '.planning/console/inbox/acknowledged',
  outboxQuestions: '.planning/console/outbox/questions',
  outboxStatus: '.planning/console/outbox/status',
  outboxNotifications: '.planning/console/outbox/notifications',
  config: '.planning/console/config',
  uploads: '.planning/console/uploads',
  logs: '.planning/console/logs',
} as const;

/** All directory paths that must exist. */
export const ALL_CONSOLE_DIRS = Object.values(CONSOLE_DIRS);
