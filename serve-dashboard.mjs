#!/usr/bin/env node
/**
 * Live Dashboard Server
 *
 * Serves the GSD Planning Docs Dashboard with real-time auto-refresh.
 *
 * Features:
 *   - Serves dashboard/ via HTTP on localhost
 *   - Watches .planning/ for file changes
 *   - Re-generates dashboard HTML when planning artifacts change
 *   - Pushes live-reload events to connected browsers via SSE
 *   - Injects a small client-side script into HTML responses for auto-refresh
 *   - Preserves scroll position across reloads
 *
 * Usage:
 *   node serve-dashboard.mjs [--port 3000] [--planning .planning] [--output dashboard]
 *
 * Zero external dependencies — uses only Node.js built-ins + the compiled
 * dashboard generator from dist/dashboard/generator.js.
 */

import { createServer } from 'node:http';
import { readFile, stat, watch } from 'node:fs/promises';
import { join, extname, resolve } from 'node:path';
import { existsSync } from 'node:fs';

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const args = process.argv.slice(2);
function getArg(name, fallback) {
  const idx = args.indexOf(`--${name}`);
  return idx !== -1 && args[idx + 1] ? args[idx + 1] : fallback;
}

const PORT = parseInt(getArg('port', '3000'), 10);
const PLANNING_DIR = resolve(getArg('planning', '.planning'));
const OUTPUT_DIR = resolve(getArg('output', 'dashboard'));
const CWD = process.cwd();
const DEBOUNCE_MS = 800;

// ---------------------------------------------------------------------------
// MIME types
// ---------------------------------------------------------------------------

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

// ---------------------------------------------------------------------------
// SSE (Server-Sent Events) for live reload
// ---------------------------------------------------------------------------

/** @type {Set<import('node:http').ServerResponse>} */
const sseClients = new Set();

function sseConnect(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });
  res.write('data: connected\n\n');
  sseClients.add(res);
  req.on('close', () => sseClients.delete(res));
}

function sseBroadcast(event, data) {
  const msg = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const client of sseClients) {
    client.write(msg);
  }
}

// ---------------------------------------------------------------------------
// Client-side live-reload script (injected into HTML responses)
// ---------------------------------------------------------------------------

