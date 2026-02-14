/**
 * Console activity timeline and clipboard fallback renderer.
 *
 * Renders a chronological timeline of bridge operations from bridge.jsonl
 * data, classified into activity types with color-coded badges.
 *
 * Also provides a clipboard fallback script that intercepts failed fetch
 * calls to the helper endpoint and copies the data to clipboard instead,
 * with toast notification and an offline banner.
 *
 * @module dashboard/console-activity
 */

import type { BridgeLogEntry } from '../console/bridge-logger.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Classified activity entry for timeline display. */
export interface ActivityEntry {
  timestamp: string;
  type: 'config-write' | 'question-response' | 'milestone-submit' | 'upload' | 'error';
  summary: string;
  details?: string;
}

// ---------------------------------------------------------------------------
// Classification
// ---------------------------------------------------------------------------

/** Type badge labels for display. */
const TYPE_LABELS: Record<ActivityEntry['type'], string> = {
  'config-write': 'Config',
  'question-response': 'Response',
  'milestone-submit': 'Submit',
  'upload': 'Upload',
  'error': 'Error',
};

/**
 * Classify a BridgeLogEntry into an ActivityEntry for timeline display.
 *
 * Priority: error status > filename patterns > subdirectory > fallback.
 */
export function classifyLogEntry(entry: BridgeLogEntry): ActivityEntry {
  // Error status takes priority
  if (entry.status === 'error') {
    return {
      timestamp: entry.timestamp,
      type: 'error',
      summary: `Error: ${entry.filename}`,
      details: entry.error,
    };
  }

  // Filename-based classification
  if (entry.filename.includes('config')) {
    return {
      timestamp: entry.timestamp,
      type: 'config-write',
      summary: `Config updated: ${entry.filename}`,
    };
  }

  if (entry.filename.includes('question-response')) {
    return {
      timestamp: entry.timestamp,
      type: 'question-response',
      summary: 'Question response submitted',
    };
  }

  if (entry.filename.includes('milestone-submit')) {
    return {
      timestamp: entry.timestamp,
      type: 'milestone-submit',
      summary: `Milestone submission: ${entry.filename}`,
    };
  }

  // Subdirectory-based classification
  if (entry.subdirectory === 'uploads') {
    return {
      timestamp: entry.timestamp,
      type: 'upload',
      summary: `File uploaded: ${entry.filename}`,
    };
  }

  // Fallback
  return {
    timestamp: entry.timestamp,
    type: 'config-write',
    summary: `Config updated: ${entry.filename}`,
  };
}

// ---------------------------------------------------------------------------
// Relative time formatting
// ---------------------------------------------------------------------------

/**
 * Format a timestamp as relative time (e.g., "5m ago", "2h ago").
 *
 * @param isoTimestamp - ISO 8601 timestamp string
 * @param now - Reference time in milliseconds (defaults to Date.now())
 */
function formatRelativeTime(isoTimestamp: string, now: number): string {
  const then = new Date(isoTimestamp).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);
  const diffDays = Math.floor(diffMs / 86_400_000);

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays <= 6) return `${diffDays}d ago`;

  // Older than 6 days: short date
  const d = new Date(isoTimestamp);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[d.getUTCMonth()]} ${d.getUTCDate()}`;
}

// ---------------------------------------------------------------------------
// Activity timeline renderer
// ---------------------------------------------------------------------------

/** Maximum entries to display. */
const MAX_ENTRIES = 50;

/**
 * Render the console activity timeline HTML.
 *
 * Displays activity entries in reverse chronological order with type
 * badges, relative timestamps, and summaries. Limited to 50 entries.
 *
 * @param entries - Activity entries to render
 * @param now - Reference time for relative timestamps (defaults to Date.now())
 * @returns HTML string
 */
export function renderConsoleActivity(
  entries: ActivityEntry[],
  now: number = Date.now(),
): string {
  if (entries.length === 0) {
    return `<div class="console-activity-timeline"><div class="activity-empty">No activity recorded</div></div>`;
  }

  // Sort by timestamp descending (newest first)
  const sorted = [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );

  // Limit to MAX_ENTRIES
  const limited = sorted.slice(0, MAX_ENTRIES);

  const items = limited.map((entry) => {
    const relTime = formatRelativeTime(entry.timestamp, now);
    const label = TYPE_LABELS[entry.type];
    const errorClass = entry.type === 'error' ? ' activity-error' : '';
    const detailsHtml =
      entry.type === 'error' && entry.details
        ? `\n  <div class="activity-details">${entry.details}</div>`
        : '';

    return `<div class="activity-entry activity-${entry.type}${errorClass}">
  <div class="activity-time" title="${entry.timestamp}">${relTime}</div>
  <div class="activity-badge badge-${entry.type}">${label}</div>
  <div class="activity-summary">${entry.summary}</div>${detailsHtml}
