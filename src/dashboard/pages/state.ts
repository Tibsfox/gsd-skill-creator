/**
 * State page renderer.
 *
 * Renders a dedicated state page showing current position,
 * focus, blockers (highlighted), metrics table, session
 * continuity information, and config summary.
 */

import { escapeHtml } from '../renderer.js';
import type { DashboardData } from '../types.js';

/**
 * Render the state page content (the inner HTML for <main>).
 *
 * @param data - Full dashboard data; extracts state.
 * @returns HTML string for the state page.
 */
export function renderStatePage(data: DashboardData): string {
  const sections: string[] = [];
  const state = data.state;

  if (!state) {
    sections.push('<h1 class="page-title">State</h1>');
    sections.push('<div class="card"><div class="card-body" style="color: var(--text-muted);">No state data available.</div></div>');
    return sections.join('\n');
  }

  // Page title
  sections.push('<h1 class="page-title">State</h1>');

  // Current position card
  const positionLines: string[] = [];
  if (state.milestone) {
    positionLines.push(`<div><strong>Milestone:</strong> ${escapeHtml(state.milestone)}</div>`);
  }
  if (state.phase) {
    positionLines.push(`<div><strong>Phase:</strong> ${escapeHtml(state.phase)}</div>`);
  }
  if (state.status) {
    positionLines.push(`<div><strong>Status:</strong> ${escapeHtml(state.status)}</div>`);
  }
  if (state.progress) {
    positionLines.push(`<div><strong>Progress:</strong> ${escapeHtml(state.progress)}</div>`);
  }

  sections.push(`<h2 class="section-title">Current Position</h2>
<div class="card">
  <div class="card-body">
    ${positionLines.join('\n    ')}
  </div>
</div>`);

  // Focus section
  if (state.focus) {
    sections.push(`<h2 class="section-title">Focus</h2>
<div class="card">
  <div class="card-body">${escapeHtml(state.focus)}</div>
</div>`);
  }

  // Blockers card
  if (state.blockers.length > 0) {
    const blockerItems = state.blockers
      .map((b) => `<li style="color: var(--red);">${escapeHtml(b)}</li>`)
      .join('\n');
    sections.push(`<h2 class="section-title">Blockers</h2>
<div class="card" style="border-color: var(--red);">
  <div class="card-body">
    <ul class="list-styled blocker-list">${blockerItems}</ul>
  </div>
</div>`);
  } else {
    sections.push(`<h2 class="section-title">Blockers</h2>
<div class="card" style="border-color: var(--green);">
  <div class="card-body">
    <span class="badge badge-active">No blockers</span>
  </div>
</div>`);
  }

  // Metrics table
  const metricKeys = Object.keys(state.metrics);
  if (metricKeys.length > 0) {
    const rows = metricKeys
      .map(
        (key) =>
          `      <tr><td>${escapeHtml(key)}</td><td>${escapeHtml(state.metrics[key])}</td></tr>`,
      )
      .join('\n');

    sections.push(`<h2 class="section-title">Metrics</h2>
<table>
  <thead>
    <tr><th>Metric</th><th>Value</th></tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`);
  }

  // Session continuity
  if (state.nextAction) {
    sections.push(`<h2 class="section-title">Session Continuity</h2>
<div class="card">
  <div class="card-body">
    <div><strong>Next action:</strong> ${escapeHtml(state.nextAction)}</div>
  </div>
</div>`);
  }

  return sections.join('\n');
}
