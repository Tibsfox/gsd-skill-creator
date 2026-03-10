/**
 * SYS Proof of Concept — Trust-Based Access Server
 *
 * A zero-dependency Node.js HTTP server that demonstrates trust-based
 * bandwidth control, access logging, and anti-waste metrics.
 *
 * Run: node server.mjs
 * Dashboard: http://localhost:3000/_dashboard
 *
 * Zero external dependencies — built-in http, fs, path, url, crypto only.
 */

import { createServer } from 'node:http';
import { readFile, stat, appendFile } from 'node:fs/promises';
import { createReadStream } from 'node:fs';
import { join, extname, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// Constants & paths
// ---------------------------------------------------------------------------

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const CONFIG_PATH    = join(__dirname, 'trust-config.json');
const DASHBOARD_PATH = join(__dirname, 'dashboard.html');
const LOG_PATH       = join(__dirname, 'access.log');

// ---------------------------------------------------------------------------
// Config loader
// ---------------------------------------------------------------------------

let config = null;

async function loadConfig() {
  const raw = await readFile(CONFIG_PATH, 'utf-8');
  config = JSON.parse(raw);
  return config;
}

// ---------------------------------------------------------------------------
// MIME types
// ---------------------------------------------------------------------------

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md':   'text/markdown; charset=utf-8',
  '.txt':  'text/plain; charset=utf-8',
  '.pdf':  'application/pdf',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif':  'image/gif',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.xml':  'application/xml',
  '.yaml': 'text/yaml; charset=utf-8',
  '.yml':  'text/yaml; charset=utf-8',
};

function getMimeType(filePath) {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

// ---------------------------------------------------------------------------
// Metrics store
// ---------------------------------------------------------------------------

const serverStartTime = Date.now();

const metrics = {
  totalRequests: 0,
  byTier: {},       // tier -> { requests, bytesServed }
  recentLogs: [],   // last 100 log entries
};

function initTierMetrics() {
  for (const tier of Object.keys(config.tiers)) {
    if (!metrics.byTier[tier]) {
      metrics.byTier[tier] = { requests: 0, bytesServed: 0 };
    }
  }
}

function recordRequest(tier, bytesServed) {
  metrics.totalRequests++;
  if (!metrics.byTier[tier]) {
    metrics.byTier[tier] = { requests: 0, bytesServed: 0 };
  }
  metrics.byTier[tier].requests++;
  metrics.byTier[tier].bytesServed += bytesServed;
}

function addRecentLog(entry) {
  metrics.recentLogs.push(entry);
  if (metrics.recentLogs.length > 100) {
    metrics.recentLogs.shift();
  }
}

function getWasteRatio() {
  const wasteKeys = ['unknown'];
  let wasteRequests = 0;
  let totalRequests = 0;
  for (const [tier, data] of Object.entries(metrics.byTier)) {
    totalRequests += data.requests;
    if (wasteKeys.includes(tier)) {
      wasteRequests += data.requests;
    }
  }
  return totalRequests === 0 ? 0 : wasteRequests / totalRequests;
}

// ---------------------------------------------------------------------------
// Client identification & trust resolution
// ---------------------------------------------------------------------------

function getClientIp(req) {
  // Normalize IPv6-mapped IPv4
  let ip = req.socket.remoteAddress || '0.0.0.0';
  if (ip === '::ffff:127.0.0.1') ip = '127.0.0.1';
  return ip;
}

function isBot(userAgent) {
  if (!userAgent) return false;
  const ua = userAgent.toLowerCase();
  return config.botPatterns.some(pattern => ua.includes(pattern.toLowerCase()));
}

function resolveTrust(ip, userAgent) {
  // Bots are always unknown
  if (isBot(userAgent)) return 'unknown';
  // Check explicit client mapping
  if (config.clients[ip]) return config.clients[ip];
  // Default
  return 'unknown';
}

function getTierConfig(tier) {
  return config.tiers[tier] || config.tiers['unknown'];
}

// ---------------------------------------------------------------------------
// Access logging
// ---------------------------------------------------------------------------

function colorForTier(tier) {
  const colors = {
    owner:   '\x1b[92m',  // bright green
    trusted: '\x1b[96m',  // bright cyan
    known:   '\x1b[93m',  // bright yellow
    visitor: '\x1b[33m',  // yellow
    unknown: '\x1b[91m',  // bright red
  };
  return colors[tier] || '\x1b[0m';
}

async function logAccess(entry) {
  // JSONL to file
  const line = JSON.stringify(entry) + '\n';
  appendFile(LOG_PATH, line).catch(() => {});

  // Compact console output
  const c = colorForTier(entry.tier);
  const reset = '\x1b[0m';
  const dim = '\x1b[2m';
  const tierPad = entry.tier.padEnd(7);
  const statusColor = entry.status < 400 ? '\x1b[92m' : '\x1b[91m';
  const bps = entry.bytesPerSecAllowed === -1
    ? 'unlimited'
    : formatBytes(entry.bytesPerSecAllowed) + '/s';

  console.log(
    `${dim}${entry.timestamp.slice(11, 19)}${reset} ` +
    `${statusColor}${entry.status}${reset} ` +
    `${c}[${tierPad}]${reset} ` +
    `${entry.method} ${entry.url} ` +
    `${dim}${formatBytes(entry.bytesServed)} @ ${bps} ${entry.responseTimeMs}ms${reset}`
  );

  // Store for dashboard
  addRecentLog(entry);
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  if (bytes < 0) return 'unlimited';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let val = bytes;
  while (val >= 1024 && i < units.length - 1) { val /= 1024; i++; }
  return val.toFixed(i === 0 ? 0 : 1) + ' ' + units[i];
}

// ---------------------------------------------------------------------------
// Throttled stream delivery
// ---------------------------------------------------------------------------

async function sendThrottled(res, filePath, bytesPerSecond, mimeType) {
  const fileStat = await stat(filePath);
  const fileSize = fileStat.size;

  res.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': fileSize,
  });

  // Unlimited — stream the entire file without throttling
  if (bytesPerSecond < 0) {
    return new Promise((resolve, reject) => {
      const stream = createReadStream(filePath);
      stream.pipe(res);
      stream.on('end', () => resolve(fileSize));
      stream.on('error', reject);
      res.on('close', () => { if (!res.writableEnded) stream.destroy(); });
    });
  }

  // Throttled — deliver in chunks at the tier's rate
  // Chunk interval: send a chunk every 100ms (10 times per second)
  const intervalMs = 100;
  const chunkSize = Math.max(1, Math.floor(bytesPerSecond / (1000 / intervalMs)));

  return new Promise((resolve, reject) => {
    const stream = createReadStream(filePath, { highWaterMark: chunkSize });
    let bytesSent = 0;
    let destroyed = false;

    const cleanup = () => {
      destroyed = true;
      stream.destroy();
    };

    res.on('close', cleanup);
    res.on('error', cleanup);

    stream.on('readable', () => {
      const drainChunk = () => {
        if (destroyed) return;
        const chunk = stream.read(chunkSize);
        if (chunk === null) return; // no more data right now
        bytesSent += chunk.length;
        const canContinue = res.write(chunk);
        if (canContinue) {
          setTimeout(drainChunk, intervalMs);
        } else {
          res.once('drain', () => setTimeout(drainChunk, intervalMs));
        }
      };
      drainChunk();
    });

    stream.on('end', () => {
      if (!destroyed) res.end();
      resolve(bytesSent);
    });

    stream.on('error', (err) => {
      if (!destroyed) {
        res.statusCode = 500;
        res.end('Internal Server Error');
      }
      reject(err);
    });
  });
}

