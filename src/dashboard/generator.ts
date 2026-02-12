/**
 * Dashboard generator pipeline.
 *
 * Wires together the parser, renderer, and styles modules to produce
 * a complete static HTML dashboard from .planning/ markdown artifacts.
 */

import { parsePlanningDir } from './parser.js';
import { renderLayout, renderNav, escapeHtml, type NavPage } from './renderer.js';
import { renderStyles } from './styles.js';
import { renderRequirementsPage } from './pages/requirements.js';
import { renderRoadmapPage } from './pages/roadmap.js';
import { renderMilestonesPage } from './pages/milestones.js';
import { renderStatePage } from './pages/state.js';
import {
  generateProjectJsonLd,
  generateMilestonesJsonLd,
  generateRoadmapJsonLd,
} from './structured-data.js';
import type { DashboardData } from './types.js';
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GenerateOptions {
  /** Path to the .planning/ directory. */
  planningDir: string;
  /** Path to the output directory for generated HTML. */
  outputDir: string;
  /** Overwrite existing files without warning. */
  force?: boolean;
}

export interface GenerateResult {
  /** List of generated page filenames. */
  pages: string[];
  /** Errors encountered during generation. */
  errors: string[];
  /** Generation duration in milliseconds. */
  duration: number;
}

// ---------------------------------------------------------------------------
// Navigation configuration
// ---------------------------------------------------------------------------

const NAV_PAGES: NavPage[] = [
  { name: 'index', path: 'index.html', label: 'Dashboard' },
  { name: 'requirements', path: 'requirements.html', label: 'Requirements' },
  { name: 'roadmap', path: 'roadmap.html', label: 'Roadmap' },
  { name: 'milestones', path: 'milestones.html', label: 'Milestones' },
  { name: 'state', path: 'state.html', label: 'State' },
];

// ---------------------------------------------------------------------------
// Content renderers
// ---------------------------------------------------------------------------

/**
 * Render the main dashboard index page content.
 */
function renderIndexContent(data: DashboardData): string {
  const sections: string[] = [];

  // Page title
  const projectName = data.project?.name ?? 'Project Dashboard';
  sections.push(`<h1 class="page-title">${escapeHtml(projectName)}</h1>`);

  // Project description
  if (data.project?.description) {
    sections.push(`<p style="color: var(--text-muted); margin-bottom: var(--space-xl);">${escapeHtml(data.project.description)}</p>`);
  }

  // Stats grid
  sections.push(renderStatsGrid(data));

  // Current milestone status
  if (data.state) {
    sections.push(renderCurrentStatus(data));
  }

  // Phase list from roadmap
  if (data.roadmap && data.roadmap.phases.length > 0) {
    sections.push(renderPhaseList(data));
  }

  // Milestone timeline
  if (data.milestones && data.milestones.milestones.length > 0) {
    sections.push(renderMilestoneTimeline(data));
  }

  // Build log
  sections.push(renderBuildLog(data));

  return sections.join('\n');
}

/**
 * Render the stats grid with key project metrics.
 */
function renderStatsGrid(data: DashboardData): string {
  const milestoneCount = data.milestones?.totals.milestones ?? 0;
  const phaseCount = data.milestones?.totals.phases ?? data.roadmap?.totalPhases ?? 0;
  const planCount = data.milestones?.totals.plans ?? 0;
  const reqCount = data.requirements?.groups.reduce(
    (sum, g) => sum + g.requirements.length,
    0,
  ) ?? 0;

  const cards: { value: string | number; label: string }[] = [];

  if (milestoneCount > 0) {
    cards.push({ value: milestoneCount, label: 'Milestones' });
  }
  if (phaseCount > 0) {
    cards.push({ value: phaseCount, label: 'Phases' });
  }
  if (planCount > 0) {
    cards.push({ value: planCount, label: 'Plans' });
  }
  if (reqCount > 0) {
    cards.push({ value: reqCount, label: 'Requirements' });
  }

  if (cards.length === 0) {
    return '';
  }

  const cardHtml = cards
    .map(
      (c) => `      <div class="stat-card">
        <div class="stat-value">${escapeHtml(String(c.value))}</div>
        <div class="stat-label">${escapeHtml(c.label)}</div>
      </div>`,
    )
    .join('\n');

  return `<div class="stats-grid">\n${cardHtml}\n</div>`;
}

