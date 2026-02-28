/**
 * Milestones page renderer.
 *
 * Renders a dedicated milestones page showing a rich timeline with
 * version, name, goal, shipped date, stats per milestone,
 * accomplishments as bullet lists, and a totals summary.
 */

import { escapeHtml } from '../renderer.js';
import { renderEntityShape } from '../entity-shapes.js';
import type { DashboardData } from '../types.js';

/**
 * Render the milestones page content (the inner HTML for <main>).
 *
 * @param data - Full dashboard data; extracts milestones.
 * @returns HTML string for the milestones page.
 */
export function renderMilestonesPage(data: DashboardData): string {
  const sections: string[] = [];
  const ms = data.milestones;

  if (!ms || ms.milestones.length === 0) {
    sections.push('<h1 class="page-title">Milestones</h1>');
    sections.push('<div class="card"><div class="card-body" style="color: var(--text-muted);">No milestones shipped yet.</div></div>');
    return sections.join('\n');
  }

  // Page title
  sections.push(`<h1 class="page-title">Milestones <span class="badge badge-complete">${ms.milestones.length} shipped</span></h1>`);

  // Timeline
  const items = ms.milestones
    .map((milestone) => {
      const timelineClass = milestone.shipped ? 'complete' : '';

      // Meta line: shipped date + stats
      const metaParts: string[] = [];
      if (milestone.shipped) {
        metaParts.push(`Shipped ${escapeHtml(milestone.shipped)}`);
      } else {
        metaParts.push('In progress');
      }

      const statsParts: string[] = [];
      if (milestone.stats.phases !== undefined) {
        statsParts.push(`${milestone.stats.phases} phases`);
      }
      if (milestone.stats.plans !== undefined) {
        statsParts.push(`${milestone.stats.plans} plans`);
      }
      if (milestone.stats.requirements !== undefined) {
        statsParts.push(`${milestone.stats.requirements} reqs`);
      }
      if (statsParts.length > 0) {
        metaParts.push(statsParts.join(', '));
      }

      // Goal
      const goalHtml = milestone.goal
        ? `\n      <div class="timeline-body">${escapeHtml(milestone.goal)}</div>`
        : '';

      // Accomplishments
      let accompHtml = '';
      if (milestone.accomplishments && milestone.accomplishments.length > 0) {
        const accompItems = milestone.accomplishments
          .map((a) => `<li>${escapeHtml(a)}</li>`)
          .join('\n');
        accompHtml = `\n      <div style="margin-top: var(--space-sm);"><strong>Key accomplishments:</strong><ul class="list-styled">${accompItems}</ul></div>`;
      }

      // Chevron shape: green fill for shipped, infrastructure purple for in-progress
      const chevronSvg = milestone.shipped
        ? renderEntityShape('milestone', 'infrastructure').replace(
            /fill="[^"]*"/,
            'fill="#3fb950"',
          )
        : renderEntityShape('milestone', 'infrastructure');

      return `    <div class="timeline-item ${timelineClass}">
      <div class="timeline-title">${chevronSvg} ${escapeHtml(milestone.version)} &mdash; ${escapeHtml(milestone.name)}</div>
      <div class="timeline-meta">${metaParts.join(' | ')}</div>${goalHtml}${accompHtml}
    </div>`;
    })
    .join('\n');

  sections.push(`<div class="timeline">\n${items}\n</div>`);

  // Totals summary
  sections.push(`<div class="stats-grid" style="margin-top: var(--space-xl);">
  <div class="stat-card">
    <div class="stat-value">${ms.totals.milestones}</div>
    <div class="stat-label">Milestones</div>
  </div>
  <div class="stat-card">
    <div class="stat-value">${ms.totals.phases}</div>
    <div class="stat-label">Phases</div>
  </div>
  <div class="stat-card">
    <div class="stat-value">${ms.totals.plans}</div>
    <div class="stat-label">Plans</div>
  </div>
</div>`);

  return sections.join('\n');
}