// ---------------------------------------------------------------------------
// Route: /_api/stats
// ---------------------------------------------------------------------------

function handleApiStats(req, res) {
  const uptime = Date.now() - serverStartTime;
  const payload = {
    uptime,
    uptimeFormatted: formatUptime(uptime),
    totalRequests: metrics.totalRequests,
    wasteRatio: getWasteRatio(),
    tiers: {},
    recentLogs: metrics.recentLogs.slice(-100),
  };

  for (const [tier, tierConfig] of Object.entries(config.tiers)) {
    const data = metrics.byTier[tier] || { requests: 0, bytesServed: 0 };
    payload.tiers[tier] = {
      label: tierConfig.label,
      bytesPerSecond: tierConfig.bytesPerSecond,
      requests: data.requests,
      bytesServed: data.bytesServed,
      bytesServedFormatted: formatBytes(data.bytesServed),
    };
  }

  const body = JSON.stringify(payload, null, 2);
  res.writeHead(200, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
  });
  res.end(body);
}

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const parts = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${sec}s`);
  return parts.join(' ');
}

// ---------------------------------------------------------------------------
// Route: /_dashboard
// ---------------------------------------------------------------------------

async function handleDashboard(req, res) {
  try {
    const html = await readFile(DASHBOARD_PATH, 'utf-8');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(html);
  } catch {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('Dashboard not found');
  }
}

// ---------------------------------------------------------------------------
// Route: static files
// ---------------------------------------------------------------------------

async function handleStaticFile(req, res, urlPath, tier, tierConfig) {
  const staticRoot = resolve(__dirname, config.server.staticRoot);

  // Resolve the file path
  let filePath = join(staticRoot, urlPath);

  // Security: prevent directory traversal
  const resolved = resolve(filePath);
  if (!resolved.startsWith(staticRoot)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Forbidden');
    return { status: 403, bytes: 0 };
  }

  // Directory request — try index.html
  try {
    const s = await stat(resolved);
    if (s.isDirectory()) {
      filePath = join(resolved, 'index.html');
    }
  } catch {
    // file doesn't exist — will 404 below
  }

  // Check file exists
  try {
    const s = await stat(filePath);
    if (!s.isFile()) throw new Error('Not a file');
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('404 Not Found');
    return { status: 404, bytes: 0 };
  }

  const mimeType = getMimeType(filePath);
  const bytesPerSecond = tierConfig.bytesPerSecond;

  try {
    const bytesSent = await sendThrottled(res, filePath, bytesPerSecond, mimeType);
    return { status: 200, bytes: bytesSent };
  } catch {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
    return { status: 500, bytes: 0 };
  }
}

// ---------------------------------------------------------------------------
// Request handler
// ---------------------------------------------------------------------------

async function handleRequest(req, res) {
  const startTime = Date.now();
  const ip = getClientIp(req);
  const userAgent = req.headers['user-agent'] || '';
  const tier = resolveTrust(ip, userAgent);
  const tierConfig = getTierConfig(tier);

  // Parse URL
  let urlPath;
  try {
    urlPath = decodeURIComponent(new URL(req.url, `http://${req.headers.host || 'localhost'}`).pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain' });
    res.end('Bad Request');
    return;
  }

  let status = 200;
  let bytesServed = 0;

  try {
    // Internal routes (not throttled — always fast)
    if (urlPath === '/_dashboard' || urlPath === '/_dashboard/') {
      await handleDashboard(req, res);
      status = 200;
      bytesServed = 0; // not tracked for dashboard
    } else if (urlPath === '/_api/stats') {
      handleApiStats(req, res);
      status = 200;
      bytesServed = 0;
    } else {
      // Static file serving — throttled by trust tier
      const result = await handleStaticFile(req, res, urlPath, tier, tierConfig);
      status = result.status;
      bytesServed = result.bytes;
    }
  } catch (err) {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
    status = 500;
  }

  const responseTimeMs = Date.now() - startTime;

  // Record metrics
  recordRequest(tier, bytesServed);

  // Log access
  const entry = {
    timestamp: new Date().toISOString(),
    ip,
    tier,
    method: req.method,
    url: urlPath,
    status,
    bytesServed,
    bytesPerSecAllowed: tierConfig.bytesPerSecond,
    userAgent: userAgent.slice(0, 80),
    responseTimeMs,
  };

  await logAccess(entry);
}