/**
 * Render current project status card.
 */
function renderCurrentStatus(data: DashboardData): string {
  const state = data.state!;
  const lines: string[] = [];

  if (state.milestone) {
    lines.push(`<div><strong>Milestone:</strong> ${escapeHtml(state.milestone)}</div>`);
  }
  if (state.phase) {
    lines.push(`<div><strong>Phase:</strong> ${escapeHtml(state.phase)}</div>`);
  }
  if (state.status) {
    lines.push(`<div><strong>Status:</strong> ${escapeHtml(state.status)}</div>`);
  }
  if (state.progress) {
    lines.push(`<div><strong>Progress:</strong> ${escapeHtml(state.progress)}</div>`);
  }
  if (state.focus) {
    lines.push(`<div><strong>Focus:</strong> ${escapeHtml(state.focus)}</div>`);
  }

  if (state.blockers.length > 0) {
    const blockerItems = state.blockers
      .map((b) => `<li>${escapeHtml(b)}</li>`)
      .join('\n');
    lines.push(`<div style="margin-top: var(--space-md);"><strong>Blockers:</strong><ul class="list-styled">${blockerItems}</ul></div>`);
  }

  if (state.nextAction) {
    lines.push(`<div style="margin-top: var(--space-sm);"><strong>Next:</strong> ${escapeHtml(state.nextAction)}</div>`);
  }

  return `<h2 class="section-title">Current Status</h2>
<div class="card">
  <div class="card-body">
    ${lines.join('\n    ')}
  </div>
</div>`;
}

/**
 * Render the phase list from roadmap data.
 */
function renderPhaseList(data: DashboardData): string {
  const phases = data.roadmap!.phases;

  const rows = phases
    .map((phase) => {
      const badgeClass = statusToBadgeClass(phase.status);
      const statusBadge = `<span class="badge ${badgeClass}">${escapeHtml(phase.status || 'pending')}</span>`;

      return `      <tr>
        <td>${phase.number}</td>
        <td>${escapeHtml(phase.name)}</td>
        <td>${statusBadge}</td>
        <td>${escapeHtml(phase.goal)}</td>
      </tr>`;
    })
    .join('\n');

  return `<h2 class="section-title">Phases</h2>
<table>
  <thead>
    <tr>
      <th>#</th>
      <th>Name</th>
      <th>Status</th>
      <th>Goal</th>
    </tr>
  </thead>
  <tbody>
${rows}
  </tbody>
</table>`;
}

/**
 * Render milestone timeline.
 */
function renderMilestoneTimeline(data: DashboardData): string {
  const milestones = data.milestones!.milestones;

  const items = milestones
    .map((ms) => {
      const timelineClass = ms.shipped ? 'complete' : '';
      const meta = ms.shipped
        ? `Shipped ${escapeHtml(ms.shipped)}`
        : 'In progress';
      const statsLine = [
        ms.stats.phases !== undefined ? `${ms.stats.phases} phases` : null,
        ms.stats.plans !== undefined ? `${ms.stats.plans} plans` : null,
        ms.stats.requirements !== undefined
          ? `${ms.stats.requirements} reqs`
          : null,
      ]
        .filter(Boolean)
        .join(', ');

      return `    <div class="timeline-item ${timelineClass}">
      <div class="timeline-title">${escapeHtml(ms.version)} &mdash; ${escapeHtml(ms.name)}</div>
      <div class="timeline-meta">${meta}${statsLine ? ` | ${statsLine}` : ''}</div>
      ${ms.goal ? `<div class="timeline-body">${escapeHtml(ms.goal)}</div>` : ''}
    </div>`;
    })
    .join('\n');

  return `<h2 class="section-title">Milestones</h2>
<div class="timeline">
${items}
</div>`;
}

/**
 * Render the build log section.
 */
