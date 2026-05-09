#!/usr/bin/env node
// =============================================================================
// dashboard-service / serve.mjs
// =============================================================================
// Local HTTP server for the SCRIBE dashboard.
//
// Architecture:
//   - Serves static dashboard files from ../dashboard/.
//   - /api/graph/sample — always served from data/sample-graph.json (static).
//   - /api/graph/upstream/:nodeId?depth=N — proxies to T5's upstream() SQL fn.
//   - /api/graph/downstream/:nodeId?depth=N — proxies to T5's downstream() SQL fn.
//   - /api/search?q=<text>&limit=<n> — proxies to hybrid_search() SQL fn (text-only).
//
// Mode switching:
//   SCRIBE_DB_MODE=static (default / no PG env)  → static-only (upstream/downstream/search → 501)
//   SCRIBE_DB_MODE=live                           → live PG mode
//   PG env vars present (RH_POSTGRES_URL / PGHOST+...) → automatically live unless SCRIBE_DB_MODE=static
//
// PG env-loading discipline mirrors tools/release-history/run-with-pg.mjs exactly:
//   - RH_ENV_FILE=/path overrides the .env location
//   - ARTEMIS_REPO_ENV=/path is the deprecated alias (still honored; emits warning)
//   - <repo-root>/.env is the default
//   - Within the .env: RH_POSTGRES_URL (preferred) or PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD
//
// Usage:
//   node serve.mjs                                   # static-only on :8088
//   PORT=9090 node serve.mjs                         # custom port
//   RH_POSTGRES_URL=... node serve.mjs               # live PG mode
//   SCRIBE_DB_MODE=live node serve.mjs               # explicit live mode
//   SCRIBE_DB_MODE=static node serve.mjs             # force static even if PG configured
//
// Endpoints:
//   GET /                              → index.html (dashboard)
//   GET /<path>                        → static file under ../dashboard/
//   GET /api/graph/sample              → data/sample-graph.json (always static)
//   GET  /api/graph/upstream/:nodeId    → T5 upstream() SQL traversal
//   GET  /api/graph/downstream/:nodeId  → T5 downstream() SQL traversal
//   GET  /api/search?q=<text>&limit=<n> → T5 hybrid_search() (text-only path)
//   POST /api/roundtrip/event           → Component 05: round-trip event prov_node insert (CAP-019)
//
// Run migrate.mjs first to apply migrations against a fresh DB.
// =============================================================================

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { detectMode, createPool, query } from './db.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DASHBOARD_DIR = path.resolve(__dirname, '..', 'dashboard');
const PORT = parseInt(process.env.PORT || '8088', 10);

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.glsl': 'text/plain; charset=utf-8',
  '.wgsl': 'text/plain; charset=utf-8',
};

// ---------------------------------------------------------------------------
// Mode detection + pool initialization
// ---------------------------------------------------------------------------

const { live, pgConfig } = detectMode();

/** @type {import('pg').Pool | null} */
let pool = null;

if (live && pgConfig) {
  // Initialize pool asynchronously — endpoints check for null pool and return 501 if not ready.
  createPool(pgConfig.url)
    .then(p => {
      pool = p;
      console.log('[serve] PG pool ready — live mode active');
    })
    .catch(err => {
      console.error(`[serve] WARNING: Failed to create PG pool: ${err.message}`);
      console.error('[serve] Falling back to static mode for PG endpoints');
    });
}

// ---------------------------------------------------------------------------
// Endpoint helpers
// ---------------------------------------------------------------------------

/**
 * Send a JSON response.
 * @param {http.ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function sendJson(res, status, body) {
  const json = JSON.stringify(body);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-cache',
    'Content-Length': Buffer.byteLength(json),
  });
  res.end(json);
}

/**
 * Returns the standard 501 pg_not_configured response.
 */
function sendPgNotConfigured(res) {
  sendJson(res, 501, {
    error: 'pg_not_configured',
    hint: 'set RH_POSTGRES_URL or PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD (see README.md)',
  });
}

// ---------------------------------------------------------------------------
// Round-trip event persistence helpers (Component 05)
// ---------------------------------------------------------------------------

/**
 * Read the full request body as a string.
 * @param {import('node:http').IncomingMessage} req
 * @returns {Promise<string>}
 */
async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/**
 * Sub-type discriminator constant (mirrors KNOWN_SUB_TYPES.roundtripEvent from
 * src/scribe/types/prov.ts — duplicated here to avoid a TS→MJS import in plain JS).
 * Component 05 substrate-decision: sub_type is the open discriminator; 'roundtrip-event'
 * is the value registered in KNOWN_SUB_TYPES.
 */
