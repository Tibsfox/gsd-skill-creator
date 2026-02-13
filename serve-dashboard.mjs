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
      content = content.replace('</body>', `${LIVE_RELOAD_SCRIPT}\n</body>`);
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