const UX_CLEANUP_SCRIPT = `
<style>
  /* === UX Cleanup: fit 1920x1080 === */

  /* Full-width layout, nav as horizontal tabs */
  :root { --max-width: 100% !important; }
  .page-wrapper {
    max-width: 100% !important;
    padding: var(--space-md) var(--space-xl) !important;
    flex-direction: column !important;
    gap: 0 !important;
  }

  /* Nav as horizontal tab bar */
  nav {
    min-width: auto !important;
    width: 100%;
    border-bottom: 1px solid var(--border);
    margin-bottom: var(--space-md);
  }
  .nav-list {
    flex-direction: row !important;
    position: static !important;
    gap: 0 !important;
    flex-wrap: nowrap;
  }
  .nav-link {
    padding: var(--space-sm) var(--space-lg) !important;
    font-size: 0.85rem !important;
    border-radius: var(--radius-sm) var(--radius-sm) 0 0 !important;
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
  }
  .nav-link:hover {
    border-bottom-color: var(--text-dim);
  }
  .nav-link.active {
    border-bottom-color: var(--accent) !important;
    background: transparent !important;
  }
  main { width: 100%; }

  /* Golden ratio: metrics grid uses ~61.8% / ~38.2% columns */
  .metrics-dashboard {
    grid-template-columns: 61.8fr 38.2fr !important;
  }
  @media (max-width: 1200px) {
    .metrics-dashboard { grid-template-columns: 1fr !important; }
  }

  /* Golden ratio: milestone grid */
  .gsd-milestone-grid {
    grid-template-columns: 61.8fr 38.2fr;
  }
  @media (max-width: 1200px) {
    .gsd-milestone-grid { grid-template-columns: 1fr; }
  }

  /* Truncate long description to 2 lines */
  .page-title + p {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    font-size: 0.85rem;
    margin-bottom: var(--space-md) !important;
  }

  /* Compact stats grid */
  .stats-grid { margin-bottom: var(--space-md); }
  .stat-card { padding: var(--space-sm) var(--space-md); }

  /* Compact current status */
  .section-title { margin-top: var(--space-md); margin-bottom: var(--space-sm); }

  /* --- Session Pulse: clean up noise --- */
  .session-id { font-size: 0.75rem; color: var(--text-dim); max-width: 180px; overflow: hidden; text-overflow: ellipsis; }
  .session-model { display: none; }
  .pulse-card.message-counter { display: none; }

  /* Compact commit feed */
  .commit-row { font-size: 0.8rem; padding: 2px 0; }

  /* --- Metrics dashboard: 2-column grid on wide screens --- */
  .metrics-dashboard {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-md);
    margin-bottom: var(--space-md);
  }
  @media (max-width: 1200px) {
    .metrics-dashboard { grid-template-columns: 1fr; }
  }

  /* --- Planning Quality: collapse by default --- */
  .quality-section { max-height: none; }
  .quality-card.accuracy-scores,
  .quality-card.emergent-ratio {
    max-height: 200px;
    overflow-y: auto;
    position: relative;
  }
  .quality-card.deviation-summary {
    max-height: 180px;
    overflow-y: auto;
  }

  /* Hide rows with 0% / 0 deviations by default (toggled by JS) */
  .quality-card.accuracy-scores .accuracy-row[data-zero],
  .quality-card.emergent-ratio .emergent-row[data-zero],
  .quality-card.deviation-summary .deviation-none {
    display: none;
  }
  .quality-card.show-all .accuracy-row[data-zero],
  .quality-card.show-all .emergent-row[data-zero],
  .quality-card.show-all .deviation-none {
    display: flex;
  }

  /* Toggle buttons */
  .gsd-toggle-btn {
    display: inline-block;
    background: var(--surface-raised);
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 2px 10px;
    font-size: 0.75rem;
    cursor: pointer;
    margin: 4px 0;
  }
  .gsd-toggle-btn:hover { color: var(--accent); border-color: var(--accent); }

  /* Section labels for metrics cards */
  .gsd-section-label {
    font-size: 0.7rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    margin-bottom: 4px;
    padding: 2px 6px;
    border-left: 2px solid var(--accent);
  }
  .gsd-section-label.hot { border-color: #f85149; }
  .gsd-section-label.warm { border-color: #d29922; }
  .gsd-section-label.cold { border-color: #8b949e; }

  /* --- Phase Velocity: compact empty states --- */
  .velocity-timeline-empty,
  .velocity-stats-empty,
  .velocity-tdd-empty {
    font-size: 0.8rem;
    padding: 4px 0;
    color: var(--text-dim);
  }

  /* --- Historical Trends: fully replaced by JS charts --- */
  .history-section { margin-bottom: var(--space-sm); }
  .history-section table { font-size: 0.8rem; }
  .history-empty { display: none; }

  /* Hide original broken velocity chart (replaced by JS) */
  .velocity-chart { display: none; }

  /* === Phases Per Milestone Chart (replaces velocity trend) === */
  .gsd-phase-chart {
    display: flex;
    align-items: flex-end;
    gap: 3px;
    height: 140px;
    padding: 0 4px 24px 4px;
    position: relative;
    border-bottom: 1px solid var(--border);
  }
  .gsd-phase-chart-bar {
    flex: 1;
    min-width: 0;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    height: 100%;
  }
  .gsd-phase-chart-fill {
    width: 100%;
    max-width: 36px;
    border-radius: 3px 3px 0 0;
    background: linear-gradient(to top, #1f6feb, #58a6ff);
    transition: height 0.3s ease;
    position: relative;
    min-height: 2px;
  }
  .gsd-phase-chart-fill:hover {
    filter: brightness(1.3);
  }
  .gsd-phase-chart-val {
    font-size: 0.65rem;
    color: var(--text-muted);
    margin-bottom: 2px;
    font-weight: 600;
  }
  .gsd-phase-chart-label {
    position: absolute;
    bottom: -20px;
    font-size: 0.6rem;
    color: var(--text-dim);
    white-space: nowrap;
    transform: rotate(-35deg);
    transform-origin: top center;
  }
  .gsd-phase-chart-title {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-primary);
    margin-bottom: 8px;
  }

  /* === Milestone Comparison Chart (replaces table) === */
  .gsd-milestone-bars {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
  }
  .gsd-ms-row {
    display: grid;
    grid-template-columns: 100px 1fr 50px;
    align-items: center;
    gap: 8px;
    height: 22px;
  }
  .gsd-ms-label {
    font-size: 0.7rem;
    color: var(--text-muted);
    text-align: right;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .gsd-ms-track {
    height: 16px;
    background: var(--surface);
    border-radius: 3px;
    overflow: hidden;
    display: flex;
    gap: 1px;
  }
  .gsd-ms-seg {
    height: 100%;
    border-radius: 2px;
    transition: width 0.3s ease;
    position: relative;
  }
  .gsd-ms-seg.phases { background: #1f6feb; }
  .gsd-ms-seg.plans { background: #3fb950; }
  .gsd-ms-count {
    font-size: 0.65rem;
    color: var(--text-dim);
    white-space: nowrap;
  }
  .gsd-ms-legend {
    display: flex;
    gap: 12px;
    margin-top: 6px;
    font-size: 0.7rem;
    color: var(--text-muted);
  }
  .gsd-ms-legend-swatch {
    display: inline-block;
    width: 10px;
    height: 10px;
    border-radius: 2px;
    margin-right: 4px;
    vertical-align: middle;
  }

  /* === Milestones Timeline: compact grid === */
  .timeline { display: none; } /* hide original, replaced by grid */
  .timeline::before { display: none; }
  .gsd-milestone-grid {
    display: grid;
    gap: 6px;
    margin-bottom: var(--space-md);
  }
  .gsd-ms-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 12px;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .gsd-ms-card:first-child {
    border-color: var(--accent);
  }
  .gsd-ms-card-title {
    font-size: 0.8rem;
    font-weight: 600;
    color: var(--text-primary);
    display: flex;
    align-items: center;
    gap: 6px;
  }
  .gsd-ms-card-title .gsd-ms-badge {
    font-size: 0.6rem;
    background: #238636;
    color: #fff;
    padding: 1px 6px;
    border-radius: 10px;
    font-weight: 400;
  }
  .gsd-ms-card-meta {
    font-size: 0.7rem;
    color: var(--text-dim);
  }
  .gsd-ms-card-desc {
    font-size: 0.7rem;
    color: var(--text-muted);
    display: -webkit-box;
    -webkit-line-clamp: 1;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .gsd-ms-card.gsd-compact .gsd-ms-card-desc { display: none; }
  .gsd-ms-show-more {
    grid-column: 1 / -1;
    text-align: center;
    padding: 4px;
  }

  /* --- Phases table: compact --- */
  table { font-size: 0.85rem; }
  table td, table th { padding: 4px 8px; }

  /* Build log: minimal */
  .build-log { font-size: 0.8rem; margin-top: var(--space-sm); }
</style>
<script>
(function() {
  // =====================================================================
  // 1. VELOCITY TREND -> Proper bar chart using phase counts
  // =====================================================================
  var velocityChart = document.querySelector('.velocity-chart');
  if (velocityChart) {
    var groups = velocityChart.querySelectorAll('.velocity-bar-group');
    var data = [];
    groups.forEach(function(g) {
      var label = g.querySelector('.velocity-label');
      var phases = g.querySelector('.velocity-phases');
      if (label && phases) {
        var count = parseInt(phases.textContent) || 0;
        data.push({ label: label.textContent.trim(), count: count });
      }
    });

    // Reverse so oldest is on the left (chronological)
    data.reverse();

    var maxCount = Math.max.apply(null, data.map(function(d) { return d.count; }));
    if (maxCount === 0) maxCount = 1;

    var chartHtml = '<div class="gsd-phase-chart-title">Phases per Milestone</div>';
    chartHtml += '<div class="gsd-phase-chart">';
    data.forEach(function(d) {
      var pct = Math.round((d.count / maxCount) * 100);
      var heightPct = Math.max(pct, d.count > 0 ? 8 : 2);
      chartHtml += '<div class="gsd-phase-chart-bar">' +
        '<div class="gsd-phase-chart-val">' + d.count + '</div>' +
        '<div class="gsd-phase-chart-fill" style="height:' + heightPct + '%" title="' + d.label + ': ' + d.count + ' phases"></div>' +
        '<div class="gsd-phase-chart-label">' + d.label + '</div>' +
        '</div>';
    });
    chartHtml += '</div>';

    // Replace the history-section containing velocity chart
    var histSection = velocityChart.closest('.history-section');
    if (histSection) {
      histSection.innerHTML = '<h3>Phases per Milestone</h3>' + chartHtml;
    }
  }

  // =====================================================================
  // 2. MILESTONE COMPARISON TABLE -> Horizontal bar chart
  // =====================================================================
  var milestoneTable = document.querySelector('.milestone-table');
  if (milestoneTable) {
    var rows = milestoneTable.querySelectorAll('tbody tr');
    var msData = [];
    var maxPlans = 0;
    rows.forEach(function(row) {
      var cells = row.querySelectorAll('td');
      if (cells.length >= 3) {
        var name = cells[0].textContent.trim();
        var vMatch = name.match(/^v[\\d.]+/);
        var shortName = vMatch ? vMatch[0] : name.substring(0, 8);
        var phases = parseInt(cells[1].textContent) || 0;
        var plans = parseInt(cells[2].textContent) || 0;
        var total = phases + plans;
        if (total > maxPlans) maxPlans = total;
        msData.push({ name: shortName, phases: phases, plans: plans });
      }
    });
    if (maxPlans === 0) maxPlans = 1;

    // Reverse for chronological order (oldest first)
    msData.reverse();

    var barsHtml = '<div class="gsd-ms-legend">' +
      '<span><span class="gsd-ms-legend-swatch" style="background:#1f6feb"></span>Phases</span>' +
      '<span><span class="gsd-ms-legend-swatch" style="background:#3fb950"></span>Plans</span>' +
      '</div>';
    barsHtml += '<div class="gsd-milestone-bars">';
    msData.forEach(function(d) {
      var phaseW = Math.round((d.phases / maxPlans) * 100);
      var planW = Math.round((d.plans / maxPlans) * 100);
      barsHtml += '<div class="gsd-ms-row">' +
        '<div class="gsd-ms-label" title="' + d.name + '">' + d.name + '</div>' +
        '<div class="gsd-ms-track">' +
        '<div class="gsd-ms-seg phases" style="width:' + phaseW + '%"></div>' +
        '<div class="gsd-ms-seg plans" style="width:' + planW + '%"></div>' +
        '</div>' +
        '<div class="gsd-ms-count">' + d.phases + 'p / ' + d.plans + 'pl</div>' +
        '</div>';
    });
    barsHtml += '</div>';

    var tableSection = milestoneTable.closest('.history-section');
    if (tableSection) {
      tableSection.innerHTML = '<h3>Milestone Comparison</h3>' + barsHtml;
    }
  }

  // =====================================================================
  // 3. MILESTONES TIMELINE -> Compact 2-column grid
  // =====================================================================
  var timeline = document.querySelector('.timeline');
  if (timeline) {
    var items = timeline.querySelectorAll('.timeline-item');
    if (items.length > 0) {
      var grid = document.createElement('div');
      grid.className = 'gsd-milestone-grid';
      var SHOW_FULL = 4;

      items.forEach(function(item, idx) {
        var title = item.querySelector('.timeline-title');
        var meta = item.querySelector('.timeline-meta');
        var body = item.querySelector('.timeline-body');

        var card = document.createElement('div');
        card.className = 'gsd-ms-card' + (idx >= SHOW_FULL ? ' gsd-compact' : '');
        if (idx >= 8) card.style.display = 'none';

        var titleDiv = document.createElement('div');
        titleDiv.className = 'gsd-ms-card-title';
        titleDiv.textContent = title ? title.textContent.replace(/\\s*—\\s*/, ' - ').replace(/&mdash;/g, '-') : '';
        if (idx === 0) {
          var badge = document.createElement('span');
          badge.className = 'gsd-ms-badge';
          badge.textContent = 'latest';
          titleDiv.appendChild(badge);
        }
        card.appendChild(titleDiv);

        if (meta) {
          var metaDiv = document.createElement('div');
          metaDiv.className = 'gsd-ms-card-meta';
          metaDiv.textContent = meta.textContent;
          card.appendChild(metaDiv);
        }

        if (body && idx < SHOW_FULL) {
          var descDiv = document.createElement('div');
          descDiv.className = 'gsd-ms-card-desc';
          descDiv.textContent = body.textContent;
          card.appendChild(descDiv);
        }

        grid.appendChild(card);
      });

      // Show more / less toggle
      if (items.length > 8) {
        var moreDiv = document.createElement('div');
        moreDiv.className = 'gsd-ms-show-more';
        var moreBtn = document.createElement('button');
        moreBtn.className = 'gsd-toggle-btn';
        var hiddenCount = items.length - 8;
        moreBtn.textContent = 'Show ' + hiddenCount + ' older milestones';
        moreBtn.addEventListener('click', function() {
          var cards = grid.querySelectorAll('.gsd-ms-card');
          var isShowing = moreBtn.textContent.indexOf('Hide') === 0;
          cards.forEach(function(c, i) {
            if (i >= 8) c.style.display = isShowing ? 'none' : '';
          });
          moreBtn.textContent = isShowing
            ? 'Show ' + hiddenCount + ' older milestones'
            : 'Hide older milestones';
        });
        moreDiv.appendChild(moreBtn);
        grid.appendChild(moreDiv);
      }

      timeline.parentNode.insertBefore(grid, timeline);
    }
  }

  // =====================================================================
  // 4. Quality section toggles
  // =====================================================================
  document.querySelectorAll('.emergent-row').forEach(function(row) {
    var pct = row.querySelector('.emergent-pct');
    if (pct && pct.textContent.trim() === '0%') {
      row.setAttribute('data-zero', '1');
    }
  });

  document.querySelectorAll('.accuracy-row').forEach(function(row) {
    var label = row.querySelector('.accuracy-label');
    if (label && label.textContent.trim() === 'on_track') {
      row.setAttribute('data-zero', '1');
    }
  });

  ['accuracy-scores', 'emergent-ratio', 'deviation-summary'].forEach(function(cls) {
    var card = document.querySelector('.quality-card.' + cls);
    if (!card) return;
    var total = card.children.length;
    var hidden = card.querySelectorAll('[data-zero], .deviation-none').length;
    if (hidden < 3) return;
    var btn = document.createElement('button');
    btn.className = 'gsd-toggle-btn';
    btn.textContent = 'Show all ' + total + ' phases';
    btn.addEventListener('click', function() {
      card.classList.toggle('show-all');
      btn.textContent = card.classList.contains('show-all')
        ? 'Show notable only'
        : 'Show all ' + total + ' phases';
    });
    card.parentNode.insertBefore(btn, card.nextSibling);
  });

  // =====================================================================
  // 5. Tier labels on metric sections
  // =====================================================================
  var tierLabels = {
    'session-pulse': ['Session Pulse', 'hot'],
    'phase-velocity': ['Phase Velocity', 'warm'],
    'planning-quality': ['Planning Quality', 'warm'],
    'historical-trends': ['Historical Trends', 'cold'],
  };
  Object.keys(tierLabels).forEach(function(id) {
    var el = document.getElementById('gsd-section-' + id);
    if (!el) return;
    var info = tierLabels[id];
    var label = document.createElement('div');
    label.className = 'gsd-section-label ' + info[1];
    label.textContent = info[0].toUpperCase() + ' (' + info[1] + ' tier)';
    el.insertBefore(label, el.firstChild);
  });

  // =====================================================================
  // 6. Misc cleanup
  // =====================================================================

  // Replace raw session UUID with friendly label
  var sessionIdEl = document.querySelector('.session-id');
  if (sessionIdEl) {
    var uuid = sessionIdEl.textContent.trim();
    sessionIdEl.title = uuid;
    sessionIdEl.textContent = 'Session ' + uuid.substring(0, 8);
  }

  // Hide message counter if all zeros
  var counter = document.querySelector('.message-counter');
  if (counter) {
    var total = counter.querySelector('.counter-total');
    if (total && total.textContent.includes(': 0')) {
      counter.style.display = 'none';
    }
  }

  // Fix velocity "314/318 plans" to be contextual
  var progressPlans = document.querySelector('.progress-plans');
  if (progressPlans) {
    var txt = progressPlans.textContent;
    var match = txt.match(/(\\d+)\\s*\\/\\s*(\\d+)/);
    if (match && parseInt(match[2]) > 50) {
      progressPlans.innerHTML = '<span title="' + txt + '">' + match[1] + ' / ' + match[2] + ' plans (all milestones)</span>';
      progressPlans.style.fontSize = '0.8rem';
      progressPlans.style.color = 'var(--text-dim)';
    }
  }
})();
</script>`;

