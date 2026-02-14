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
import {
  computeHash,
  loadManifest,
  saveManifest,
  needsRegeneration,
} from './incremental.js';
import { generateRefreshScript } from './refresh.js';
import { collectAndRenderMetrics } from './metrics/integration.js';
import { renderGantryPanel, renderGantryStyles } from './gantry-panel.js';
import { buildGantryData } from './gantry-data.js';
import { renderTopologyStyles } from './topology-renderer.js';
import { buildTopologyHtml } from './topology-integration.js';
import { renderMetricsStyles } from './metrics/metrics-styles.js';
import { buildTerminalHtml } from './terminal-integration.js';
import { renderActivityTabStyles } from './activity-tab-toggle.js';
import { renderActivityFeed, renderActivityFeedStyles } from './activity-feed.js';
import { renderEntityLegend, renderEntityLegendStyles } from './entity-legend.js';
import { collectTopologyData } from './collectors/topology-collector.js';
import { collectActivityFeed } from './collectors/activity-collector.js';
import { renderEntityShapeStyles } from './entity-shapes.js';
import { renderSiliconPanel, renderSiliconPanelStyles } from './silicon-panel.js';
import { renderBudgetGauge, renderBudgetGaugeStyles } from './budget-gauge.js';
import { collectBudgetSiliconData } from './budget-silicon-collector.js';
import { renderStagingQueuePanel, renderStagingQueueStyles } from './staging-queue-panel.js';
import { collectStagingQueue } from './collectors/staging-collector.js';
import { renderQuestionCardStyles } from './question-card.js';
import { renderUploadZoneStyles } from './upload-zone.js';
import { renderConfigFormStyles } from './config-form.js';
import { renderSubmitFlow, renderSubmitFlowStyles } from './submit-flow.js';
import { renderConsoleSettingsStyles } from './console-settings.js';
import { renderConsoleActivityStyles } from './console-activity.js';
import { renderConsolePage, renderConsolePageStyles } from './console-page.js';
import type { ConsolePageData } from './console-page.js';
import { collectConsoleData } from './collectors/console-collector.js';
import type { FeedEntry } from './activity-feed.js';
import type { TopologySource } from './topology-data.js';
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
  /** Inject auto-refresh script into generated pages. */
  live?: boolean;
  /** Auto-refresh interval in milliseconds (default: 5000). */
  refreshInterval?: number;
}

export interface GenerateResult {
  /** List of generated page filenames. */
  pages: string[];
  /** Pages that were skipped (content unchanged). */
  skipped: string[];
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
  { name: 'console', path: 'console.html', label: 'Console' },
];

// ---------------------------------------------------------------------------
// Content renderers
// ---------------------------------------------------------------------------

/**
 * Render the main dashboard index page content.
 */
