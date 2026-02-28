/**
 * Activity feed component for the GSD Dashboard.
 *
 * Renders a non-technical, glance-level stream of recent activity using
 * shape/color/identifier format per the information design system.
 *
 * Each entry displays a domain-colored Unicode shape indicator followed
 * by an identifier and one-line description. Timestamps are used for
 * sort order only and never appear in rendered output.
 *
 * Pure render functions, no I/O. Follows dashboard panel pattern.
 *
 * @module dashboard/activity-feed
 */

// ============================================================================
// Types
// ============================================================================

/** A single activity feed entry. */
export interface FeedEntry {
  /** Entity type determining the shape indicator. */
  entityType: 'agent' | 'skill' | 'team' | 'phase' | 'adapter' | 'plan';
  /** Domain determining the color (e.g. 'frontend', 'backend'). */
  domain: string;
  /** Short identifier (e.g. 'F-1', 'B-1.api', 'T-1:rcp'). */
  identifier: string;
  /** One-line description of the activity. */
  description: string;
  /** ISO timestamp used for sort order only -- NOT displayed. */
  occurredAt: string;
}

// ============================================================================
// Constants
// ============================================================================

/** Maximum number of entries displayed in the feed (REQ-AF-02). */
const MAX_ENTRIES = 8;

/** Unicode shape indicators for each entity type. */
const SHAPE_CHARS: Record<FeedEntry['entityType'], string> = {
  agent: '\u25CF',    // ● filled circle
  skill: '\u25A0',    // ■ filled square
  team: '\u2B22',     // ⬢ hexagon
  phase: '\u276F',    // ❯ chevron right
  adapter: '\u25C6',  // ◆ filled diamond
  plan: '\u2022',     // • bullet dot
};

// ============================================================================
// Render functions
// ============================================================================

/**
 * Render the activity feed as HTML.
 *
 * Sorts entries by occurredAt descending (newest first), limits to
 * MAX_ENTRIES, and renders each as a one-line row with a domain-colored
 * Unicode shape indicator.
 *
 * @param entries - Feed entries to display.
 * @returns HTML string for the activity feed.
 */
export function renderActivityFeed(entries: FeedEntry[]): string {
  if (entries.length === 0) {
    return `<div class="activity-feed">
  <div class="af-empty">No activity</div>
</div>`;
  }

  // Sort newest-first, then limit to MAX_ENTRIES
  const sorted = [...entries].sort(
    (a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime(),
  );
  const visible = sorted.slice(0, MAX_ENTRIES);

  const rows = visible.map((entry) => {
    const shape = SHAPE_CHARS[entry.entityType];
    return `  <div class="af-entry">
    <span class="af-shape af-domain-${entry.domain}" data-entity-type="${entry.entityType}" data-domain="${entry.domain}">${shape}</span>
    <span class="af-identifier">${entry.identifier}</span>
    <span class="af-description">${entry.description}</span>
  </div>`;
  });

  return `<div class="activity-feed">
${rows.join('\n')}
</div>`;
}

/**
 * Return CSS styles for the activity feed component.
 *
 * Includes domain color classes with CSS custom property fallbacks,
 * one-line entry constraints (REQ-AF-03), and empty state styling.
 *
 * @returns CSS string.
 */
export function renderActivityFeedStyles(): string {
  return `/* -----------------------------------------------------------------------
   Activity Feed
   ----------------------------------------------------------------------- */

.activity-feed {
  display: flex;
  flex-direction: column;
  gap: 1px;
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  overflow: hidden;
}

.af-entry {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  background: var(--bg, #0d1117);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.af-shape {
  flex-shrink: 0;
  font-size: 0.9rem;
  width: 18px;
  text-align: center;
}

.af-identifier {
  font-family: var(--font-mono, monospace);
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
  flex-shrink: 0;
}

.af-description {
  font-size: 0.8rem;
  color: var(--text-muted, #a0a0a0);
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Domain colors (uses Phase 142 CSS vars when available, fallback hardcoded) */
.af-domain-frontend { color: var(--domain-frontend, #58a6ff); }
.af-domain-backend { color: var(--domain-backend, #3fb950); }
.af-domain-testing { color: var(--domain-testing, #e3b341); }
.af-domain-infrastructure { color: var(--domain-infrastructure, #bc8cff); }
.af-domain-observation { color: var(--domain-observation, #39d3c5); }
.af-domain-silicon { color: var(--domain-silicon, #f778ba); }

.af-empty {
  text-align: center;
  color: var(--text-dim, #666);
  padding: var(--space-md, 1rem);
  font-style: italic;
}
`;
}
