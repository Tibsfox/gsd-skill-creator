#!/usr/bin/env node
// Pull all rows from NASA/catalog/nasa_master_mission_catalog_expanded.csv into
// constellation.projects + constellation.nasa_missions so the wing isn't frozen
// at the 22 hand-curated nodes inlined into constellation.html.
//
// New nodes use id namespace `M<version>` (e.g. M1.0, M1.42) so they don't
// collide with the existing N100..N121 + NART set; the HTML rewrite can decide
// later whether to render one set, the other, or merged.
//
// Idempotent.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..', '..');
const CSV  = path.join(REPO, 'www/tibsfox/com/Research/NASA/catalog/nasa_master_mission_catalog_expanded.csv');

if (!fs.existsSync(CSV)) {
  console.error(`catalog not found: ${CSV}`);
  process.exit(1);
}

const lines = fs.readFileSync(CSV, 'utf8').split('\n').filter(Boolean);
const headerCols = lines.shift().split(',');
function col(rowArr, name) { return rowArr[headerCols.indexOf(name)] || ''; }

// minimal CSV split — file confirmed unquoted (grep -c '"' = 0)
const rows = lines.map((l) => l.split(','));

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

let upserted = 0;
try {
  for (const r of rows) {
    const version = col(r, 'version').trim();
    const code    = col(r, 'mission_code').trim();
    const name    = col(r, 'mission_name').trim();
    const start   = col(r, 'start_date').trim();
    if (!version || !name) continue;

    const projectId = `M${version}`;
    const detailUrl = `NASA/${version}/index.html`;

    await client.query(
      `INSERT INTO projects(id, name, cluster_name, series_code, detail_url)
         VALUES ($1,$2,'Space','NASA',$3)
       ON CONFLICT (id) DO UPDATE
         SET name = EXCLUDED.name,
             cluster_name = COALESCE(projects.cluster_name, EXCLUDED.cluster_name),
             series_code  = COALESCE(projects.series_code,  EXCLUDED.series_code),
             detail_url   = COALESCE(projects.detail_url,   EXCLUDED.detail_url)`,
      [projectId, name, detailUrl],
    );

    await client.query(
      `INSERT INTO nasa_missions(project_id, title, launch_date, catalog_id, is_artemis)
         VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (project_id) DO UPDATE
         SET title = EXCLUDED.title,
             launch_date = COALESCE(EXCLUDED.launch_date, nasa_missions.launch_date),
             catalog_id  = COALESCE(EXCLUDED.catalog_id,  nasa_missions.catalog_id),
             is_artemis  = nasa_missions.is_artemis OR EXCLUDED.is_artemis`,
      [projectId, name, start || null, version, /artemis/i.test(code) || /artemis/i.test(name)],
    );

    upserted++;
  }
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
}

const t = await client.query(`
  SELECT
    (SELECT count(*) FROM projects WHERE series_code='NASA')   AS nasa_projects,
    (SELECT count(*) FROM nasa_missions)                       AS nasa_missions,
    (SELECT count(*) FROM projects)                            AS total_projects
`);
console.error(`upserted ${upserted} catalog rows`);
console.error('totals:', t.rows[0]);
await client.end();
