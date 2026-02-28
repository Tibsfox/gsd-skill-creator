/**
 * Message counter renderer for the live session pulse section.
 *
 * Renders a card displaying user messages, assistant messages, tool calls,
 * and total message count from the current session.
 *
 * Pure renderer: typed data in, HTML string out. No IO or side effects.
 *
 * @module dashboard/metrics/pulse/message-counter
 */

// ============================================================================
// Types
// ============================================================================

/** Message and tool count data from the session collector. */
export type MessageCounterData = {
  userMessages: number;
  assistantMessages: number;
  toolCalls: number;
} | null;

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a message counter card with user, assistant, and tool call counts.
 *
 * When given valid data, renders a card with individual counters for each
 * message type plus a total (user + assistant). When given null, renders
 * a muted empty-state card.
 *
 * @param data - Message count data from session collector, or null
 * @returns HTML string for the message counter card
 */
export function renderMessageCounter(data: MessageCounterData): string {
  if (data === null) {
    return '<div class="pulse-card message-counter empty">No session data</div>';
  }

  const total = data.userMessages + data.assistantMessages;

  return `<div class="pulse-card message-counter">
  <div class="counter-user">User: ${data.userMessages}</div>
  <div class="counter-assistant">Assistant: ${data.assistantMessages}</div>
  <div class="counter-tools">Tools: ${data.toolCalls}</div>
  <div class="counter-total">Total messages: ${total}</div>
</div>`;
}
