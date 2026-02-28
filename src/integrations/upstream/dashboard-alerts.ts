import type { DashboardAlert, Severity } from './types.js';

/** Validation result for a dashboard alert */
export interface AlertValidation {
  valid: boolean;
  errors: string[];
}

/** Aggregated alerts grouped by severity */
export interface AggregatedAlerts {
  p0: DashboardAlert[];
  p1: DashboardAlert[];
  p2: DashboardAlert[];
  p3: DashboardAlert[];
}

const REQUIRED_FIELDS: (keyof DashboardAlert)[] = [
  'id', 'tier', 'severity', 'title', 'summary', 'timestamp',
];

/** Validate a dashboard alert has all required fields */
export function validateAlert(alert: DashboardAlert): AlertValidation {
  const errors: string[] = [];

  for (const field of REQUIRED_FIELDS) {
    if (!alert[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  return { valid: errors.length === 0, errors };
}

/** ANSI color codes for severity levels */
const SEVERITY_COLORS: Record<Severity, string> = {
  P0: '\x1b[31m', // red
  P1: '\x1b[33m', // yellow
  P2: '\x1b[36m', // cyan
  P3: '\x1b[37m', // white
};

const RESET = '\x1b[0m';

/** Format a dashboard alert for terminal display with severity prefix and color */
export function formatAlertForTerminal(alert: DashboardAlert): string {
  const color = SEVERITY_COLORS[alert.severity] ?? '';
  const prefix = `[${alert.severity}]`;
  const line = `${color}${prefix}${RESET} ${alert.title} -- ${alert.summary}`;
  return line;
}

/** Aggregate alerts into groups by severity */
export function aggregateAlerts(alerts: DashboardAlert[]): AggregatedAlerts {
  const result: AggregatedAlerts = { p0: [], p1: [], p2: [], p3: [] };

  for (const alert of alerts) {
    switch (alert.severity) {
      case 'P0': result.p0.push(alert); break;
      case 'P1': result.p1.push(alert); break;
      case 'P2': result.p2.push(alert); break;
      case 'P3': result.p3.push(alert); break;
    }
  }

  return result;
}

/**
 * Deduplicate alerts by change_id extracted from alert.id.
 * Alert IDs follow the pattern `<tier>-<change_id>` (e.g., `flash-evt-001`).
 * When the same change_id appears in multiple tiers, keep only the first occurrence.
 */
export function deduplicateAlerts(alerts: DashboardAlert[]): DashboardAlert[] {
  const seen = new Set<string>();
  const result: DashboardAlert[] = [];

  for (const alert of alerts) {
    // Extract change_id by removing the tier prefix (everything before the first dash after the tier)
    const changeId = extractChangeId(alert.id);

    if (!seen.has(changeId)) {
      seen.add(changeId);
      result.push(alert);
    }
  }

  return result;
}

/** Extract the change_id from an alert id like `flash-evt-001` -> `evt-001` */
function extractChangeId(alertId: string): string {
  const tiers = ['flash-', 'session-', 'weekly-', 'monthly-'];
  for (const prefix of tiers) {
    if (alertId.startsWith(prefix)) {
      return alertId.slice(prefix.length);
    }
  }
  return alertId;
}