const LIVE_RELOAD_SCRIPT = `
<style>
  #gsd-live-indicator {
    position: fixed;
    top: 8px;
    right: 8px;
    background: rgba(59, 130, 246, 0.9);
    color: #fff;
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 12px;
    font-family: system-ui, sans-serif;
    z-index: 10000;
    opacity: 0;
    transition: opacity 0.3s ease;
    pointer-events: none;
  }
  #gsd-live-indicator.visible { opacity: 1; }
  #gsd-live-dot {
    position: fixed;
    bottom: 8px;
    right: 8px;
    width: 10px;
    height: 10px;
    border-radius: 50%;
    background: #3fb950;
    z-index: 10000;
    box-shadow: 0 0 6px #3fb95080;
    transition: background 0.3s;
  }
  #gsd-live-dot.disconnected { background: #f85149; box-shadow: 0 0 6px #f8514980; }
  #gsd-live-dot.refreshing { background: #58a6ff; box-shadow: 0 0 6px #58a6ff80; }
</style>
<div id="gsd-live-indicator">Refreshing...</div>
<div id="gsd-live-dot" title="Live connection"></div>
<script>
(function() {
  var SCROLL_KEY = 'gsd-dashboard-scrollY';
  var indicator = document.getElementById('gsd-live-indicator');
  var dot = document.getElementById('gsd-live-dot');

  // Restore scroll position after reload
  var savedY = sessionStorage.getItem(SCROLL_KEY);
  if (savedY !== null) {
    window.scrollTo(0, parseInt(savedY, 10));
    sessionStorage.removeItem(SCROLL_KEY);
    // Flash indicator
    if (indicator) {
      indicator.classList.add('visible');
      setTimeout(function() { indicator.classList.remove('visible'); }, 1200);
    }
  }

  // SSE connection for live reload
  var es;
  var reconnectDelay = 1000;

  function connect() {
    es = new EventSource('/api/events');

    es.onopen = function() {
      reconnectDelay = 1000;
      if (dot) { dot.className = ''; dot.id = 'gsd-live-dot'; dot.title = 'Live connection active'; }
    };

    es.addEventListener('reload', function(e) {
      // Save scroll position before reload
      sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      if (dot) { dot.classList.add('refreshing'); }
      if (indicator) { indicator.classList.add('visible'); }
      // Small delay so user sees the indicator
      setTimeout(function() { window.location.reload(); }, 300);
    });

    es.addEventListener('section-update', function(e) {
      // Granular section update (future: replace section innerHTML)
      var data = JSON.parse(e.data);
      var el = document.getElementById('gsd-section-' + data.sectionId);
      if (el && data.html) {
        el.innerHTML = data.html;
      }
    });

    es.onerror = function() {
      es.close();
      if (dot) { dot.classList.add('disconnected'); dot.title = 'Reconnecting...'; }
      setTimeout(connect, reconnectDelay);
      reconnectDelay = Math.min(reconnectDelay * 1.5, 10000);
    };
  }

  connect();

  // Fallback: poll-based refresh if SSE fails entirely
  var pollInterval = setInterval(function() {
    if (es && es.readyState === EventSource.OPEN) return; // SSE is working
    fetch('/api/check')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        var lastGen = sessionStorage.getItem('gsd-last-gen');
        if (lastGen && lastGen !== data.generatedAt) {
          sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
          window.location.reload();
        }
        sessionStorage.setItem('gsd-last-gen', data.generatedAt);
      })
      .catch(function() {});
  }, 5000);
})();
</script>`;

