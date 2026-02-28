/**
 * Activity/Terminal tab toggle component for the GSD Dashboard.
 *
 * Provides a tabbed panel that switches between the Activity feed
 * (non-technical glance-level stream) and the Terminal view (Wetty iframe).
 * Also provides the SessionEvent translator that converts raw session
 * observer events into FeedEntry format for the activity feed.
 *
 * Pure render functions, no I/O. Vanilla JS toggle script (REQ-TC-01).
 *
 * @module dashboard/activity-tab-toggle
 */

import type { FeedEntry } from './activity-feed.js';
import { renderActivityFeed } from './activity-feed.js';

// ============================================================================
// Types
// ============================================================================

/** Raw event emitted by the SessionObserver. */
export interface SessionEvent {
  /** Event type determining the entity and description template. */
  type:
    | 'agent-start'
    | 'agent-stop'
    | 'skill-activate'
    | 'skill-deactivate'
    | 'phase-start'
    | 'phase-complete'
    | 'plan-start'
    | 'plan-complete'
    | 'team-dispatch'
    | 'adapter-load';
  /** Entity identifier (e.g. 'F-1', 'B-1.api'). */
  entityId: string;
  /** Human-readable entity name. */
  entityName: string;
  /** Domain category (e.g. 'frontend', 'backend'). */
  domain: string;
  /** ISO timestamp of the event. */
  timestamp: string;
  /** Optional extra context. */
  details?: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Maps each SessionEvent type to a FeedEntry entityType. */
const EVENT_ENTITY_MAP: Record<SessionEvent['type'], FeedEntry['entityType']> = {
  'agent-start': 'agent',
  'agent-stop': 'agent',
  'skill-activate': 'skill',
  'skill-deactivate': 'skill',
  'phase-start': 'phase',
  'phase-complete': 'phase',
  'plan-start': 'plan',
  'plan-complete': 'plan',
  'team-dispatch': 'team',
  'adapter-load': 'adapter',
};

/** Description template functions for each SessionEvent type. */
const DESCRIPTION_TEMPLATES: Record<SessionEvent['type'], (name: string) => string> = {
  'agent-start': (n) => `${n} started`,
  'agent-stop': (n) => `${n} stopped`,
  'skill-activate': (n) => `${n} activated`,
  'skill-deactivate': (n) => `${n} deactivated`,
  'phase-start': (n) => `Phase ${n} started`,
  'phase-complete': (n) => `Phase ${n} complete`,
  'plan-start': (n) => `Plan ${n} started`,
  'plan-complete': (n) => `Plan ${n} complete`,
  'team-dispatch': (n) => `Team ${n} dispatched`,
  'adapter-load': (n) => `Adapter ${n} loaded`,
};

// ============================================================================
// Event translation
// ============================================================================

/**
 * Translate a raw SessionEvent into a FeedEntry for the activity feed.
 *
 * Maps the event type to an entity type and generates a human-readable
 * description. The timestamp is preserved as occurredAt for sort order.
 *
 * @param event - Raw session observer event.
 * @returns FeedEntry suitable for renderActivityFeed.
 */
export function translateSessionEvent(event: SessionEvent): FeedEntry {
  return {
    entityType: EVENT_ENTITY_MAP[event.type],
    domain: event.domain,
    identifier: event.entityId,
    description: DESCRIPTION_TEMPLATES[event.type](event.entityName),
    occurredAt: event.timestamp,
  };
}

// ============================================================================
// Tab panel renderer
// ============================================================================

/**
 * Render the tabbed panel containing Activity feed and Terminal view.
 *
 * Activity tab is active/visible by default. Terminal tab is hidden
 * until the user clicks it. Toggle behavior is handled by the inline
 * script from renderActivityTabScript().
 *
 * @param feedEntries - Feed entries for the activity tab.
 * @param terminalHtml - Pre-rendered terminal panel HTML.
 * @returns HTML string for the tabbed panel.
 */
export function renderActivityTabPanel(feedEntries: FeedEntry[], terminalHtml: string): string {
  const activityContent = renderActivityFeed(feedEntries);

  return `<div class="activity-tab-panel">
  <div class="at-tab-bar">
    <button class="at-tab at-tab-active" data-tab="activity">Activity</button>
    <button class="at-tab" data-tab="terminal">Terminal</button>
  </div>
  <div class="at-content-activity">
    ${activityContent}
  </div>
  <div class="at-content-terminal" style="display:none">
    ${terminalHtml}
  </div>
  ${renderActivityTabScript()}
</div>`;
}

// ============================================================================
// Toggle script
// ============================================================================

/**
 * Return a client-side script that toggles between Activity and Terminal tabs.
 *
 * Uses vanilla JS with event delegation on the tab panel (REQ-TC-01).
 *
 * @returns HTML script tag with toggle behavior.
 */
export function renderActivityTabScript(): string {
  return `<script>
(function() {
  var panel = document.querySelector('.activity-tab-panel');
  if (!panel) return;

  panel.addEventListener('click', function(e) {
    var tab = e.target.closest('.at-tab');
    if (!tab) return;

    var targetTab = tab.getAttribute('data-tab');

    // Update active tab
    panel.querySelectorAll('.at-tab').forEach(function(t) {
      t.classList.toggle('at-tab-active', t === tab);
    });

    // Toggle content visibility
    var activity = panel.querySelector('.at-content-activity');
    var terminal = panel.querySelector('.at-content-terminal');
    if (activity) activity.style.display = targetTab === 'activity' ? '' : 'none';
    if (terminal) terminal.style.display = targetTab === 'terminal' ? '' : 'none';
  });
})();
</script>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the tab toggle component.
 *
 * @returns CSS string.
 */
export function renderActivityTabStyles(): string {
  return `/* -----------------------------------------------------------------------
   Activity Tab Toggle
   ----------------------------------------------------------------------- */

.activity-tab-panel {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  overflow: hidden;
}

.at-tab-bar {
  display: flex;
  border-bottom: 1px solid var(--border, #333);
}

.at-tab {
  flex: 1;
  padding: 8px 16px;
  background: transparent;
  border: none;
  color: var(--text-muted, #a0a0a0);
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  border-bottom: 2px solid transparent;
  transition: color 0.15s, border-color 0.15s;
}

.at-tab:hover {
  color: var(--text-primary, #e0e0e0);
}

.at-tab-active {
  color: var(--accent, #58a6ff);
  border-bottom-color: var(--accent, #58a6ff);
}

.at-content-activity,
.at-content-terminal {
  min-height: 200px;
}
`;
}
