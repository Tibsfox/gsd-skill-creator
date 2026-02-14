/**
 * Gantry data pipeline.
 *
 * Derives GantryData from parsed DashboardData (STATE.md + ROADMAP.md).
 * Pure function with zero I/O -- transforms existing structured data
 * into the cell format consumed by renderGantryPanel.
 *
 * @module dashboard/gantry-data
 */

import type { DashboardData } from './types.js';
import type { GantryData, GantryCell } from './gantry-panel.js';

// ============================================================================
// Constants
// ============================================================================

/** Maximum cells in the gantry strip. */
const MAX_CELLS = 8;

/** Keywords indicating a token/budget metric key. */
const TOKEN_KEYWORDS = ['token', 'budget', 'context'];

/** Keywords indicating an actively executing status. */
const ACTIVE_KEYWORDS = ['executing', 'active', 'running', 'building'];

/** Keywords indicating a blocked status. */
const BLOCKED_KEYWORDS = ['block'];

/** Keywords indicating a completed phase status. */
const COMPLETED_KEYWORDS = ['complete', 'done', 'shipped'];

// ============================================================================
// Internal helpers
// ============================================================================

/**
 * Check if a status string indicates active execution.
 */
function isActiveStatus(status: string): boolean {
  const lower = status.toLowerCase();
  return ACTIVE_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Check if a status string indicates blocked state.
 */
function isBlockedStatus(status: string): boolean {
  const lower = status.toLowerCase();
  return BLOCKED_KEYWORDS.some((kw) => lower.includes(kw));
}

/**
 * Derive an abbreviated label from a status string.
 */
function abbreviateStatus(status: string): string {
  const lower = status.toLowerCase();
  if (isActiveStatus(lower)) return 'Active';
  if (isBlockedStatus(lower)) return 'Blocked';
  if (lower.includes('planned') || lower.includes('pending')) return 'Planned';
  if (lower.includes('complete') || lower.includes('done')) return 'Done';
  return 'Active';
}

/**
 * Derive a color for the status cell.
 */
function statusColor(status: string): string {
  if (isActiveStatus(status)) return 'var(--signal-success)';
  if (isBlockedStatus(status)) return 'var(--signal-error)';
  return 'var(--signal-neutral)';
}

/**
 * Check if any metric key relates to tokens/budget.
 */
function hasTokenMetrics(metrics: Record<string, string>): boolean {
  return Object.keys(metrics).some((key) => {
    const lower = key.toLowerCase();
    return TOKEN_KEYWORDS.some((kw) => lower.includes(kw));
  });
}

/**
 * Extract a numeric percentage from token metric values.
 */
function extractTokenPercentage(metrics: Record<string, string>): string {
  for (const [key, value] of Object.entries(metrics)) {
    const lower = key.toLowerCase();
    if (TOKEN_KEYWORDS.some((kw) => lower.includes(kw))) {
      // Extract digits from value (e.g. "65%", "65", "65 percent")
      const match = value.match(/(\d+)/);
      if (match) return match[1];
    }
  }
  return '0';
}

/**
 * Determine budget bar color based on percentage.
 */
function budgetColor(pct: number): string {
  if (pct > 95) return 'var(--signal-error)';
  if (pct >= 80) return 'var(--signal-warning)';
  return 'var(--signal-success)';
}

// ============================================================================
// Main pipeline
// ============================================================================

/**
 * Build gantry data from parsed dashboard data.
 *
 * Derives cells from STATE.md and ROADMAP.md data. Returns a GantryData
 * object ready for renderGantryPanel.
 *
 * Cell ordering: status, agent, phase, budget.
 *
 * @param data - Parsed dashboard data from planning artifacts.
 * @returns GantryData with derived cells (max 8).
 */
export function buildGantryData(data: DashboardData): GantryData {
  const cells: GantryCell[] = [];

  // 1. Status cell from STATE.md
  if (data.state?.status) {
    const status = data.state.status;
    cells.push({
      symbol: isActiveStatus(status) ? '\u25C9' : '\u25CB',
      label: abbreviateStatus(status),
      color: statusColor(status),
      type: 'status',
    });
  }

  // 2. Agent cell from STATE.md
  if (data.state?.status) {
    const status = data.state.status;
    const active = isActiveStatus(status);
    cells.push({
      symbol: active ? '\u25CF' : '\u25CB',
      label: 'Agent',
      color: active ? 'var(--signal-success)' : 'var(--signal-neutral)',
      type: 'agent',
    });
  }

  // 3. Phase progress cell from ROADMAP.md
  if (data.roadmap?.phases && data.roadmap.phases.length > 0) {
    const phases = data.roadmap.phases;
    const completed = phases.filter((p) => {
      const lower = (p.status || '').toLowerCase();
      return COMPLETED_KEYWORDS.some((kw) => lower.includes(kw));
    }).length;
    const total = phases.length;

    cells.push({
      symbol: '\u276F',
      label: 'Phase',
      value: `${completed}/${total}`,
      type: 'phase',
    });
  }

  // 4. Budget cell from STATE.md metrics
  if (data.state?.metrics && hasTokenMetrics(data.state.metrics)) {
    const pctStr = extractTokenPercentage(data.state.metrics);
    const pct = parseInt(pctStr, 10) || 0;

    cells.push({
      symbol: '\u2588',
      label: 'Budget',
      value: String(pct),
      color: budgetColor(pct),
      type: 'budget',
    });
  }

  return { cells: cells.slice(0, MAX_CELLS) };
}
