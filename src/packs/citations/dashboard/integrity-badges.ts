/**
 * Citation integrity badges for the GSD Dashboard.
 *
 * Renders colored health badges based on citation completeness scores.
 * Green (>=90%), Yellow (70-89%), Red (<70%). Used for individual
 * citation audits and pack-level aggregates.
 *
 * Pure render functions, no I/O. Follows dashboard panel pattern.
 *
 * @module citations/dashboard/integrity-badges
 */

// ============================================================================
// Types
// ============================================================================

/** Result of an integrity audit for a single work or group. */
export interface AuditResult {
  /** Completeness score (0-1). */
  completeness_score: number;
  /** Total fields checked. */
  total_fields: number;
  /** Fields that passed checks. */
  passed_fields: number;
  /** Human-readable label for this audit. */
  label?: string;
  /** Optional list of issues found. */
  issues?: string[];
}

// ============================================================================
// Constants
// ============================================================================

const SUCCESS_GREEN = '#3fb950';
const WARNING_YELLOW = '#d29922';
const ERROR_RED = '#f85149';
const TEXT_DARK = '#0d1117';
const TEXT_LIGHT = '#e6edf3';

/** Threshold: >= 90% is green. */
const GREEN_THRESHOLD = 0.90;
/** Threshold: >= 70% is yellow. */
const YELLOW_THRESHOLD = 0.70;

// ============================================================================
// Badge renderers
// ============================================================================

/**
 * Render an integrity badge for a single audit result.
 *
 * Displays a colored pill with percentage and field counts.
 * Color is determined by completeness_score thresholds.
 *
 * @param auditResult - The audit result to visualize.
 * @returns HTML string for the badge.
 */
export function renderIntegrityBadge(auditResult: AuditResult): string {
  const score = auditResult.completeness_score;
  const percent = Math.round(score * 100);
  const { bg, text } = getBadgeColors(score);
  const label = auditResult.label ? escapeHtml(auditResult.label) : 'Integrity';
  const counts = `${auditResult.passed_fields}/${auditResult.total_fields}`;

  const issuesList = auditResult.issues && auditResult.issues.length > 0
    ? `<ul class="ib-issues">${auditResult.issues.map(i => `<li>${escapeHtml(i)}</li>`).join('')}</ul>`
    : '';

  return `<span class="integrity-badge" style="background:${bg};color:${text}" data-score="${score}" title="${label}: ${percent}% (${counts})">
  <span class="ib-label">${label}</span>
  <span class="ib-percent">${percent}%</span>
  <span class="ib-counts">(${counts})</span>
</span>${issuesList}`;
}

/**
 * Render a pack-level badge averaging multiple audit results.
 *
 * Computes the average completeness_score across all audits and
 * renders a single aggregated badge showing the pack health.
 *
 * @param packAudits - Array of audit results for works in the pack.
 * @returns HTML string for the pack badge.
 */
export function renderPackBadge(packAudits: AuditResult[]): string {
  if (packAudits.length === 0) {
    return `<span class="integrity-badge ib-empty" style="background:${ERROR_RED};color:${TEXT_LIGHT}">
  <span class="ib-label">Pack</span>
  <span class="ib-percent">N/A</span>
  <span class="ib-counts">(0 works)</span>
</span>`;
  }

  const avgScore = packAudits.reduce((sum, a) => sum + a.completeness_score, 0) / packAudits.length;
  const avgPercent = Math.round(avgScore * 100);
  const { bg, text } = getBadgeColors(avgScore);

  const totalPassed = packAudits.reduce((sum, a) => sum + a.passed_fields, 0);
  const totalFields = packAudits.reduce((sum, a) => sum + a.total_fields, 0);

  return `<span class="integrity-badge ib-pack" style="background:${bg};color:${text}" data-score="${avgScore}" title="Pack: ${avgPercent}% (${totalPassed}/${totalFields})">
  <span class="ib-label">Pack</span>
  <span class="ib-percent">${avgPercent}%</span>
  <span class="ib-counts">(${packAudits.length} works)</span>
</span>`;
}

// ============================================================================
// Styles
// ============================================================================

/**
 * Return CSS styles for the integrity badge components.
 *
 * @returns CSS string.
 */
export function renderIntegrityBadgeStyles(): string {
  return `
/* -----------------------------------------------------------------------
   Integrity Badges
   ----------------------------------------------------------------------- */

.integrity-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.ib-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  opacity: 0.85;
}

.ib-percent {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.85rem;
}

.ib-counts {
  font-family: 'SF Mono', 'Fira Code', monospace;
  font-size: 0.7rem;
  opacity: 0.75;
}

.ib-issues {
  margin: 4px 0 0 1rem;
  padding: 0;
  list-style: none;
  font-size: 0.75rem;
  color: #8b949e;
}

.ib-issues li::before {
  content: "\\2022 ";
  color: ${ERROR_RED};
}
`;
}

// ============================================================================
// Helpers
// ============================================================================

function getBadgeColors(score: number): { bg: string; text: string } {
  if (score >= GREEN_THRESHOLD) {
    return { bg: SUCCESS_GREEN, text: TEXT_DARK };
  }
  if (score >= YELLOW_THRESHOLD) {
    return { bg: WARNING_YELLOW, text: TEXT_DARK };
  }
  return { bg: ERROR_RED, text: TEXT_LIGHT };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