</div>`;
  });

  return `<div class="console-activity-timeline">\n${items.join('\n')}\n</div>`;
}

// ---------------------------------------------------------------------------
// Activity timeline styles
// ---------------------------------------------------------------------------

/**
 * Return CSS styles for the activity timeline.
 *
 * @returns CSS string
 */
export function renderConsoleActivityStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Console Activity Timeline
   ----------------------------------------------------------------------- */

.console-activity-timeline {
  display: flex;
  flex-direction: column;
  gap: 2px;
  max-height: 400px;
  overflow-y: auto;
}

.activity-entry {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-bottom: 1px solid var(--border, #333);
}

.activity-time {
  min-width: 60px;
  font-size: 0.75rem;
  color: var(--text-dim, #666);
}

.activity-badge {
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 0.7rem;
  font-weight: 500;
  white-space: nowrap;
}

.badge-config-write {
  background: rgba(31, 111, 235, 0.15);
  color: var(--accent, #58a6ff);
}

.badge-question-response {
  background: rgba(63, 185, 80, 0.15);
  color: var(--green, #3fb950);
}

.badge-milestone-submit {
  background: rgba(88, 166, 255, 0.15);
  color: var(--accent, #58a6ff);
}

.badge-upload {
  background: rgba(163, 113, 247, 0.15);
  color: var(--purple, #a371f7);
}

.badge-error {
  background: rgba(248, 81, 73, 0.15);
  color: var(--red, #f85149);
}

.activity-summary {
  font-size: 0.8rem;
  color: var(--text-primary, #e0e0e0);
  flex: 1;
}

.activity-details {
  font-size: 0.75rem;
  color: var(--text-muted, #a0a0a0);
  padding-left: 76px;
}

.activity-empty {
  text-align: center;
  color: var(--text-dim, #666);
  padding: var(--space-md, 1rem);
}

.activity-error {
  background: rgba(248, 81, 73, 0.05);
}
`;
}

// ---------------------------------------------------------------------------
// Clipboard fallback script
// ---------------------------------------------------------------------------

/**
 * Return a client-side script that provides clipboard fallback
 * when the helper endpoint is unreachable.
 *
 * Defines gsdClipboardFallback(), wraps window.fetch to intercept
 * failed POSTs to /api/console/message, and shows toast notifications
 * and an offline banner.
 *
 * @returns HTML script tag string
 */
export function renderClipboardFallbackScript(): string {
  return `<script>
(function() {
  // --- Clipboard fallback function ---
  window.gsdClipboardFallback = function(data, description) {
    navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(function() {
      // Show toast
      var toast = document.createElement('div');
      toast.className = 'clipboard-toast';
      toast.textContent = 'Copied to clipboard: ' + description;
      document.body.appendChild(toast);
      setTimeout(function() {
        toast.style.opacity = '0';
        setTimeout(function() { toast.remove(); }, 300);
      }, 3000);
    }).catch(function(err) {
      console.error('Clipboard copy failed:', err);
    });
  };

  // --- Offline banner management ---
  function showOfflineBanner() {
    if (document.querySelector('.helper-offline')) return;
    var panel = document.querySelector('.console-settings-panel');
    if (!panel) return;
    var banner = document.createElement('div');
    banner.className = 'helper-offline';
    banner.textContent = 'Helper offline -- changes will be copied to clipboard for manual application';
    panel.parentNode.insertBefore(banner, panel);
  }

  function removeOfflineBanner() {
    var banner = document.querySelector('.helper-offline');
    if (banner) banner.remove();
  }

  // --- Fetch wrapper ---
  var originalFetch = window.fetch;
  window.fetch = function(url, opts) {
    var isHelperPost = (typeof url === 'string' && url.indexOf('/api/console/message') !== -1 &&
      opts && opts.method && opts.method.toUpperCase() === 'POST');

    if (!isHelperPost) {
      return originalFetch.apply(this, arguments);
    }

    return originalFetch.apply(this, arguments).then(function(res) {
      if (!res.ok) {
        // Non-2xx: fallback to clipboard
        var body = opts.body ? JSON.parse(opts.body) : {};
        window.gsdClipboardFallback(body.content || body, body.filename || 'console data');
        showOfflineBanner();
        return res;
      }
      removeOfflineBanner();
      return res;
    }).catch(function(err) {
      // Network error: fallback to clipboard
      var body = opts.body ? JSON.parse(opts.body) : {};
      window.gsdClipboardFallback(body.content || body, body.filename || 'console data');
      showOfflineBanner();
      throw err;
    });
  };
})();
</script>
<style>
.clipboard-toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--accent, #58a6ff);
  color: var(--text-primary, #e0e0e0);
  padding: 12px 20px;
  border-radius: 8px;
  z-index: 9999;
  font-size: 0.85rem;
  transition: opacity 0.3s ease;
  animation: clipboard-fade-in 0.2s ease;
}

@keyframes clipboard-fade-in {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.helper-offline {
  background: rgba(248, 81, 73, 0.1);
  border: 1px solid var(--red, #f85149);
  color: var(--red, #f85149);
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 12px;
  font-size: 0.8rem;
}
</style>`;
}
