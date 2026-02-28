/**
 * Requirements page renderer.
 *
 * Renders a dedicated requirements page showing the project goal,
 * requirement groups with headings, individual requirements with
 * REQ-ID badges, and a total count.
 */

import { escapeHtml } from '../renderer.js';
import type { DashboardData } from '../types.js';

/**
 * Render the requirements page content (the inner HTML for <main>).
 *
 * @param data - Full dashboard data; extracts requirements.
 * @returns HTML string for the requirements page.
 */
export function renderRequirementsPage(data: DashboardData): string {
  const sections: string[] = [];
  const reqs = data.requirements;

  if (!reqs || reqs.groups.length === 0) {
    sections.push('<h1 class="page-title">Requirements</h1>');
    if (reqs?.goal) {
      sections.push(`<div class="card"><div class="card-body">${escapeHtml(reqs.goal)}</div></div>`);
    }
    sections.push('<div class="card"><div class="card-body" style="color: var(--text-muted);">No requirements defined yet.</div></div>');
    return sections.join('\n');
  }

  // Total count
  const totalCount = reqs.groups.reduce((sum, g) => sum + g.requirements.length, 0);

  // Page title with count
  sections.push(`<h1 class="page-title">Requirements <span class="badge badge-complete">${totalCount} total</span></h1>`);

  // Goal section
  if (reqs.goal) {
    sections.push(`<div class="card" style="margin-bottom: var(--space-xl);">
  <div class="card-header"><span class="card-title">Goal</span></div>
  <div class="card-body">${escapeHtml(reqs.goal)}</div>
</div>`);
  }

  // Requirement groups
  for (const group of reqs.groups) {
    const items = group.requirements
      .map((req) => {
        return `    <div class="req-item" style="padding: var(--space-sm) 0; border-bottom: 1px solid var(--border-muted);">
      <span class="badge badge-complete">${escapeHtml(req.id)}</span>
      <span style="margin-left: var(--space-sm); color: var(--text-muted);">${escapeHtml(req.text)}</span>
    </div>`;
      })
      .join('\n');

    sections.push(`<h2 class="section-title">${escapeHtml(group.name)} <span class="badge badge-pending">${group.requirements.length}</span></h2>
<div class="card">
  <div class="card-body">
${items}
  </div>
</div>`);
  }

  return sections.join('\n');
}