function renderIndexContent(
  data: DashboardData,
  metricsHtml?: string,
  topologySource?: TopologySource,
  terminalHtml?: string,
  feedEntries?: FeedEntry[],
  budgetSiliconHtml?: string,
  stagingQueueHtml?: string,
): string {
  const sections: string[] = [];

  // Page title
  const projectName = data.project?.name ?? 'Project Dashboard';
  sections.push(`<h1 class="page-title">${escapeHtml(projectName)}</h1>`);

  // Project description
  if (data.project?.description) {
    sections.push(`<p style="color: var(--text-muted); margin-bottom: var(--space-xl);">${escapeHtml(data.project.description)}</p>`);
  }

  // Stats grid (full width above the two-column layout)
  sections.push(renderStatsGrid(data));

  // --- Two-column layout: Terminal (left) | Info cards (right) ---
  const rightPanels: string[] = [];

  // Current milestone status
  if (data.state) {
    rightPanels.push(renderCurrentStatus(data));
  }

  // Budget & silicon section
  if (budgetSiliconHtml) {
    rightPanels.push(budgetSiliconHtml);
  }

  // Activity feed (compact, standalone)
  const activityHtml = renderActivityFeed(feedEntries ?? []);
  rightPanels.push(`<div class="compact-card"><h3 class="compact-title">Activity</h3>${activityHtml}</div>`);

  // Staging queue panel
  if (stagingQueueHtml) {
    rightPanels.push(stagingQueueHtml);
  }

  // Live metrics sections
  if (metricsHtml) {
    rightPanels.push(metricsHtml);
  }

  // Route map topology
  if (topologySource) {
    rightPanels.push(buildTopologyHtml(topologySource));
    rightPanels.push(renderEntityLegend());
  }

  // Phase list from roadmap
  if (data.roadmap && data.roadmap.phases.length > 0) {
    rightPanels.push(renderPhaseList(data));
  }

  const terminalCard = terminalHtml
    ? `<div class="dashboard-terminal-col"><div class="terminal-standalone">${terminalHtml}</div></div>`
    : '';

  const rightCol = `<div class="dashboard-info-col">${rightPanels.join('\n')}</div>`;

  sections.push(`<div class="dashboard-grid">${terminalCard}${rightCol}</div>`);

  // Milestone timeline (full width below the grid)
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

/**
 * Render the console page content.
 *
 * Combines the console page (status, questions, settings, activity)
 * with the submit flow section.
 */
function renderConsoleContent(data: ConsolePageData): string {
  const consolePage = renderConsolePage(data);
  const submitFlow = renderSubmitFlow(data.helperUrl);
  return consolePage + '\n' + submitFlow;
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
  const skipped: string[] = [];
  const errors: string[] = [];

  // Verify planning dir exists
  try {
    await access(options.planningDir);
  } catch {
    errors.push(`Planning directory not found: ${options.planningDir}`);
    return { pages, skipped, errors, duration: performance.now() - start };
  }

  // Parse planning artifacts
  let data: DashboardData;
  try {
    data = await parsePlanningDir(options.planningDir);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to parse planning directory: ${msg}`);
    return { pages, skipped, errors, duration: performance.now() - start };
  }

  // Collect and render metrics (graceful — never fails the pipeline)
  let metricsHtml = '';
  try {
    const metricsResult = await collectAndRenderMetrics({
      planningDir: options.planningDir,
      cwd: process.cwd(),
      live: options.live ?? false,
      dashboardData: data,
    });
    metricsHtml = metricsResult.html;
  } catch {
    // Metrics collection failure never blocks dashboard generation
  }

  // Build terminal panel (graceful — never fails the pipeline)
  let terminalHtml = '';
  let terminalStyles = '';
  try {
    const terminalResult = await buildTerminalHtml();
    terminalHtml = terminalResult.html;
    terminalStyles = terminalResult.styles;
  } catch {
    // Terminal failure never blocks dashboard generation
  }

  // Collect topology data (graceful — never fails the pipeline)
  let topologySource: TopologySource | undefined;
  try {
    const projectRoot = join(options.planningDir, '..');
    topologySource = await collectTopologyData({
      commandsDir: join(projectRoot, '.claude', 'commands'),
      agentsDir: join(projectRoot, '.claude', 'agents'),
      teamsDir: join(projectRoot, '.claude', 'teams'),
    });
  } catch {
    // Topology collection failure never blocks dashboard generation
  }

  // Collect activity feed entries (graceful — never fails the pipeline)
  let feedEntries: FeedEntry[] = [];
  try {
    feedEntries = await collectActivityFeed({
      maxCommits: 30,
      maxEntries: 50,
      cwd: process.cwd(),
    });
  } catch {
    // Activity collection failure never blocks dashboard generation
  }

  // Collect budget & silicon data (graceful — never fails the pipeline)
  let budgetSiliconHtml = '';
  try {
    const bsData = await collectBudgetSiliconData({
      skillsDir: join(process.cwd(), '.claude', 'commands'),
      configPath: join(options.planningDir, 'skill-creator.json'),
    });
    const gaugeHtml = renderBudgetGauge(bsData.gauge);
    const siliconHtml = renderSiliconPanel(bsData.silicon);
    budgetSiliconHtml = `<div class="compact-card"><h3 class="compact-title">Budget</h3>${gaugeHtml}${siliconHtml}</div>`;
  } catch {
    // Budget/silicon collection failure never blocks dashboard generation
  }

  // Collect staging queue data (graceful — never fails the pipeline)
  let stagingQueueHtml = '';
  try {
    const stagingData = await collectStagingQueue({
      basePath: join(options.planningDir, '..'),
    });
    stagingQueueHtml = renderStagingQueuePanel(stagingData);
  } catch {
    // Staging queue failure never blocks dashboard generation
  }

  // Collect console page data (graceful — never fails the pipeline)
  let consoleData: ConsolePageData = {
    status: null,
    questions: [],
    helperUrl: '/api/console/message',
    config: null,
    activityEntries: [],
  };
  try {
    consoleData = await collectConsoleData({
      basePath: join(options.planningDir, '..'),
    });
  } catch {
    // Console data collection failure never blocks dashboard generation
  }

  // Ensure output directory exists
  try {
    await mkdir(options.outputDir, { recursive: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to create output directory: ${msg}`);
    return { pages, skipped, errors, duration: performance.now() - start };
  }

  // Load build manifest for incremental builds (unless forced)
  const manifest = options.force
    ? { pages: {} }
    : await loadManifest(options.outputDir);

  // Prepare refresh script (injected only when --live is set)
  const refreshSnippet = options.live
    ? generateRefreshScript(options.refreshInterval ?? 5000)
    : '';

  // Shared rendering context
  const projectName = data.project?.name ?? 'GSD Dashboard';
  const baseStyles = renderStyles();
  const gantryData = buildGantryData(data);
  const gantryHtml = renderGantryPanel(gantryData);
  const gantryStyles = renderGantryStyles();
  const topologyStyles = renderTopologyStyles();
  const metricsStyles = renderMetricsStyles();
  const activityTabStyles = renderActivityTabStyles();
  const activityFeedStyles = renderActivityFeedStyles();
  const entityLegendStyles = renderEntityLegendStyles();
  const entityShapeStyles = renderEntityShapeStyles();
  const siliconPanelStyles = renderSiliconPanelStyles();
  const budgetGaugeStyles = renderBudgetGaugeStyles();
  const stagingQueueStyles = renderStagingQueueStyles();
  const questionCardStyles = renderQuestionCardStyles();
  const uploadZoneStyles = renderUploadZoneStyles();
  const configFormStyles = renderConfigFormStyles();
  const submitFlowStyles = renderSubmitFlowStyles();
  const consoleSettingsStyles = renderConsoleSettingsStyles();
  const consoleActivityStyles = renderConsoleActivityStyles();
  const consolePageStyles = renderConsolePageStyles();

  const styles = baseStyles + gantryStyles + topologyStyles + metricsStyles
    + activityTabStyles + activityFeedStyles + terminalStyles
    + entityLegendStyles + entityShapeStyles + siliconPanelStyles
    + budgetGaugeStyles + stagingQueueStyles + questionCardStyles
    + uploadZoneStyles + configFormStyles + submitFlowStyles
    + consoleSettingsStyles + consoleActivityStyles + consolePageStyles;

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
      render: () => renderIndexContent(data, metricsHtml, topologySource, terminalHtml, feedEntries, budgetSiliconHtml, stagingQueueHtml),
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
    {
      name: 'console',
      filename: 'console.html',
      render: () => renderConsoleContent(consoleData),
      meta: {
        description: 'Console interface for settings, activity, and milestone submission',
        ogTitle: `${projectName} - Console`,
        ogDescription: 'Console interface for settings, activity, and milestone submission',
        ogType: 'website',
      },
    },
  ];

  // Generate pages (with incremental build support)
  for (const pageDef of pageDefinitions) {
    try {
      const nav = renderNav(NAV_PAGES, pageDef.name);
      const content = pageDef.render();

      let html = renderLayout({
        title: `${projectName} - ${pageDef.name === 'index' ? 'Dashboard' : pageDef.name.charAt(0).toUpperCase() + pageDef.name.slice(1)}`,
        content,
        nav,
        projectName,
        generatedAt: data.generatedAt,
        styles,
        meta: pageDef.meta,
        jsonLd: pageDef.jsonLd,
      });

      // Inject gantry strip between header and page-wrapper on all pages
      if (gantryHtml) {
        html = html.replace('</header>', `</header>\n    ${gantryHtml}`);
      }

      // Inject refresh script before closing </body> when live mode is on
      if (refreshSnippet) {
        html = html.replace('</body>', `${refreshSnippet}\n  </body>`);
      }

      // Check content hash for incremental builds
      const hash = computeHash(html);

      if (!needsRegeneration(pageDef.filename, hash, manifest)) {
        skipped.push(pageDef.filename);
        continue;
      }

      await writeFile(join(options.outputDir, pageDef.filename), html, 'utf-8');

      // Update manifest entry
      manifest.pages[pageDef.filename] = {
        hash,
        generatedAt: data.generatedAt,
      };

      pages.push(pageDef.filename);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      errors.push(`Failed to write ${pageDef.filename}: ${msg}`);
    }
  }

  // Persist updated manifest
  try {
    await saveManifest(options.outputDir, manifest);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Failed to save build manifest: ${msg}`);
  }

  return {
    pages,
    skipped,
    errors,
    duration: performance.now() - start,
  };
}