function renderBuildLog(data: DashboardData): string {
  const timestamp = data.generatedAt;
  return `<h2 class="section-title">Build Log</h2>
<div class="build-log">
  <div class="build-log-entry">
    <span class="build-log-time">${escapeHtml(timestamp)}</span>
    <span class="build-log-success">Dashboard generated successfully</span>
  </div>
</div>`;
}

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

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generate the dashboard HTML from a .planning/ directory.
 *
 * Parses all markdown artifacts, renders HTML pages, and writes them
 * to the output directory.
 */
export async function generate(options: GenerateOptions): Promise<GenerateResult> {
  const start = performance.now();
  const pages: string[] = [];
  const errors: string[] = [];

  // Verify planning dir exists
  try {
    await access(options.planningDir);
  } catch {
    errors.push(`Planning directory not found: ${options.planningDir}`);
    return { pages, errors, duration: performance.now() - start };
  }

  // Parse planning artifacts
  let data: DashboardData;
  try {
    data = await parsePlanningDir(options.planningDir);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to parse planning directory: ${msg}`);
    return { pages, errors, duration: performance.now() - start };
  }

  // Ensure output directory exists
  try {
    await mkdir(options.outputDir, { recursive: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to create output directory: ${msg}`);
    return { pages, errors, duration: performance.now() - start };
  }

  // Shared rendering context
  const projectName = data.project?.name ?? 'GSD Dashboard';
  const styles = renderStyles();

  // Page definitions: name, filename, content renderer, meta, jsonLd
  const pageDefinitions: {
    name: string;
    filename: string;
    render: () => string;
    meta: { description: string; ogTitle: string; ogDescription: string; ogType: string };
    jsonLd?: string;
  }[] = [
    {
      name: 'index',
      filename: 'index.html',
      render: () => renderIndexContent(data),
      meta: {
        description: data.project?.description ?? 'GSD Planning Docs Dashboard',
        ogTitle: projectName,
        ogDescription: data.project?.description ?? 'GSD Planning Docs Dashboard',
        ogType: 'website',
      },
      jsonLd: generateProjectJsonLd(data),
    },
    {
      name: 'requirements',
      filename: 'requirements.html',
      render: () => renderRequirementsPage(data),
      meta: {
        description: 'Project requirements and their status',
        ogTitle: `${projectName} - Requirements`,
        ogDescription: 'Project requirements and their status',
        ogType: 'website',
      },
    },
    {
      name: 'roadmap',
      filename: 'roadmap.html',
      render: () => renderRoadmapPage(data),
      meta: {
        description: 'Project roadmap with phase progress',
        ogTitle: `${projectName} - Roadmap`,
        ogDescription: 'Project roadmap with phase progress',
        ogType: 'website',
      },
      jsonLd: generateRoadmapJsonLd(data),
    },
    {
      name: 'milestones',
      filename: 'milestones.html',
      render: () => renderMilestonesPage(data),
      meta: {
        description: 'Shipped milestones and accomplishments',
        ogTitle: `${projectName} - Milestones`,
        ogDescription: 'Shipped milestones and accomplishments',
        ogType: 'website',
      },
      jsonLd: generateMilestonesJsonLd(data),
    },
    {
      name: 'state',
      filename: 'state.html',
      render: () => renderStatePage(data),
      meta: {
        description: 'Current project state and session continuity',
        ogTitle: `${projectName} - State`,
        ogDescription: 'Current project state and session continuity',
        ogType: 'website',
      },
    },
  ];

  // Generate all pages
  for (const pageDef of pageDefinitions) {
    try {
      const nav = renderNav(NAV_PAGES, pageDef.name);
      const content = pageDef.render();

      const html = renderLayout({
        title: `${projectName} - ${pageDef.name === 'index' ? 'Dashboard' : pageDef.name.charAt(0).toUpperCase() + pageDef.name.slice(1)}`,
        content,
        nav,
        projectName,
        generatedAt: data.generatedAt,
        styles,
        meta: pageDef.meta,
        jsonLd: pageDef.jsonLd,
      });

      await writeFile(join(options.outputDir, pageDef.filename), html, 'utf-8');
      pages.push(pageDef.filename);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to write ${pageDef.filename}: ${msg}`);
    }
  }

  return {
    pages,
    errors,
    duration: performance.now() - start,
  };
}
