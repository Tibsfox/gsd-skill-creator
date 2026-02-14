/**
 * Dashboard generator pipeline.
 *
 * Wires together the parser, renderer, and styles modules to produce
 * a complete static HTML dashboard from .planning/ markdown artifacts.
 */
import { parsePlanningDir } from './parser.js';
import { renderLayout, renderNav, escapeHtml } from './renderer.js';
import { renderStyles } from './styles.js';
import { renderRequirementsPage } from './pages/requirements.js';
import { renderRoadmapPage } from './pages/roadmap.js';
import { renderMilestonesPage } from './pages/milestones.js';
import { renderStatePage } from './pages/state.js';
import { generateProjectJsonLd, generateMilestonesJsonLd, generateRoadmapJsonLd, } from './structured-data.js';
import { computeHash, loadManifest, saveManifest, needsRegeneration, } from './incremental.js';
import { generateRefreshScript } from './refresh.js';
import { collectAndRenderMetrics } from './metrics/integration.js';
import { buildTerminalHtml } from './terminal-integration.js';
import { renderConsolePage, renderConsolePageStyles } from './console-page.js';
import { classifyLogEntry } from './console-activity.js';
import { QuestionPoller } from './question-poller.js';
import { mkdir, writeFile, readFile, access } from 'node:fs/promises';
import { join } from 'node:path';
// ---------------------------------------------------------------------------
// Navigation configuration
// ---------------------------------------------------------------------------
const NAV_PAGES = [
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
function renderIndexContent(data, metricsHtml, terminalHtml, pulseHtml) {
    const sections = [];
    // Page title
    const projectName = data.project?.name ?? 'Project Dashboard';
    sections.push(`<h1 class="page-title">${escapeHtml(projectName)}</h1>`);
    // Project description
    if (data.project?.description) {
        sections.push(`<p style="color: var(--text-muted); margin-bottom: var(--space-xl);">${escapeHtml(data.project.description)}</p>`);
    }
    // Stats grid
    sections.push(renderStatsGrid(data));
    // Current milestone status + session pulse (side by side)
    if (data.state) {
        if (pulseHtml) {
            sections.push(renderStatusWithPulse(data, pulseHtml));
        } else {
            sections.push(renderCurrentStatus(data));
        }
    } else if (pulseHtml) {
        sections.push(`<h2 class="section-title">Session Pulse</h2>\n${pulseHtml}`);
    }
    // Live metrics sections (with terminal in first position)
    if (metricsHtml) {
        if (terminalHtml) {
            const terminalWrapped = `<div id="gsd-section-terminal" data-tier="hot">${terminalHtml}</div>`;
            sections.push(metricsHtml.replace('<div class="metrics-dashboard">\n', '<div class="metrics-dashboard">\n' + terminalWrapped + '\n'));
        } else {
            sections.push(metricsHtml);
        }
    } else if (terminalHtml) {
        sections.push('<h2 class="section-title">Terminal</h2>');
        sections.push(terminalHtml);
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
function renderStatsGrid(data) {
    const milestoneCount = data.milestones?.totals.milestones ?? 0;
    const phaseCount = data.milestones?.totals.phases ?? data.roadmap?.totalPhases ?? 0;
    const planCount = data.milestones?.totals.plans ?? 0;
    const reqCount = data.requirements?.groups.reduce((sum, g) => sum + g.requirements.length, 0) ?? 0;
    const cards = [];
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
        .map((c) => `      <div class="stat-card">
        <div class="stat-value">${escapeHtml(String(c.value))}</div>
        <div class="stat-label">${escapeHtml(c.label)}</div>
      </div>`)
        .join('\n');
    return `<div class="stats-grid">\n${cardHtml}\n</div>`;
}
/**
 * Render current project status card.
 */
function renderCurrentStatus(data) {
    const state = data.state;
    const lines = [];
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
 * Render current status + session pulse in a side-by-side layout.
 */
function renderStatusWithPulse(data, pulseHtml) {
    const statusHtml = renderCurrentStatus(data);
    return `<div class="status-pulse-row">
  <div class="status-column">
    ${statusHtml}
  </div>
  <div class="pulse-column">
    <h2 class="section-title">Session Pulse</h2>
    <div class="card">
      <div class="card-body">
        ${pulseHtml}
      </div>
    </div>
  </div>
</div>`;
}
/**
 * Render the phase list from roadmap data.
 */
function renderPhaseList(data) {
    const phases = data.roadmap.phases;
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
function renderMilestoneTimeline(data) {
    const milestones = data.milestones.milestones;
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
function renderBuildLog(data) {
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
function statusToBadgeClass(status) {
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
export async function generate(options) {
    const start = performance.now();
    const pages = [];
    const skipped = [];
    const errors = [];
    // Verify planning dir exists
    try {
        await access(options.planningDir);
    }
    catch {
        errors.push(`Planning directory not found: ${options.planningDir}`);
        return { pages, skipped, errors, duration: performance.now() - start };
    }
    // Parse planning artifacts
    let data;
    try {
        data = await parsePlanningDir(options.planningDir);
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to parse planning directory: ${msg}`);
        return { pages, skipped, errors, duration: performance.now() - start };
    }
    // Collect and render metrics (graceful — never fails the pipeline)
    let metricsHtml = '';
    let pulseHtml = '';
    try {
        const metricsResult = await collectAndRenderMetrics({
            planningDir: options.planningDir,
            cwd: process.cwd(),
            live: options.live ?? false,
            dashboardData: data,
        });
        metricsHtml = metricsResult.html;
        pulseHtml = metricsResult.pulseHtml ?? '';
    }
    catch {
        // Metrics collection failure never blocks dashboard generation
    }
    // Collect terminal panel HTML (graceful — never fails the pipeline)
    let terminalHtml = '';
    let terminalStyles = '';
    try {
        const terminalResult = await buildTerminalHtml();
        terminalHtml = terminalResult.html;
        terminalStyles = terminalResult.styles;
    }
    catch {
        // Terminal panel failure never blocks dashboard generation
    }
    // Collect console status and pending questions (graceful — never fails the pipeline)
    let consoleStatus = null;
    let pendingQuestions = [];
    try {
        const statusPath = join(options.planningDir, 'console/outbox/status/current.json');
        const statusRaw = await readFile(statusPath, 'utf-8');
        consoleStatus = JSON.parse(statusRaw);
    }
    catch {
        // No status file — console will show offline state
    }
    try {
        const basePath = options.planningDir.replace(/\/.planning\/?$/, '') || process.cwd();
        const poller = new QuestionPoller(basePath);
        pendingQuestions = await poller.poll();
    }
    catch {
        // Question polling failure never blocks generation
    }
    // Read milestone config for settings panel (graceful — never fails the pipeline)
    let milestoneConfig = null;
    try {
        const configPath = join(options.planningDir, 'console/config/milestone-config.json');
        const configRaw = await readFile(configPath, 'utf-8');
        milestoneConfig = JSON.parse(configRaw);
    }
    catch {
        // No config file — settings panel will show empty state
    }
    // Read bridge.jsonl for activity timeline (graceful — never fails the pipeline)
    let activityEntries = [];
    try {
        const logPath = join(options.planningDir, 'console/logs/bridge.jsonl');
        const logRaw = await readFile(logPath, 'utf-8');
        const lines = logRaw.trim().split('\n').filter(Boolean);
        activityEntries = lines.map(line => {
            const entry = JSON.parse(line);
            return classifyLogEntry(entry);
        });
    }
    catch {
        // No log file or parse error — empty activity
    }
    // Ensure output directory exists
    try {
        await mkdir(options.outputDir, { recursive: true });
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`Failed to create output directory: ${msg}`);
        return { pages, skipped, errors, duration: performance.now() - start };
    }
    // Load build manifest for incremental builds (unless forced)
    const manifest = options.force
        ? { pages: {} }
        : await loadManifest(options.outputDir);
    // Refresh is handled by the live server's SSE-based reload (serve-dashboard.mjs).
    // The old generateRefreshScript did blind full-page reloads on a timer which
    // destroys stateful elements like the terminal iframe. Disabled in favor of
    // event-driven updates.
    const refreshSnippet = '';
    // Shared rendering context
    const projectName = data.project?.name ?? 'GSD Dashboard';
    const styles = renderStyles() + terminalStyles + renderConsolePageStyles();
    // Page definitions: name, filename, content renderer, meta, jsonLd
    const pageDefinitions = [
        {
            name: 'index',
            filename: 'index.html',
            render: () => renderIndexContent(data, metricsHtml, terminalHtml, pulseHtml),
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
            render: () => renderConsolePage({
                status: consoleStatus,
                questions: pendingQuestions,
                helperUrl: '/api/console/message',
                config: milestoneConfig,
                activityEntries,
            }),
            meta: {
                description: 'Console panel with live status, settings, and activity log',
                ogTitle: `${projectName} - Console`,
                ogDescription: 'Console panel with live status, settings, and activity log',
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
        }
        catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            errors.push(`Failed to write ${pageDef.filename}: ${msg}`);
        }
    }
    // Persist updated manifest
    try {
        await saveManifest(options.outputDir, manifest);
    }
    catch (err) {
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
