#!/usr/bin/env node
// Extract "By the Numbers" / metric tables from READMEs into release_history.metric.
// Idempotent: DELETE per version before INSERT.
//
// Target patterns:
//   ## By the Numbers
//   | Metric | Value |      (single-value)
//   or
//   | Metric | Before | After | Delta |   (transition)
//
// Also detects section aliases: ## Metrics, ## Numbers, ## Stats

import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { mkdirSync } from 'node:fs';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const cfg = loadConfig();
const RELEASE_NOTES_DIR = cfg.source_dir_abs;
const REPORT_FILE = join(cfg.cache_dir_abs, '_metrics-report.json');
const VERSION_RE = cfg.version_regex_compiled;
mkdirSync(cfg.cache_dir_abs, { recursive: true });

const SECTION_HEADINGS = [
  'by_the_numbers', 'by_the_numers', 'metrics', 'numbers', 'stats', 'statistics',
  'the_numbers', 'by_numbers',
  // NASA/Seattle360 paired-engine sections
  'engine_statistics', 'engine_position', 'acoustic_progression',
  'taxonomic_state', 'energy_distribution',
  'file_inventory', 'files',
];

function normalizeHeading(h) {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Find all metric sections and return concatenated body text.
function findMetricsSection(text) {
  const lines = text.split(/\r?\n/);
  let inSection = false;
  let captured = [];
  for (const line of lines) {
    const h2 = /^##\s+(.+?)\s*$/.exec(line);
    if (h2) {
      const key = normalizeHeading(h2[1]);
      inSection = SECTION_HEADINGS.includes(key);
      if (inSection) captured.push(''); // break tables across sections
      continue;
    }
    if (inSection) captured.push(line);
  }
  return captured.join('\n').trim();
}

// Parse a pipe-table into row objects keyed by header.
function parseTable(block) {
  const lines = block.split(/\r?\n/).filter(l => /^\s*\|/.test(l));
  if (lines.length < 2) return [];
  const header = lines[0].trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim().toLowerCase());
  const sep = lines[1];
  if (!/^[\s|:-]+$/.test(sep)) return [];
  const rows = [];
  for (let i = 2; i < lines.length; i++) {
    const cells = lines[i].trim().replace(/^\||\|$/g, '').split('|').map(s => s.trim());
    if (cells.length !== header.length) continue;
    const obj = {};
    for (let c = 0; c < header.length; c++) obj[header[c]] = cells[c];
    rows.push(obj);
  }
  return rows;
}

function rowToMetric(row) {
  const keys = Object.keys(row);
  const name = row[keys[0]];
  if (!name || name === '—' || name.toLowerCase().startsWith('metric')) return null;
  // single-value: Metric | Value
  if (keys.length === 2) {
    return { metric_name: name.slice(0, 200), before_value: null, after_value: row[keys[1]] || null, delta: null, unit: null };
  }
  // transition: Metric | Before | After | Delta [| Unit]
  const before = row[keys.find(k => /before|prior|was/.test(k))] ?? row[keys[1]];
  const after = row[keys.find(k => /after|now|current|is/.test(k))] ?? row[keys[2]];
  const delta = row[keys.find(k => /delta|change|diff/.test(k))] ?? row[keys[3]];
  const unit = row[keys.find(k => /unit/.test(k))] ?? null;
  return {
    metric_name: name.slice(0, 200),
    before_value: before ?? null,
    after_value: after ?? null,
    delta: delta ?? null,
    unit,
  };
}

function extractMetrics(text) {
  const section = findMetricsSection(text);
  if (!section) return [];
  // Find all tables in the section
  const metrics = [];
  const tableBlocks = [];
  let current = [];
  for (const line of section.split(/\r?\n/)) {
    if (/^\s*\|/.test(line)) {
      current.push(line);
    } else {
      if (current.length >= 2) tableBlocks.push(current.join('\n'));
      current = [];
    }
  }
  if (current.length >= 2) tableBlocks.push(current.join('\n'));
  for (const tb of tableBlocks) {
    for (const row of parseTable(tb)) {
      const m = rowToMetric(row);
      if (m && m.metric_name && m.metric_name.length >= 2) metrics.push(m);
    }
  }
  // Deduplicate by metric_name within this release
  const seen = new Set();
  return metrics.filter(m => {
    const k = m.metric_name.toLowerCase();
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  const client = await openDb(cfg);

  const versions = readdirSync(RELEASE_NOTES_DIR, { withFileTypes: true })
    .filter(e => e.isDirectory() && VERSION_RE.test(e.name))
    .map(e => e.name);
  console.error(`[metrics] scanning ${versions.length} release READMEs`);

  const stats = { scanned: 0, releases_with_metrics: 0, metrics_inserted: 0, errors: 0, per_version: {} };

  for (let i = 0; i < versions.length; i++) {
    const v = versions[i];
    const readme = join(RELEASE_NOTES_DIR, v, 'README.md');
    if (!existsSync(readme)) continue;
    stats.scanned++;
    const text = readFileSync(readme, 'utf8');
    const metrics = extractMetrics(text);
    if (metrics.length === 0) continue;
    stats.releases_with_metrics++;
    stats.per_version[v] = metrics.length;

    if (!dryRun) {
      try {
        await client.query('BEGIN');
        await client.query('DELETE FROM release_history.metric WHERE version = $1', [v]);
        for (const m of metrics) {
          await client.query(
            `INSERT INTO release_history.metric (version, metric_name, before_value, after_value, delta, unit)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (version, metric_name) DO NOTHING`,
            [v, m.metric_name, m.before_value, m.after_value, m.delta, m.unit]
          );
          stats.metrics_inserted++;
        }
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        stats.errors++;
        console.error(`[metrics] FAIL ${v}: ${e.message}`);
      }
    } else {
      stats.metrics_inserted += metrics.length;
    }

    if ((i + 1) % 100 === 0) console.error(`[metrics] ${i + 1}/${versions.length}`);
  }

  await client.close();
  writeFileSync(REPORT_FILE, JSON.stringify(stats, null, 2));
  console.error(`[metrics] done — ${stats.releases_with_metrics} releases, ${stats.metrics_inserted} metrics${dryRun ? ' (dry-run)' : ''}`);
  console.log(JSON.stringify({
    scanned: stats.scanned,
    releases_with_metrics: stats.releases_with_metrics,
    metrics_inserted: stats.metrics_inserted,
    errors: stats.errors,
  }, null, 2));
}

main().catch(e => { console.error('fatal:', e.message); process.exit(2); });
