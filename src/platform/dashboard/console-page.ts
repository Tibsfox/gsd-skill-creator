/**
 * Console page renderer for the GSD Dashboard.
 *
 * Produces a full console page with four sections:
 * 1. Status -- live session progress from outbox/status/current.json
 * 2. Questions -- pending question cards with interactive response
 * 3. Settings -- hot-configurable toggles and non-hot disabled controls
 * 4. Activity -- bridge.jsonl timeline with clipboard fallback
 *
 * @module dashboard/console-page
 */

import type { SessionStatus } from '../console/status-writer.js';
import type { MilestoneConfig } from '../console/milestone-config.js';
import { renderQuestionCard, renderQuestionCardStyles } from './question-card.js';
import { renderQuestionResponseScript } from './question-poller.js';
import {
  renderConsoleSettings,
  renderConsoleSettingsStyles,
  renderSettingsScript,
} from './console-settings.js';
import {
  renderConsoleActivity,
  renderConsoleActivityStyles,
  renderClipboardFallbackScript,
} from './console-activity.js';
import type { ActivityEntry } from './console-activity.js';
import type { Question } from '../console/question-schema.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Data needed to render the console page. */
export interface ConsolePageData {
  /** Current session status (null when offline). */
  status: SessionStatus | null;
  /** Pending questions from outbox/questions/. */
  questions: Question[];
  /** URL for the helper endpoint (question response submission). */
  helperUrl: string;
  /** Milestone configuration for settings panel (null when not loaded). */
  config: MilestoneConfig | null;
  /** Activity entries from bridge.jsonl for the timeline. */
  activityEntries: ActivityEntry[];
}

// ---------------------------------------------------------------------------
// Status section
// ---------------------------------------------------------------------------

/**
 * Render the session status section.
 *
 * Displays phase, plan, status badge, progress bar, and updated_at.
 * Shows an empty state when status is null.
 */
function renderStatusSection(status: SessionStatus | null): string {
  if (!status) {
    return `<div class="console-status" data-refresh="console-status">
  <div class="console-status-empty">
    Session offline -- no status available
  </div>
</div>`;
  }

  const progressPct = Math.round(status.progress * 100);

  return `<div class="console-status" data-refresh="console-status">
  <h2 class="console-section-title">Session Status</h2>
  <div class="console-status-grid">
    <div class="console-status-field">
      <span class="console-status-label">Phase</span>
      <span class="console-status-value">${status.phase}</span>
    </div>
    <div class="console-status-field">
      <span class="console-status-label">Plan</span>
      <span class="console-status-value">${status.plan}</span>
    </div>
    <div class="console-status-field">
      <span class="console-status-label">Status</span>
      <span class="console-status-badge">${status.status}</span>
    </div>
    <div class="console-status-field">
      <span class="console-status-label">Progress</span>
      <div class="console-progress-bar">
        <div class="console-progress-fill" style="width: ${progressPct}%"></div>
        <span class="console-progress-text">${progressPct}%</span>
      </div>
    </div>
  </div>
  <div class="console-status-updated">
    Updated: ${status.updated_at}
  </div>
</div>`;
}

// ---------------------------------------------------------------------------
// Questions section
// ---------------------------------------------------------------------------

/**
 * Render the questions section with interactive cards.
 *
 * Maps pending questions to renderQuestionCard and appends the
 * response submission script.
 */
function renderQuestionsSection(questions: Question[], helperUrl: string): string {
  let cardsHtml: string;

  if (questions.length === 0) {
    cardsHtml = `<div class="console-questions-empty">No pending questions</div>`;
  } else {
    cardsHtml = questions.map((q) => renderQuestionCard(q)).join('\n');
  }

  return `<div class="console-questions">
  <h2 class="console-section-title">Questions</h2>
  ${cardsHtml}
  ${renderQuestionResponseScript(helperUrl)}
</div>`;
}

// ---------------------------------------------------------------------------
// Settings section
// ---------------------------------------------------------------------------

function renderSettingsSection(
  config: MilestoneConfig | null,
  helperUrl: string,
): string {
  const settingsContent = config
    ? renderConsoleSettings(config)
    : '<div class="console-settings-empty">No milestone configuration loaded</div>';

  const scriptContent = config ? renderSettingsScript(helperUrl) : '';

  return `<div class="console-settings">
  <h2 class="console-section-title">Settings</h2>
  ${settingsContent}
  ${scriptContent}
</div>`;
}

