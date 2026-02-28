/**
 * Barrel export and assembly function for the live session pulse section.
 *
 * Re-exports all four pulse renderers (session card, commit feed, heartbeat,
 * message counter) and provides an assemblePulseSection function that
 * combines them into a single HTML section.
 *
 * @module dashboard/metrics/pulse
 */

import type { GitCommitMetric } from '../../collectors/types.js';
import { renderSessionCard } from './session-card.js';
import { renderCommitFeed } from './commit-feed.js';
import { renderHeartbeat } from './heartbeat.js';
import { renderMessageCounter } from './message-counter.js';
import type { MessageCounterData } from './message-counter.js';

// ============================================================================
// Barrel Re-exports
// ============================================================================

export { renderSessionCard, renderCommitFeed, renderHeartbeat, renderMessageCounter };
export type { MessageCounterData };

// ============================================================================
// Types
// ============================================================================

/** Combined input for all four pulse renderers. */
export interface PulseSectionData {
  activeSession: { sessionId: string; model: string; startTime: number } | null;
  commits: GitCommitMetric[];
  lastModifiedMs: number | null;
  messageData: MessageCounterData;
}

// ============================================================================
// Assembly
// ============================================================================

/**
 * Assemble all four pulse renderers into a single HTML section.
 *
 * Calls each renderer with its respective data slice and wraps the
 * combined output in a `<section class="pulse-section">` container.
 *
 * @param data - Combined input for all pulse renderers
 * @returns HTML string for the complete pulse section
 */
export function assemblePulseSection(data: PulseSectionData): string {
  const sessionCardHtml = renderSessionCard(data.activeSession);
  const commitFeedHtml = renderCommitFeed(data.commits);
  const heartbeatHtml = renderHeartbeat(data.lastModifiedMs);
  const messageCounterHtml = renderMessageCounter(data.messageData);

  return `<section class="pulse-section">
${sessionCardHtml}
${commitFeedHtml}
${heartbeatHtml}
${messageCounterHtml}
</section>`;
}