const ROUNDTRIP_SUB_TYPE = 'roundtrip-event';

/**
 * Compute a deterministic edge_id: sha256(src || relation || dst).slice(0, 16).
 * Mirrors the EdgeIdRecipe from src/scribe/types/prov.ts.
 * @param {string} src
 * @param {string} relation
 * @param {string} dst
 * @returns {string}
 */
import { createHash } from 'node:crypto';

function computeEdgeId(src, relation, dst) {
  return createHash('sha256').update(src + relation + dst).digest('hex').slice(0, 16);
}

/**
 * Validate the minimal required fields of a RoundTripMetadata payload.
 * Returns null on success, or an error string on failure.
 * @param {unknown} raw
 * @returns {string | null}
 */
function validateRoundtripPayload(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return 'payload must be a non-null object';
  }
  const { direction, sourceLanguage, targetLanguage, sourceSha, targetSha, svgSha } = raw;
  if (direction !== 'forward' && direction !== 'reverse') {
    return `direction must be 'forward' or 'reverse'; got ${JSON.stringify(direction)}`;
  }
  if (typeof sourceLanguage !== 'string' || !sourceLanguage.trim()) {
    return 'sourceLanguage must be a non-empty string';
  }
  if (typeof targetLanguage !== 'string' || !targetLanguage.trim()) {
    return 'targetLanguage must be a non-empty string';
  }
  const hex40 = /^[0-9a-f]{40}$/i;
  if (typeof sourceSha !== 'string' || !hex40.test(sourceSha)) {
    return `sourceSha must be a 40-char hex string; got ${JSON.stringify(sourceSha)}`;
  }
  if (typeof targetSha !== 'string' || !hex40.test(targetSha)) {
    return `targetSha must be a 40-char hex string; got ${JSON.stringify(targetSha)}`;
  }
  if (typeof svgSha !== 'string' || !hex40.test(svgSha)) {
    return `svgSha must be a 40-char hex string; got ${JSON.stringify(svgSha)}`;
  }
  return null;
}

/**
 * Handle POST /api/roundtrip/event.
 *
 * Idempotency: if (sourceSha, targetSha, svgSha, direction) already exists → skip insert,
 * return 200 + { ok: true, nodeId: <existing>, edgeIds: [], deduplicated: true }.
 *
 * @param {import('node:http').IncomingMessage} req
 * @param {import('node:http').ServerResponse} res
 */
