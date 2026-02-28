/**
 * Active session card renderer for the live session pulse section.
 *
 * Renders a card displaying session ID, model, start time, and a
 * JavaScript-based ticking duration counter. The embedded script uses
 * ES5 syntax for maximum browser compatibility and runs client-side
 * via setInterval to update the elapsed time every second.
 *
 * Pure renderer: typed data in, HTML string out. No IO or side effects
 * (the embedded script runs client-side only).
 *
 * @module dashboard/metrics/pulse/session-card
 */

import { escapeHtml } from '../../renderer.js';

// ============================================================================
// Types
// ============================================================================

/** Active session data from the session collector. */
type ActiveSession = {
  sessionId: string;
  model: string;
  startTime: number;
} | null;

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format an epoch-ms timestamp as a locale-appropriate time string.
 */
function formatTime(epochMs: number): string {
  return new Date(epochMs).toLocaleString();
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render an active session card with live ticking duration.
 *
 * When given a valid session, renders a card with session ID, model,
 * formatted start time, and an embedded `<script>` that ticks the
 * elapsed duration every second via setInterval.
 *
 * When given null, renders a muted empty-state card.
 *
 * @param activeSession - Session data from collector, or null if no active session
 * @returns HTML string for the session card
 */
export function renderSessionCard(activeSession: ActiveSession): string {
  if (activeSession === null) {
    return '<div class="pulse-card session-card empty">No active session</div>';
  }

  const { sessionId, model, startTime } = activeSession;

  return `<div class="pulse-card session-card">
  <div class="session-id">${escapeHtml(sessionId)}</div>
  <div class="session-model">${escapeHtml(model)}</div>
  <div class="session-start">Started: ${escapeHtml(formatTime(startTime))}</div>
  <span class="session-duration" data-start="${startTime}">0:00</span>
</div>
<script>
(function() {
  var el = document.querySelector('.session-duration[data-start="${startTime}"]');
  if (!el) return;
  var startMs = ${startTime};
  function tick() {
    var elapsed = Math.floor((Date.now() - startMs) / 1000);
    var h = Math.floor(elapsed / 3600);
    var m = Math.floor((elapsed % 3600) / 60);
    var s = elapsed % 60;
    if (h > 0) {
      el.textContent = h + ':' + (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    } else {
      el.textContent = m + ':' + (s < 10 ? '0' : '') + s;
    }
  }
  tick();
  setInterval(tick, 1000);
})();
</script>`;
}
