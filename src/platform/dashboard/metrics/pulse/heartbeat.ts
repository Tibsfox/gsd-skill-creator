/**
 * Heartbeat indicator renderer for the live session pulse section.
 *
 * Renders a color-coded indicator showing time since last .planning/
 * file modification. Green means recent activity (<30s), yellow means
 * moderate staleness (30s-2m), gray means inactive (>2m) or no data.
 *
 * Pure renderer: typed data in, HTML string out. No IO or side effects.
 *
 * @module dashboard/metrics/pulse/heartbeat
 */

// ============================================================================
// Helpers
// ============================================================================

/**
 * Format elapsed milliseconds as a compact human-readable string.
 *
 * Examples: "10s ago", "1m 30s ago", "5m ago", "1h 15m ago".
 */
function formatElapsed(elapsedMs: number): string {
  const totalSeconds = Math.floor(elapsedMs / 1000);

  if (totalSeconds < 60) {
    return `${totalSeconds}s ago`;
  }

  const totalMinutes = Math.floor(totalSeconds / 60);

  if (totalMinutes < 60) {
    const remainingSeconds = totalSeconds % 60;
    return remainingSeconds > 0
      ? `${totalMinutes}m ${remainingSeconds}s ago`
      : `${totalMinutes}m ago`;
  }

  const totalHours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes % 60;
  return remainingMinutes > 0
    ? `${totalHours}h ${remainingMinutes}m ago`
    : `${totalHours}h ago`;
}

/**
 * Determine the color class based on elapsed time.
 *
 * - Green: < 30 seconds (strictly less than)
 * - Yellow: >= 30 seconds and < 120 seconds
 * - Gray: >= 120 seconds
 */
function getColorClass(elapsedMs: number): string {
  if (elapsedMs < 30_000) return 'heartbeat-green';
  if (elapsedMs < 120_000) return 'heartbeat-yellow';
  return 'heartbeat-gray';
}

// ============================================================================
// Renderer
// ============================================================================

/**
 * Render a heartbeat indicator showing time since last .planning/ modification.
 *
 * When given a valid epoch-ms timestamp, renders a color-coded card with
 * a dot indicator and human-readable elapsed time. When given null, renders
 * a gray empty-state card.
 *
 * @param lastModifiedMs - Epoch ms of most recent .planning/ file change, or null
 * @returns HTML string for the heartbeat card
 */
export function renderHeartbeat(lastModifiedMs: number | null): string {
  if (lastModifiedMs === null) {
    return '<div class="pulse-card heartbeat heartbeat-gray" data-mtime="">' +
      '<span class="heartbeat-dot"></span>' +
      '<span class="heartbeat-label">No activity detected</span>' +
      '</div>';
  }

  const elapsedMs = Date.now() - lastModifiedMs;
  const colorClass = getColorClass(elapsedMs);
  const elapsed = formatElapsed(elapsedMs);

  return `<div class="pulse-card heartbeat ${colorClass}" data-mtime="${lastModifiedMs}">` +
    '<span class="heartbeat-dot"></span>' +
    `<span class="heartbeat-label">Last activity: ${elapsed}</span>` +
    '</div>';
}
