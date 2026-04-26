#!/usr/bin/env node
// Query constellation.* tables and write static JSON next to constellation.html.
// This is the file the HTML rewrite (next phase) will fetch() at page load.
//
// Output: www/tibsfox/com/Research/constellation/{projects,edges,clusters,artists,species,nasa,manifest}.json

import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const OUT  = path.join(REPO, 'www/tibsfox/com/Research/constellation');
fs.mkdirSync(OUT, { recursive: true });

const client = new pg.Client({
  host: process.env.PG_HOST || 'localhost',
  port: Number(process.env.PG_PORT || 5432),
  user: process.env.PG_USER || 'maple',
  password: process.env.PG_PASSWORD || '',
  database: process.env.PG_DB || 'tibsfox',
});
await client.connect();
await client.query('SET search_path TO constellation, public');

const clusters = (await client.query(
  'SELECT name, color, sort_order FROM clusters ORDER BY sort_order',
)).rows;

const projects = (await client.query(
  `SELECT id, name, cluster_name, series_code, detail_url
     FROM projects
    ORDER BY id`,
)).rows;

const edges = (await client.query(
  'SELECT src_id, dst_id, weight FROM edges ORDER BY src_id, dst_id',
)).rows;

const artists = (await client.query(
  `SELECT project_id, artist, genre, energy, xrefs
     FROM artists ORDER BY project_id`,
)).rows;

const species = (await client.query(
  `SELECT project_id, common, scientific, family, taxon_order, energy, trait
     FROM species ORDER BY project_id`,
)).rows;

const nasa = (await client.query(
  `SELECT project_id, title, launch_date, organism, sci_name, node_count, crew, is_artemis, catalog_id
     FROM nasa_missions ORDER BY launch_date NULLS LAST, project_id`,
)).rows;

let commit = '';
try { commit = execSync('git rev-parse --short HEAD', { cwd: REPO }).toString().trim(); } catch {}

const manifest = {
  schema_version: 1,
  built_at: new Date().toISOString(),
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

function write(name, payload) {
  fs.writeFileSync(path.join(OUT, name), JSON.stringify(payload));
}
write('clusters.json', clusters);
write('projects.json', projects);
write('edges.json',    edges);
write('artists.json',  artists);
write('species.json',  species);
write('nasa.json',     nasa);
write('manifest.json', manifest);

const totalBytes = manifest.files.reduce((s, f) => s + fs.statSync(path.join(OUT, f)).size, 0);
console.error('built constellation/ at', OUT);
console.error('counts:', manifest.counts);
console.error(`total payload: ${(totalBytes/1024).toFixed(1)} KB across ${manifest.files.length} files`);

await client.end();