// ---------------------------------------------------------------------------
// Dashboard generator (imported from compiled dist/)
// ---------------------------------------------------------------------------

let generate = null;

async function loadGenerator() {
  try {
    const mod = await import('./dist/dashboard/generator.js');
    generate = mod.generate;
    console.log('[dashboard] Generator loaded from dist/dashboard/generator.js');
    return true;
  } catch (err) {
    console.error('[dashboard] Failed to load generator:', err.message);
    console.error('[dashboard] Dashboard will be served as static files (no regeneration)');
    return false;
  }
}

let isGenerating = false;
let generatedAt = null;

async function regenerate(reason) {
  if (!generate) return;
  if (isGenerating) return;
  isGenerating = true;

  const start = Date.now();
  console.log(`[dashboard] Regenerating (${reason})...`);

  try {
    const result = await generate({
      planningDir: PLANNING_DIR,
      outputDir: OUTPUT_DIR,
      live: true,
      force: true,
      refreshInterval: 5000,
    });

    generatedAt = new Date().toISOString();
    const elapsed = Date.now() - start;

    if (result.errors.length > 0) {
      console.error('[dashboard] Generation errors:', result.errors);
    }

    console.log(
      `[dashboard] Generated ${result.pages.length} pages, ` +
      `skipped ${result.skipped.length}, ` +
      `${result.errors.length} errors ` +
      `(${elapsed}ms)`
    );

    // Notify all connected browsers
    sseBroadcast('reload', { generatedAt, reason, elapsed });
  } catch (err) {
    console.error('[dashboard] Generation failed:', err.message);
  } finally {
    isGenerating = false;
  }
}

