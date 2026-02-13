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
  .session-model { display: none; } /* hide "unknown" */
  .pulse-card.message-counter { display: none; } /* hide all-zero counters */

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

  /* Toggle buttons for quality sections */
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

  /* --- Historical Trends: compact --- */
  .history-section { margin-bottom: var(--space-sm); }
  .history-section table { font-size: 0.8rem; }
  .history-empty { font-size: 0.8rem; color: var(--text-dim); padding: 4px 0; }
  .velocity-chart { max-height: 120px; }

  /* --- Milestones timeline: collapse older ones --- */
  .timeline-item.gsd-collapsed .timeline-body { display: none; }
  .timeline-item.gsd-collapsed .timeline-meta { font-size: 0.75rem; }
  .gsd-milestone-toggle {
    display: inline-block;
    background: var(--surface-raised);
    color: var(--text-muted);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 2px 10px;
    font-size: 0.75rem;
    cursor: pointer;
    margin: 4px 0 var(--space-sm) 0;
  }
  .gsd-milestone-toggle:hover { color: var(--accent); border-color: var(--accent); }

  /* --- Phases table: compact --- */
  table { font-size: 0.85rem; }
  table td, table th { padding: 4px 8px; }

  /* Build log: minimal */
  .build-log { font-size: 0.8rem; margin-top: var(--space-sm); }
</style>
<script>
(function() {
  // --- Mark zero-value quality rows for CSS hiding ---
  document.querySelectorAll('.accuracy-row').forEach(function(row) {
    var label = row.querySelector('.accuracy-label');
    if (label && label.textContent === 'on_track') return;
    // Keep rows with non-zero interesting data
  });

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

  // --- Add toggle buttons to quality cards ---
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

  // --- Add tier labels to metric sections ---
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

  // --- Collapse older milestones (keep latest 3 visible) ---
  var items = document.querySelectorAll('.timeline-item');
  if (items.length > 3) {
    for (var i = 3; i < items.length; i++) {
      items[i].classList.add('gsd-collapsed');
    }
    var timeline = document.querySelector('.timeline');
    if (timeline) {
      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'gsd-milestone-toggle';
      toggleBtn.textContent = 'Show ' + (items.length - 3) + ' older milestones';
      toggleBtn.addEventListener('click', function() {
        var collapsed = document.querySelectorAll('.timeline-item.gsd-collapsed');
        if (collapsed.length > 0) {
          collapsed.forEach(function(el) { el.classList.remove('gsd-collapsed'); });
          toggleBtn.textContent = 'Collapse older milestones';
        } else {
          for (var j = 3; j < items.length; j++) {
            items[j].classList.add('gsd-collapsed');
          }
          toggleBtn.textContent = 'Show ' + (items.length - 3) + ' older milestones';
        }
      });
      timeline.parentNode.insertBefore(toggleBtn, timeline.nextSibling);
    }
  }

  // --- Replace raw session UUID with friendly label ---
  var sessionIdEl = document.querySelector('.session-id');
  if (sessionIdEl) {
    var uuid = sessionIdEl.textContent.trim();
    sessionIdEl.title = uuid;
    sessionIdEl.textContent = 'Session ' + uuid.substring(0, 8);
  }

  // --- Hide message counter if all zeros ---
  var counter = document.querySelector('.message-counter');
  if (counter) {
    var total = counter.querySelector('.counter-total');
    if (total && total.textContent.includes(': 0')) {
      counter.style.display = 'none';
    }
  }

  // --- Fix velocity "314/318 plans" to be contextual ---
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