// ---------------------------------------------------------------------------
// Server startup
// ---------------------------------------------------------------------------

async function start() {
  await loadConfig();
  initTierMetrics();

  const { port, host } = config.server;

  const server = createServer(handleRequest);

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\x1b[91mPort ${port} is already in use.\x1b[0m`);
      console.error(`  Either stop the other process or change the port in trust-config.json`);
      process.exit(1);
    }
    throw err;
  });

  server.listen(port, host, () => {
    const bar = '='.repeat(60);
    console.log(`\n\x1b[92m${bar}\x1b[0m`);
    console.log(`\x1b[92m  SYS Proof of Concept — Trust-Based Access Server\x1b[0m`);
    console.log(`\x1b[92m${bar}\x1b[0m\n`);
    console.log(`  Server:     http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/`);
    console.log(`  Dashboard:  http://${host === '0.0.0.0' ? 'localhost' : host}:${port}/_dashboard`);
    console.log(`  Static root: ${resolve(__dirname, config.server.staticRoot)}`);
    console.log(`  Log file:   ${LOG_PATH}\n`);

    console.log(`  Trust tiers:`);
    for (const [name, tierCfg] of Object.entries(config.tiers)) {
      const bps = tierCfg.bytesPerSecond === -1 ? 'unlimited' : formatBytes(tierCfg.bytesPerSecond) + '/s';
      const mapped = Object.entries(config.clients)
        .filter(([, t]) => t === name)
        .map(([ip]) => ip);
      const clients = mapped.length > 0 ? ` (${mapped.join(', ')})` : '';
      console.log(`    ${name.padEnd(8)} ${bps.padEnd(12)} ${tierCfg.label}${clients}`);
    }

    console.log(`\n  Bot patterns: ${config.botPatterns.join(', ')}`);
    console.log(`\n\x1b[2m  Press Ctrl+C to stop\x1b[0m\n`);
    console.log(`\x1b[92m${bar}\x1b[0m\n`);
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n\x1b[93m  Shutting down...\x1b[0m');
    server.close(() => {
      console.log(`\x1b[92m  Server stopped. Served ${metrics.totalRequests} requests.\x1b[0m\n`);
      process.exit(0);
    });
    // Force exit after 3 seconds
    setTimeout(() => process.exit(0), 3000);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start().catch((err) => {
  console.error('\x1b[91mFailed to start server:\x1b[0m', err.message);
  process.exit(1);
});