// ---------------------------------------------------------------------------
// File watcher — monitors .planning/ for changes
// ---------------------------------------------------------------------------

let debounceTimer = null;

async function startWatcher() {
  if (!existsSync(PLANNING_DIR)) {
    console.warn(`[watcher] Planning directory not found: ${PLANNING_DIR}`);
    console.warn('[watcher] File watching disabled. Create .planning/ to enable.');
    return;
  }

  try {
    const watcher = watch(PLANNING_DIR, { recursive: true });
    console.log(`[watcher] Watching ${PLANNING_DIR} for changes`);

    for await (const event of watcher) {
      // Skip hidden files and temp files
      if (event.filename && (
        event.filename.startsWith('.') ||
        event.filename.endsWith('~') ||
        event.filename.endsWith('.swp')
      )) continue;

      // Debounce rapid changes
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        regenerate(`${event.eventType}: ${event.filename || 'unknown'}`);
      }, DEBOUNCE_MS);
    }
  } catch (err) {
    console.error('[watcher] Watch failed:', err.message);
  }
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // API: SSE endpoint
  if (pathname === '/api/events') {
    return sseConnect(req, res);
  }

  // API: check endpoint (poll fallback)
  if (pathname === '/api/check') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ generatedAt, ok: true }));
  }

  // API: manual regenerate trigger
  if (pathname === '/api/regenerate' && req.method === 'POST') {
    regenerate('manual trigger');
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ ok: true, message: 'Regeneration queued' }));
  }

  // Static file serving from dashboard/
  let filePath = pathname === '/' ? '/index.html' : pathname;
  filePath = join(OUTPUT_DIR, filePath);

  // Security: prevent directory traversal
  if (!resolve(filePath).startsWith(resolve(OUTPUT_DIR))) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  try {
    const fileStat = await stat(filePath);
    if (!fileStat.isFile()) {
      res.writeHead(404);
      return res.end('Not Found');
    }

    let content = await readFile(filePath, 'utf-8');
    const ext = extname(filePath);
    const contentType = MIME[ext] || 'application/octet-stream';

    // Inject live-reload script into HTML pages
    if (ext === '.html') {
      // Remove any existing meta http-equiv="refresh" (our SSE replaces it)
      content = content.replace(
        /<meta\s+http-equiv=["']refresh["'][^>]*>/gi,
        '<!-- live-reload replaces meta refresh -->'
      );
      // Inject live-reload script before </body>
      content = content.replace('</body>', `${UX_CLEANUP_SCRIPT}\n${LIVE_RELOAD_SCRIPT}\n</body>`);
    }

    res.writeHead(200, {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
    });
    res.end(content);
  } catch {
    res.writeHead(404);
    res.end('Not Found');
  }
});

