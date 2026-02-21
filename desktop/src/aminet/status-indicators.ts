/**
 * Status indicators for the Aminet browser panel.
 *
 * Maps package statuses to a 4-color scheme (green/yellow/red/gray)
 * plus blue for in-progress states. Pure functions, no I/O,
 * no imports from src/aminet/ (desktop/src boundary rule).
 *
 * @module aminet/status-indicators
 */

/** Package status values matching PackageStatus from src/aminet/types.ts
 *  (duplicated here to avoid cross-boundary import). */
export type DisplayStatus =
  | 'not-mirrored'
  | 'downloading'
  | 'mirrored'
  | 'scan-pending'
  | 'clean'
  | 'suspicious'
  | 'infected'
  | 'installed'
  | 'unscanned';

const STATUS_COLORS: Record<DisplayStatus, string> = {
  'clean': '#3fb950',
  'suspicious': '#d29922',
  'infected': '#f85149',
  'not-mirrored': '#484f58',
  'unscanned': '#484f58',
  'mirrored': '#58a6ff',
  'installed': '#3fb950',
  'downloading': '#58a6ff',
  'scan-pending': '#d29922',
};

const STATUS_LABELS: Record<DisplayStatus, string> = {
  'clean': 'Clean',
  'suspicious': 'Suspicious',
  'infected': 'Infected',
  'not-mirrored': 'Not Mirrored',
  'unscanned': 'Unscanned',
  'mirrored': 'Mirrored',
  'installed': 'Installed',
  'downloading': 'Downloading',
  'scan-pending': 'Scan Pending',
};

/**
 * Get the CSS color string for a given package status.
 *
 * @param status - The package display status.
 * @returns Hex color string.
 */
export function getStatusColor(status: DisplayStatus): string {
  return STATUS_COLORS[status];
}

/**
 * Get the human-readable label for a given package status.
 *
 * @param status - The package display status.
 * @returns Human-readable label string.
 */
export function getStatusLabel(status: DisplayStatus): string {
  return STATUS_LABELS[status];
}

/**
 * Render a colored status badge as an HTML string.
 *
 * @param status - The package display status.
 * @returns HTML span element with colored background and status text.
 */
export function renderStatusBadge(status: DisplayStatus): string {
  const color = getStatusColor(status);
  const label = getStatusLabel(status);
  return `<span class="aminet-status-badge" style="background-color:${color};color:#fff;padding:2px 6px;border-radius:3px;font-size:0.75rem">${label}</span>`;
}