// ---------------------------------------------------------------------------
// Activity section
// ---------------------------------------------------------------------------

function renderActivitySection(entries: ActivityEntry[]): string {
  return `<div class="console-activity">
  <h2 class="console-section-title">Activity</h2>
  ${renderConsoleActivity(entries)}
</div>`;
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

/**
 * Render the complete console page content.
 *
 * Combines status display, question cards, settings panel,
 * and activity log placeholder into a single HTML string.
 *
 * @param data - Console page data (status, questions, helperUrl, config)
 * @returns HTML string for the console page body
 */
export function renderConsolePage(data: ConsolePageData): string {
  const sections = [
    renderStatusSection(data.status),
    renderQuestionsSection(data.questions, data.helperUrl),
    renderSettingsSection(data.config, data.helperUrl),
    renderActivitySection(data.activityEntries),
  ];

  return `<div class="console-page">
  <h1 class="page-title">Console</h1>
  ${sections.join('\n  ')}
  ${renderClipboardFallbackScript()}
</div>`;
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

/**
 * Return CSS styles for the console page.
 *
 * Uses CSS custom properties from the dashboard dark theme so the
 * component inherits colors and spacing automatically.
 *
 * Includes renderQuestionCardStyles() for question card styling
 * and renderConsoleSettingsStyles() for settings panel styling.
 *
 * @returns CSS string
 */
export function renderConsolePageStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Console Page
   ----------------------------------------------------------------------- */

.console-page {
  max-width: 100%;
}

/* --- Status Section --- */

.console-status {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-lg, 1.25rem);
}

.console-section-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
  margin: 0 0 var(--space-md, 1rem) 0;
}

.console-status-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-md, 1rem);
}

@media (max-width: 640px) {
  .console-status-grid {
    grid-template-columns: 1fr;
  }
}

.console-status-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.console-status-label {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--text-muted, #a0a0a0);
}

.console-status-value {
  font-size: 0.95rem;
  color: var(--text-primary, #e0e0e0);
  font-family: var(--font-mono, monospace);
}

.console-status-badge {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  color: var(--accent, #58a6ff);
  background: color-mix(in srgb, var(--accent, #58a6ff) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--accent, #58a6ff) 30%, transparent);
  border-radius: var(--radius-sm, 4px);
  width: fit-content;
}

.console-progress-bar {
  position: relative;
  height: 20px;
  background: var(--bg, #0d1117);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-sm, 4px);
  overflow: hidden;
}

.console-progress-fill {
  height: 100%;
  background: linear-gradient(to right, var(--accent, #58a6ff), #3fb950);
  border-radius: var(--radius-sm, 4px);
  transition: width 0.3s ease;
}

.console-progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--text-primary, #e0e0e0);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
}

.console-status-updated {
  margin-top: var(--space-sm, 0.5rem);
  font-size: 0.75rem;
  color: var(--text-muted, #a0a0a0);
}

.console-status-empty {
  color: var(--text-muted, #a0a0a0);
  font-style: italic;
  padding: var(--space-md, 1rem) 0;
}

/* --- Questions Section --- */

.console-questions {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-lg, 1.25rem);
}

.console-questions-empty {
  color: var(--text-muted, #a0a0a0);
  font-style: italic;
  padding: var(--space-sm, 0.5rem) 0;
}

/* --- Settings Section --- */

.console-settings {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-lg, 1.25rem);
}

/* --- Activity Section --- */

.console-activity {
  background: var(--surface, #1e1e2e);
  border: 1px solid var(--border, #333);
  border-radius: var(--radius-lg, 8px);
  padding: var(--space-lg, 1.25rem);
  margin-bottom: var(--space-lg, 1.25rem);
}

/* --- Shared --- */

.console-placeholder {
  color: var(--text-muted, #a0a0a0);
  font-style: italic;
  padding: var(--space-sm, 0.5rem) 0;
}

${renderQuestionCardStyles()}

${renderConsoleSettingsStyles()}

${renderConsoleActivityStyles()}
`;
}