// ---------------------------------------------------------------------------
// Startup
// ---------------------------------------------------------------------------

async function main() {
  console.log('');
  console.log('  GSD Live Dashboard Server');
  console.log('  ========================');
  console.log('');

  // Load generator
  const hasGenerator = await loadGenerator();

  // Initial generation
  if (hasGenerator && existsSync(PLANNING_DIR)) {
    await regenerate('initial startup');
  } else if (!existsSync(OUTPUT_DIR)) {
    console.warn(`[dashboard] No output directory at ${OUTPUT_DIR}`);
    console.warn('[dashboard] Run the generator first, or create .planning/ artifacts');
  }

  // Start file watcher
  startWatcher();

  // Start HTTP server (try configured port, fall back if in use)
  const tryPort = (port) => new Promise((resolve, reject) => {
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.warn(`[server] Port ${port} in use, trying ${port + 1}...`);
        resolve(tryPort(port + 1));
      } else {
        reject(err);
      }
    });
    server.listen(port, () => {
      const actualPort = server.address().port;
      console.log('');
      console.log(`  Dashboard:  http://localhost:${actualPort}`);
      console.log(`  SSE:        http://localhost:${actualPort}/api/events`);
      console.log(`  Status:     http://localhost:${actualPort}/api/check`);
      console.log('');
      console.log('  Watching .planning/ for changes...');
      console.log('  Press Ctrl+C to stop');
      console.log('');
      resolve(actualPort);
    });
  });

  await tryPort(PORT);
}

main().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});
