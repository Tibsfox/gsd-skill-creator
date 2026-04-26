#!/usr/bin/env node
// Seed constellation.* tables from the inline data in constellation.html.
// One-time backfill so the existing graph isn't lost when we cut the page over to JSON.
// Idempotent — re-running upserts.
//
// Usage:
//   PG_PASSWORD=... node tools/build-constellation/seed-from-html.mjs [path/to/constellation.html]

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const DEFAULT_HTML = path.join(REPO, 'www/tibsfox/com/Research/constellation.html');

const htmlPath = process.argv[2] || DEFAULT_HTML;
if (!fs.existsSync(htmlPath)) {
  console.error(`constellation.html not found at ${htmlPath}`);
  console.error(`hint: curl https://tibsfox.com/Research/constellation.html -o ${htmlPath}`);
  process.exit(1);
}
const html = fs.readFileSync(htmlPath, 'utf8');

// --- Parsers -----------------------------------------------------------------

function extractClusters(src) {
  // var CLUSTERS=[ {name:'X',color:'#hex',ids:[...]}, ... ];
  const m = src.match(/var\s+CLUSTERS\s*=\s*\[([\s\S]*?)\];\s*\n\s*var\s+PROJECTS/);
  if (!m) throw new Error('CLUSTERS block not found');
  // eslint-disable-next-line no-new-func
  const arr = Function(`"use strict"; return ([${m[1]}]);`)();
  return arr.map((c, i) => ({ name: c.name, color: c.color, sort_order: i, ids: c.ids }));
}

function extractProjects(src) {
  const m = src.match(/'((?:[^'\\]|\\.)*?)'\.split\('\|'\)\.forEach\(function\(s\)\{var p=s\.split\(':'\);PROJECTS\.push/);
  if (!m) throw new Error('PROJECTS string not found');
  // unescape \'  →  '
  const raw = m[1].replace(/\\'/g, "'");
  return raw.split('|').map((s) => {
    const ix = s.indexOf(':');
    return { id: s.slice(0, ix), name: s.slice(ix + 1) };
  });
}

function extractEdges(src) {
  const m = src.match(/var\s+EDGES\s*=\s*\[\];\s*\n'([\s\S]*?)'\.split\('\;'\)\.forEach/);
  if (!m) throw new Error('EDGES string not found');
  const out = [];
  for (const group of m[1].split(';')) {
    if (!group) continue;
    const [src_id, rest] = group.split('>');
    if (!rest) continue;
    for (const dst_id of rest.split(',')) out.push({ src_id, dst_id });
  }
  return out;
}

function extractArtistData(src) {
  const m = src.match(/var\s+ARTIST_DATA\s*=\s*\[([\s\S]*?)\];\s*\n\s*var\s+SPECIES_DATA/);
  if (!m) throw new Error('ARTIST_DATA not found');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return ([${m[1]}]);`)();
}

function extractSpeciesData(src) {
  const m = src.match(/var\s+SPECIES_DATA\s*=\s*\[([\s\S]*?)\];\s*\n\s*\/\/\s*===\s*NASA/);
  if (!m) throw new Error('SPECIES_DATA not found');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return ([${m[1]}]);`)();
}

function extractNasaData(src) {
  const m = src.match(/var\s+NASA_DATA\s*=\s*\{([\s\S]*?)\n\}\s*;/);
  if (!m) throw new Error('NASA_DATA not found');
  // eslint-disable-next-line no-new-func
  return Function(`"use strict"; return ({${m[1]}});`)();
}

const clusters = extractClusters(html);
const projects = extractProjects(html);
const edges    = extractEdges(html);
const artists  = extractArtistData(html);
const species  = extractSpeciesData(html);
const nasa     = extractNasaData(html);

console.error(`parsed: clusters=${clusters.length} projects=${projects.length} edges=${edges.length} artists=${artists.length} species=${species.length} nasa=${Object.keys(nasa).length}`);

// --- Cluster membership map (id → cluster name) ------------------------------
const clusterOf = {};
for (const c of clusters) {
  for (const id of c.ids) {
    if (!clusterOf[id]) clusterOf[id] = c.name; // first wins, matches the page's renderer
  }
}

// --- Series code from id prefix ---------------------------------------------
function seriesCodeFor(id) {
  if (/^A\d{3}$/.test(id)) return 'S36';
  if (/^B\d{3}$/.test(id)) return 'SPS';
  if (/^N\d{3}$/.test(id) || id === 'NART') return 'NASA';
  return null;
}

