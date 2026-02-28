/**
 * Roadmap page renderer.
 *
 * Renders a dedicated roadmap page showing a progress summary with
 * progress bar, and phase cards with number, name, status badge,
 * goal, requirements, and deliverables.
 */

import { escapeHtml } from '../renderer.js';
import type { DashboardData } from '../types.js';

/**
 * Map a phase status string to a CSS badge class.
 */
function statusToBadgeClass(status: string): string {
  const lower = (status || '').toLowerCase();
  if (lower.includes('active') || lower.includes('executing')) {
    return 'badge-active';
  }
  if (lower.includes('complete') || lower.includes('done') || lower.includes('shipped')) {
    return 'badge-complete';
  }
  if (lower.includes('block')) {
    return 'badge-blocked';
  }
  return 'badge-pending';
}

/**
 * Render the roadmap page content (the inner HTML for <main>).
 *
 * @param data - Full dashboard data; extracts roadmap.
 * @returns HTML string for the roadmap page.
 */
export function renderRoadmapPage(data: DashboardData): string {
  const sections: string[] = [];
  const roadmap = data.roadmap;

  if (!roadmap || roadmap.phases.length === 0) {
    sections.push('<h1 class="page-title">Roadmap</h1>');
    sections.push('<div class="card"><div class="card-body" style="color: var(--text-muted);">No phases defined yet.</div></div>');
    return sections.join('\n');
  }

  // Page title
  sections.push('<h1 class="page-title">Roadmap</h1>');

  // Progress summary
  const completeCount = roadmap.phases.filter(
    (p) => statusToBadgeClass(p.status) === 'badge-complete',
  ).length;
  const totalCount = roadmap.phases.length;
  const pct = totalCount > 0 ? Math.round((completeCount / totalCount) * 100) : 0;

  sections.push(`<div class="card" style="margin-bottom: var(--space-xl);">
  <div class="card-header">
    <span class="card-title">Progress</span>
    <span class="badge badge-complete">${completeCount} of ${totalCount} complete</span>
  </div>
  <div class="card-body">
    <div class="progress-bar">
      <div class="progress-fill${pct === 100 ? ' success' : ''}" style="width: ${pct}%;"></div>
    </div>
  </div>
</div>`);

  // Phase cards
  for (const phase of roadmap.phases) {
    const badgeClass = statusToBadgeClass(phase.status);
    const statusBadge = `<span class="badge ${badgeClass}">${escapeHtml(phase.status || 'pending')}</span>`;

    const details: string[] = [];

    if (phase.goal) {
      details.push(`<div style="margin-bottom: var(--space-sm);"><strong>Goal:</strong> ${escapeHtml(phase.goal)}</div>`);
    }

    if (phase.requirements.length > 0) {
      const reqBadges = phase.requirements
        .map((r) => `<span class="badge badge-complete" style="margin-right: var(--space-xs);">${escapeHtml(r)}</span>`)
        .join(' ');
      details.push(`<div style="margin-bottom: var(--space-sm);"><strong>Requirements:</strong> ${reqBadges}</div>`);
    }

    if (phase.deliverables.length > 0) {
      const delivItems = phase.deliverables
        .map((d) => `<li>${escapeHtml(d)}</li>`)
        .join('\n');
      details.push(`<div><strong>Deliverables:</strong><ul class="list-styled">${delivItems}</ul></div>`);
    }

    sections.push(`<div class="card">
  <div class="card-header">
    <span class="card-title">Phase ${phase.number}: ${escapeHtml(phase.name)}</span>
    ${statusBadge}
  </div>
  <div class="card-body">
    ${details.join('\n    ')}
  </div>
</div>`);
  }

  return sections.join('\n');
}