async function handleRoundtripEvent(req, res) {
  if (!pool) {
    return sendPgNotConfigured(res);
  }

  // 1. Read + parse body
  let body;
  try {
    const raw = await readBody(req);
    body = JSON.parse(raw);
  } catch (_err) {
    return sendJson(res, 400, { error: 'invalid_payload', hint: 'Body must be valid JSON' });
  }

  // 2. Validate
  const validationErr = validateRoundtripPayload(body);
  if (validationErr) {
    return sendJson(res, 400, { error: 'invalid_payload', hint: validationErr });
  }

  const { direction, sourceLanguage, targetLanguage, sourceSha, targetSha, svgSha, emittedAt, extras } = body;

  // 3. Idempotency check — skip insert if SHA-4-tuple already exists
  try {
    const idempotencyResult = await query(
      pool,
      `SELECT node_id FROM prov_node
       WHERE  sub_type                            = $1
         AND  payload->'roundTrip'->>'sourceSha' = $2
         AND  payload->'roundTrip'->>'targetSha' = $3
         AND  payload->'roundTrip'->>'svgSha'    = $4
         AND  payload->'roundTrip'->>'direction' = $5
       LIMIT 1`,
      [ROUNDTRIP_SUB_TYPE, sourceSha, targetSha, svgSha, direction],
    );

    if (idempotencyResult.rows.length > 0) {
      const existingNodeId = idempotencyResult.rows[0].node_id;
      return sendJson(res, 200, {
        ok: true,
        nodeId: existingNodeId,
        edgeIds: [],
        deduplicated: true,
      });
    }
  } catch (err) {
    console.error(`[serve] roundtrip idempotency check failed: ${err.message}`);
    return sendJson(res, 500, { error: 'query_failed', hint: err.message });
  }

  // 4. Insert prov_node + source-artifact phantom + edge
  try {
    // Build human-readable label
    const exampleId = extras?.exampleId;
    const label = exampleId
      ? `roundtrip(${exampleId}): ${direction}`
      : `roundtrip: ${direction}`;

    // Serialise the RoundTripMetadata as the roundTrip namespace payload
    const rtPayload = { direction, sourceLanguage, targetLanguage, sourceSha, targetSha, svgSha };
    if (emittedAt !== undefined) rtPayload.emittedAt = emittedAt;
    if (extras !== undefined) rtPayload.extras = extras;

    // 4a. Insert prov_node Activity (gen_random_uuid() server-side)
    const { rows: nodeRows } = await query(
      pool,
      `INSERT INTO prov_node (node_id, node_type, sub_type, label, payload, created_at)
       VALUES (
         gen_random_uuid()::text,
         'Activity',
         $1,
         $2,
         jsonb_build_object('roundTrip', $3::jsonb),
         now()
       )
       RETURNING node_id`,
      [ROUNDTRIP_SUB_TYPE, label, JSON.stringify(rtPayload)],
    );

    if (!nodeRows.length || typeof nodeRows[0].node_id !== 'string') {
      return sendJson(res, 500, { error: 'query_failed', hint: 'INSERT prov_node returned no node_id' });
    }

    const nodeId = nodeRows[0].node_id;

    // 4b. Ensure source-artifact Entity node exists (phantom, idempotent)
    const sourceArtifactId = `roundtrip-artifact:${sourceSha}`;
    await query(
      pool,
      `INSERT INTO prov_node (node_id, node_type, sub_type, label, payload)
       VALUES ($1, 'Entity', 'roundtrip-artifact', $2, '{}'::jsonb)
       ON CONFLICT (node_id) DO NOTHING`,
      [sourceArtifactId, `source-artifact:${sourceSha}`],
    );

    // 4c. Insert wasDerivedFrom edge (event → source artifact)
    const edgeId = computeEdgeId(nodeId, 'wasDerivedFrom', sourceArtifactId);
    await query(
      pool,
      `INSERT INTO prov_edge (edge_id, src_id, relation, dst_id)
       VALUES ($1, $2, 'wasDerivedFrom', $3)
       ON CONFLICT DO NOTHING`,
      [edgeId, nodeId, sourceArtifactId],
    );

    return sendJson(res, 200, {
      ok: true,
      nodeId,
      edgeIds: [edgeId],
      deduplicated: false,
    });
  } catch (err) {
    console.error(`[serve] roundtrip event insert failed: ${err.message}`);
    return sendJson(res, 500, { error: 'query_failed', hint: err.message });
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

/**
 * Handle /api/graph/upstream/:nodeId?depth=N
 * Calls: SELECT * FROM scribe.upstream($1, $2)
 */
async function handleUpstream(res, nodeId, depth) {
  if (!pool) {
    return sendPgNotConfigured(res);
  }
  try {
    const { rows } = await query(
      pool,
      'SELECT * FROM scribe.upstream($1, $2)',
      [nodeId, depth],
    );
    sendJson(res, 200, {
      origin: nodeId,
      direction: 'upstream',
      depth,
      rows,
    });
  } catch (err) {
    console.error(`[serve] upstream query failed: ${err.message}`);
    sendJson(res, 500, { error: 'query_failed', hint: err.message });
  }
}

/**
 * Handle /api/graph/downstream/:nodeId?depth=N
 * Calls: SELECT * FROM scribe.downstream($1, $2)
 */
async function handleDownstream(res, nodeId, depth) {
  if (!pool) {
    return sendPgNotConfigured(res);
  }
  try {
    const { rows } = await query(
      pool,
      'SELECT * FROM scribe.downstream($1, $2)',
      [nodeId, depth],
    );
    sendJson(res, 200, {
      origin: nodeId,
      direction: 'downstream',
      depth,
      rows,
    });
  } catch (err) {
    console.error(`[serve] downstream query failed: ${err.message}`);
    sendJson(res, 500, { error: 'query_failed', hint: err.message });
  }
}

/**
 * Handle /api/search?q=<text>&limit=<n>
 * Calls: SELECT * FROM scribe.hybrid_search($1, NULL, NULL, $2)
 * Text-only path — vector arg is NULL (embedding endpoint deferred to later component).
 */
async function handleSearch(res, q, limit) {
  if (!pool) {
    return sendPgNotConfigured(res);
  }
  try {
    // Text-only path: query_emb = NULL, sub_type_filter = NULL.
    const { rows } = await query(
      pool,
      'SELECT * FROM scribe.hybrid_search($1, NULL, NULL, $2)',
      [q, limit],
    );
    // Add 1-based rank.
    const results = rows.map((row, i) => ({ ...row, rank: i + 1 }));
    sendJson(res, 200, { query: q, limit, results });
  } catch (err) {
    console.error(`[serve] search query failed: ${err.message}`);
    sendJson(res, 500, { error: 'query_failed', hint: err.message });
  }
}

// ---------------------------------------------------------------------------
// HTTP server
// ---------------------------------------------------------------------------

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const pathname = url.pathname;

  // ─── /api/graph/sample — always static ───────────────────────────────────
  if (pathname === '/api/graph/sample') {
    return serveStatic(req, res, path.join(DASHBOARD_DIR, 'data', 'sample-graph.json'));
  }

  // ─── /api/graph/upstream/:nodeId ─────────────────────────────────────────
  // Support both /api/graph/upstream/<nodeId> (path param) and
  // /api/graph/upstream?node=<nodeId> (query param, backward-compat with T4 floor demo)
  const upstreamMatch = pathname.match(/^\/api\/graph\/upstream\/(.+)$/);
  const upstreamLegacy = pathname === '/api/graph/upstream';
  if (upstreamMatch || upstreamLegacy) {
    const nodeId = upstreamMatch
      ? decodeURIComponent(upstreamMatch[1])
      : url.searchParams.get('node') ?? '';
    const depth = Math.min(
      parseInt(url.searchParams.get('depth') || '3', 10),
      10, // safety cap matching SQL default max
    );
    if (!nodeId) {
      return sendJson(res, 400, { error: 'missing_node_id', hint: 'Provide nodeId in path or ?node= query param' });
    }
    return handleUpstream(res, nodeId, depth);
  }

  // ─── /api/graph/downstream/:nodeId ───────────────────────────────────────
  const downstreamMatch = pathname.match(/^\/api\/graph\/downstream\/(.+)$/);
  const downstreamLegacy = pathname === '/api/graph/downstream';
  if (downstreamMatch || downstreamLegacy) {
    const nodeId = downstreamMatch
      ? decodeURIComponent(downstreamMatch[1])
      : url.searchParams.get('node') ?? '';
    const depth = Math.min(
      parseInt(url.searchParams.get('depth') || '3', 10),
      10,
    );
    if (!nodeId) {
      return sendJson(res, 400, { error: 'missing_node_id', hint: 'Provide nodeId in path or ?node= query param' });
    }
    return handleDownstream(res, nodeId, depth);
  }

  // ─── /api/search ─────────────────────────────────────────────────────────
  if (pathname === '/api/search') {
    const q = url.searchParams.get('q') ?? '';
    const limit = Math.min(
      parseInt(url.searchParams.get('limit') || '20', 10),
      100, // safety cap
    );
    if (!q) {
      return sendJson(res, 400, { error: 'missing_query', hint: 'Provide ?q=<text>' });
    }
    return handleSearch(res, q, limit);
  }

  // ─── /api/roundtrip/event (POST) ─────────────────────────────────────────
  // Component 05 — Round-Trip Event Persistence (CAP-019 / CAP-042).
  // Accepts a RoundTripMetadata JSON body, inserts prov_node + wasDerivedFrom edge,
  // returns { ok, nodeId, edgeIds, deduplicated }.
  if (pathname === '/api/roundtrip/event' && req.method === 'POST') {
    return handleRoundtripEvent(req, res);
  }
  // Method guard: reject non-POST to this endpoint.
  if (pathname === '/api/roundtrip/event') {
    return sendJson(res, 405, { error: 'method_not_allowed', hint: 'Use POST' });
  }

  // ─── Static dashboard files ───────────────────────────────────────────────
  let p = pathname === '/' ? '/index.html' : pathname;
  // Path traversal guard.
  p = path.normalize(p).replace(/^(\.\.[/\\])+/g, '');
  const filePath = path.join(DASHBOARD_DIR, p);
  if (!filePath.startsWith(DASHBOARD_DIR)) {
    res.writeHead(403); return res.end('forbidden');
  }
  return serveStatic(req, res, filePath);
});

function serveStatic(req, res, filePath) {
  fs.stat(filePath, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('not found');
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    fs.createReadStream(filePath).pipe(res);
  });
}

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

server.listen(PORT, '127.0.0.1', () => {
  console.log(`SCRIBE dashboard service on http://127.0.0.1:${PORT}/`);
  console.log(`  static root:  ${DASHBOARD_DIR}`);
  console.log(`  mode:         ${live ? 'live (PG)' : 'static (no PG)'}`);
  if (live && pgConfig) {
    console.log(`  pg source:    ${pgConfig.source}`);
    console.log(`  Note: PG pool initializing asynchronously — ready in <1s`);
  } else {
    console.log(`  Hint: set RH_POSTGRES_URL or PGHOST/PGPORT/PGUSER/PGDATABASE/PGPASSWORD for live mode`);
  }
});