// --- DB ----------------------------------------------------------------------
const client = new pg.Client({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER || 'maple',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DB || 'tibsfox',
});
await client.connect();
await client.query('SET search_path TO constellation, public');

await client.query('BEGIN');
try {
  // clusters
  for (const c of clusters) {
    await client.query(
      `INSERT INTO clusters(name, color, sort_order)
         VALUES ($1,$2,$3)
       ON CONFLICT (name) DO UPDATE SET color = EXCLUDED.color, sort_order = EXCLUDED.sort_order`,
      [c.name, c.color, c.sort_order],
    );
  }

  // projects
  for (const p of projects) {
    const cn = clusterOf[p.id] || null;
    const series = seriesCodeFor(p.id);
    await client.query(
      `INSERT INTO projects(id, name, cluster_name, series_code)
         VALUES ($1,$2,$3,$4)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             cluster_name = COALESCE(EXCLUDED.cluster_name, projects.cluster_name),
             series_code  = COALESCE(EXCLUDED.series_code,  projects.series_code)`,
      [p.id, p.name, cn, series],
    );
  }

  // edges — wipe + reload (graph topology, no value in preserving stale edges)
  await client.query('DELETE FROM edges');
  for (const e of edges) {
    // skip self-loops + missing endpoints
    if (e.src_id === e.dst_id) continue;
    await client.query(
      `INSERT INTO edges(src_id, dst_id) VALUES ($1,$2)
         ON CONFLICT DO NOTHING`,
      [e.src_id, e.dst_id],
    ).catch((err) => {
      // FK violation = orphan edge (id appears in EDGES but not in PROJECTS); skip
      if (err.code !== '23503') throw err;
    });
  }

  // artists — A000..A063 in declaration order
  for (let i = 0; i < artists.length; i++) {
    const id = `A${String(i).padStart(3, '0')}`;
    const a = artists[i];
    await client.query(
      `INSERT INTO artists(project_id, artist, genre, energy, xrefs)
         VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (project_id) DO UPDATE
         SET artist = EXCLUDED.artist, genre = EXCLUDED.genre,
             energy = EXCLUDED.energy, xrefs = EXCLUDED.xrefs`,
      [id, a.a, a.g, a.e, a.x || []],
    ).catch((err) => { if (err.code !== '23503') throw err; });
  }

  // species — B000..B063 in declaration order
  for (let i = 0; i < species.length; i++) {
    const id = `B${String(i).padStart(3, '0')}`;
    const s = species[i];
    await client.query(
      `INSERT INTO species(project_id, common, scientific, family, taxon_order, energy, trait)
         VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (project_id) DO UPDATE
         SET common = EXCLUDED.common, scientific = EXCLUDED.scientific,
             family = EXCLUDED.family, taxon_order = EXCLUDED.taxon_order,
             energy = EXCLUDED.energy, trait = EXCLUDED.trait`,
      [id, s.s, s.n, s.f, s.o, s.e, s.t],
    ).catch((err) => { if (err.code !== '23503') throw err; });
  }

  // nasa
  for (const [id, n] of Object.entries(nasa)) {
    await client.query(
      `INSERT INTO nasa_missions(project_id, title, launch_date, organism, sci_name, node_count, crew, is_artemis)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (project_id) DO UPDATE
         SET title = EXCLUDED.title, launch_date = EXCLUDED.launch_date,
             organism = EXCLUDED.organism, sci_name = EXCLUDED.sci_name,
             node_count = EXCLUDED.node_count, crew = EXCLUDED.crew,
             is_artemis = EXCLUDED.is_artemis`,
      [id, n.title, n.date || null, n.organism, n.sciName || null, n.nodes ?? null, n.crew || null, !!n.isArtemis],
    ).catch((err) => { if (err.code !== '23503') throw err; });
  }

  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
}

const totals = await client.query(`
  SELECT
    (SELECT count(*) FROM clusters)      AS clusters,
    (SELECT count(*) FROM projects)      AS projects,
    (SELECT count(*) FROM edges)         AS edges,
    (SELECT count(*) FROM artists)       AS artists,
    (SELECT count(*) FROM species)       AS species,
    (SELECT count(*) FROM nasa_missions) AS nasa
`);
console.error('seeded:', totals.rows[0]);

await client.end();
