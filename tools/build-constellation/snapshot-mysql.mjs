#!/usr/bin/env node
// Query the live remote MySQL (tibsfox2_claudefox) and write the same JSON
// bundle the static fallback path expects. Same shapes the PHP api.php emits.
//
// Run after every release; the output is FTP'd alongside the page so the
// constellation map keeps working when PHP is down.
//
// env (loaded from .env):
//   DB_HOST DB_PORT DB_USER DB_PASS DB_NAME

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const OUT  = path.join(REPO, 'www/tibsfox/com/Research/constellation');
fs.mkdirSync(OUT, { recursive: true });

// Load .env minimally — we only need 5 keys.
const env = (() => {
  const out = {};
  const txt = fs.readFileSync(path.join(REPO, '.env'), 'utf8');
  for (const raw of txt.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    let v = m[2];
    // strip a single matching pair of " or ' from the outside
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
})();

const remoteHost = process.env.DB_HOST_REMOTE || '216.222.199.72';

const conn = await mysql.createConnection({
  host: remoteHost, // localhost is host-only; from this dev box use the public IP
  port: Number(env.DB_PORT || 3306),
  user: env.DB_USER,
  password: env.DB_PASS,
  database: env.DB_NAME,
});

const CLUSTER_PALETTE = {
  Ecology:'#4CAF50', Electronics:'#FFB300', Infrastructure:'#78909C',
  Energy:'#FF7043', Creative:'#EC407A', Business:'#42A5F5',
  Vision:'#AB47BC', Broadcasting:'#26A69A', Science:'#5C6BC0',
  Music:'#EF5350', Space:'#1E88E5', AI:'#7E57C2', Graphics:'#8E24AA',
};
const CLUSTER_ORDER = Object.keys(CLUSTER_PALETTE);

async function fetchClusters() {
  const [rows] = await conn.query(
    "SELECT cluster AS name FROM projects WHERE cluster <> '' GROUP BY cluster"
  );
  const out = [];
  for (const r of rows) {
    if (!CLUSTER_PALETTE[r.name]) continue;
    out.push({ name: r.name, color: CLUSTER_PALETTE[r.name], sort_order: CLUSTER_ORDER.indexOf(r.name) });
  }
  out.sort((a, b) => a.sort_order - b.sort_order);
  return out;
}
async function fetchProjects() {
  const [rows] = await conn.query(
    "SELECT id, name, cluster AS cluster_name, path AS detail_url FROM projects ORDER BY id"
  );
  for (const r of rows) {
    r.series_code = /^A\d{3}$/.test(r.id) ? 'S36'
                  : /^B\d{3}$/.test(r.id) ? 'SPS'
                  : /^N\d{3}$/.test(r.id) || r.id === 'NART' ? 'NASA'
                  : /^M[\d.]+$/.test(r.id) ? 'NASA'
                  : null;
    if (r.cluster_name === '') r.cluster_name = null;
    if (r.detail_url   === '') r.detail_url   = null;
  }
  return rows;
}
async function fetchEdges() {
  const [rows] = await conn.query(
    "SELECT source_id AS src_id, target_id AS dst_id, 1.0 AS weight FROM cross_refs ORDER BY source_id, target_id"
  );
  return rows;
}
async function fetchArtists() {
  const [rows] = await conn.query(
    'SELECT project_id, artist, genre, energy, xrefs FROM artists ORDER BY project_id'
  );
  for (const r of rows) {
    r.xrefs = r.xrefs ? (typeof r.xrefs === 'string' ? JSON.parse(r.xrefs) : r.xrefs) : [];
    r.energy = r.energy === null ? null : Number(r.energy);
  }
  return rows;
}
async function fetchSpecies() {
  const [rows] = await conn.query(
    'SELECT project_id, common, scientific, family, taxon_order, energy, trait FROM species ORDER BY project_id'
  );
  for (const r of rows) r.energy = r.energy === null ? null : Number(r.energy);
  return rows;
}
async function fetchNasa() {
  const [rows] = await conn.query(`
    SELECT project_id, title, launch_date, organism, sci_name, node_count, crew, is_artemis, catalog_id
      FROM nasa_missions
     ORDER BY launch_date IS NULL, launch_date, project_id
  `);
  for (const r of rows) {
    r.is_artemis = !!r.is_artemis;
    r.node_count = r.node_count === null ? null : Number(r.node_count);
    if (r.launch_date instanceof Date) r.launch_date = r.launch_date.toISOString().slice(0, 10);
  }
  return rows;
}

const [clusters, projects, edges, artists, species, nasa] = await Promise.all([
  fetchClusters(), fetchProjects(), fetchEdges(), fetchArtists(), fetchSpecies(), fetchNasa()
]);

let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch {}

const manifest = {
  schema_version: 1,
  built_at: new Date().toISOString(),
  source: 'snapshot-mysql',
  commit,
  counts: {
    clusters: clusters.length,
    projects: projects.length,
    edges:    edges.length,
    artists:  artists.length,
    species:  species.length,
    nasa:     nasa.length,
  },
  files: ['clusters.json','projects.json','edges.json','artists.json','species.json','nasa.json'],
};

const write = (name, payload) => fs.writeFileSync(path.join(OUT, name), JSON.stringify(payload));
write('clusters.json', clusters);
write('projects.json', projects);
write('edges.json',    edges);
write('artists.json',  artists);
write('species.json',  species);
write('nasa.json',     nasa);
write('manifest.json', manifest);

// audit row
await conn.query(
  'INSERT INTO build_log (commit_sha, node_count, edge_count, notes) VALUES (?,?,?,?)',
  [commit, projects.length, edges.length, 'snapshot-mysql.mjs']
);

const totalBytes = manifest.files.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.error('snapshot written to', OUT);
console.error('counts:', manifest.counts);
console.error(`total payload: ${(totalBytes/1024).toFixed(1)} KB across ${manifest.files.length} files`);

await conn.end();
