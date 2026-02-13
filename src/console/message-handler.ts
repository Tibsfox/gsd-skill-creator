/**
 * Type-dispatched message handler for console bridge messages.
 *
 * Takes a MessageEnvelope and returns a structured action describing
 * what the session should do. Pure function -- no side effects.
 *
 * @module console/message-handler
 */

import { CONSOLE_DIRS } from './types.js';
import type { MessageEnvelope } from './types.js';

/** Discriminated union of possible actions from message handling. */
export type MessageAction =
  | { action: 'init-milestone'; configPath: string; uploadsDir: string }
  | { action: 'apply-settings'; changes: Record<string, unknown>; hot: boolean }
  | { action: 'apply-answer'; questionId: string; answer: unknown }
  | { action: 'unknown'; type: string }
  | { action: 'error'; reason: string };

/**
 * Handle an incoming message by type, returning a structured action.
 *
 * @param envelope - Validated message envelope
 * @returns Action describing what to do with this message
 */
export function handleMessage(envelope: MessageEnvelope): MessageAction {
  switch (envelope.type) {
    case 'milestone-submit':
      return handleMilestoneSubmit(envelope);
    case 'config-update':
    case 'setting-change':
      return handleConfigUpdate(envelope);
    case 'question-response':
      return handleQuestionResponse(envelope);
    default:
      return { action: 'unknown', type: envelope.type };
  }
}

/**
 * Handle milestone-submit: validate config_ref and return init action.
 */
function handleMilestoneSubmit(envelope: MessageEnvelope): MessageAction {
  const { payload } = envelope;

  if (!payload.config_ref) {
    return { action: 'error', reason: 'milestone-submit payload missing required config_ref field' };
  }

  return {
    action: 'init-milestone',
    configPath: CONSOLE_DIRS.config + '/milestone-config.json',
    uploadsDir: CONSOLE_DIRS.uploads,
  };
}

/**
 * Handle config-update / setting-change: extract settings and hot flag.
 */
function handleConfigUpdate(envelope: MessageEnvelope): MessageAction {
  const { payload } = envelope;

  if (!payload.settings || typeof payload.settings !== 'object') {
    return { action: 'error', reason: 'config-update payload missing required settings field' };
  }

  return {
    action: 'apply-settings',
    changes: payload.settings as Record<string, unknown>,
    hot: Boolean(payload.hot),
  };
}

/**
 * Handle question-response: extract question_id and answer.
 */
function handleQuestionResponse(envelope: MessageEnvelope): MessageAction {
  const { payload } = envelope;

  if (!payload.question_id) {
    return { action: 'error', reason: 'question-response payload missing required question_id field' };
  }

  return {
    action: 'apply-answer',
    questionId: String(payload.question_id),
    answer: payload.answer,
  };
}
