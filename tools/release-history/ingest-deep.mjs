#!/usr/bin/env node
// Deep ingester — populates release_history.feature and release_history.retrospective
// tables from parsed README content. Assumes release_history.release is already
// populated by ingest.mjs.
//
// Idempotent: delete-then-insert per version for feature + retrospective rows.
// Lesson rows are NOT touched here (they have cross-version lifecycle).

import { readFileSync, readdirSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';
import { openDb } from './db.mjs';

const cfg = loadConfig();
const RELEASE_NOTES_DIR = cfg.source_dir_abs;
const REPORT_FILE = join(cfg.cache_dir_abs, '_ingest-deep-report.json');
mkdirSync(cfg.cache_dir_abs, { recursive: true });

const VERSION_RE = /^v(\d+)\.(\d+)(?:\.(\d+))?(?:-(.+))?$/;

function parseVersion(v) {
  const m = VERSION_RE.exec(v);
  if (!m) return null;
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: m[3] ? parseInt(m[3], 10) : 0,
  };
}

function compareVersions(a, b) {
  const pa = parseVersion(a), pb = parseVersion(b);
  if (!pa || !pb) return 0;
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  return pa.patch - pb.patch;
}

// Split markdown into sections keyed by heading text.
function splitIntoSections(text) {
  const lines = text.split(/\r?\n/);
  const sections = {};
  let currentKey = '__preamble__';
  let currentBody = [];
  let currentLevel = 0;
  for (const line of lines) {
    const h = /^(#{2,4})\s+(.+?)\s*$/.exec(line);
    if (h) {
      if (currentBody.length) {
        sections[currentKey] = (sections[currentKey] || '') + currentBody.join('\n') + '\n';
      }
      currentKey = normalizeHeading(h[2]);
      currentLevel = h[1].length;
      currentBody = [];
    } else {
      currentBody.push(line);
    }
  }
  if (currentBody.length) {
    sections[currentKey] = (sections[currentKey] || '') + currentBody.join('\n') + '\n';
  }
  return sections;
}

function normalizeHeading(h) {
  return h.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

// Feature extraction: find a "features" section, split its H3 children.
function extractFeatures(text) {
  const sections = splitIntoSections(text);
  const featureKeys = ['key_features', 'features', 'what_s_new', 'whats_new', 'new_in_this_release'];
  let body = null;
  for (const k of featureKeys) {
    if (sections[k]) { body = sections[k]; break; }
  }
  if (!body) return [];
  // Split on H3 or numbered top-level items
  const features = [];
  // Try H3 ### Title
  const h3re = /^###\s+(?:\d+\.\s*)?(.+?)\s*$/gm;
  const matches = [];
  let m;
  while ((m = h3re.exec(body)) !== null) {
    matches.push({ index: m.index, title: m[1].trim(), headingLength: m[0].length });
  }
  if (matches.length === 0) {
    // Fallback: top-level bullet list — "- **Foo** — bar"
    const bulletRe = /^[-*]\s+\*\*([^*]+)\*\*\s*[—:–-]\s*(.+?)$/gm;
    let b;
    let pos = 0;
    while ((b = bulletRe.exec(body)) !== null) {
      features.push({
        title: b[1].trim(),
        summary_md: b[2].trim(),
        location: null,
        category: null,
        line_count: 1,
      });
      pos++;
    }
    return features;
  }
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index + matches[i].headingLength;
    const end = i + 1 < matches.length ? matches[i + 1].index : body.length;
    const featureBody = body.slice(start, end).trim();
    const locMatch = /\*\*Location\*?\*?:\*?\*?\s*`?([^\n`]+)`?/i.exec(featureBody);
    const filesMatch = /\*\*Files?\*?\*?:\*?\*?\s*([^\n|]+)/i.exec(featureBody);
    features.push({
      title: matches[i].title.replace(/^"|"$/g, ''),
      summary_md: featureBody,
      location: locMatch ? locMatch[1].trim() : null,
      category: null,
      line_count: featureBody.split('\n').length,
    });
  }
  return features;
}

// Retrospective extraction: group sections by kind.
function extractRetrospectives(text) {
  const sections = splitIntoSections(text);
  const out = [];
  const mapping = [
    { kinds: ['what_worked', 'what_s_working', 'whats_working'], kind: 'what_worked' },
    { kinds: ['what_could_be_better', 'what_needs_improvement', 'what_didn_t_work', 'what_didnt_work'], kind: 'what_could_be_better' },
    { kinds: ['lessons_learned', 'lessons'], kind: 'lessons_learned' },
    { kinds: ['decisions', 'key_decisions'], kind: 'decisions' },
    { kinds: ['surprises', 'what_surprised_me', 'unexpected'], kind: 'surprises' },
  ];
  for (const { kinds, kind } of mapping) {
    for (const k of kinds) {
      if (sections[k] && sections[k].trim()) {
        out.push({ kind, body_md: sections[k].trim() });
        break; // one per kind
      }
    }
  }
  // Also: "## Retrospective" block may contain all sub-kinds nested
  if (sections['retrospective']) {
    const nested = splitIntoSections('## _dummy_\n' + sections['retrospective']);
    // Children of ## Retrospective are ### What Worked, ### What Could Be Better, etc.
    for (const { kinds, kind } of mapping) {
      if (out.find(r => r.kind === kind)) continue; // already captured
      for (const k of kinds) {
        if (nested[k] && nested[k].trim()) {
          out.push({ kind, body_md: nested[k].trim() });
          break;
        }
      }
    }
  }
  return out;
}

async function processVersion(client, version, text, dryRun, stats) {
  const features = extractFeatures(text);
  const retros = extractRetrospectives(text);

  if (dryRun) {
    stats.features += features.length;
    stats.retros += retros.length;
    if (features.length > 0) stats.releases_with_features++;
    if (retros.length > 0) stats.releases_with_retros++;
    return { version, features: features.length, retros: retros.length };
  }

  await client.query('BEGIN');
  try {
    await client.query('DELETE FROM release_history.feature WHERE version = $1', [version]);
    await client.query('DELETE FROM release_history.retrospective WHERE version = $1', [version]);
    for (let i = 0; i < features.length; i++) {
      const f = features[i];
      await client.query(
        `INSERT INTO release_history.feature (version, position, title, location, summary_md, category, line_count)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [version, i, f.title.slice(0, 500), f.location, f.summary_md, f.category, f.line_count]
      );
    }
    for (const r of retros) {
      await client.query(
        `INSERT INTO release_history.retrospective (version, kind, body_md)
         VALUES ($1, $2, $3)
         ON CONFLICT (version, kind) DO UPDATE SET body_md = EXCLUDED.body_md, extracted_at = now()`,
        [version, r.kind, r.body_md]
      );
    }
    await client.query('COMMIT');
    stats.features += features.length;
    stats.retros += retros.length;
    if (features.length > 0) stats.releases_with_features++;
    if (retros.length > 0) stats.releases_with_retros++;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  }
  return { version, features: features.length, retros: retros.length };
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const explicit = args.find(a => !a.startsWith('--'));

  const client = await openDb(cfg);

  let versions;
  if (explicit) {
    versions = [explicit];
  } else {
    versions = readdirSync(RELEASE_NOTES_DIR, { withFileTypes: true })
      .filter(e => e.isDirectory() && VERSION_RE.test(e.name))
      .map(e => e.name)
      .sort(compareVersions);
  }

  console.error(`[deep] ${versions.length} releases to process${dryRun ? ' (dry-run)' : ''}`);

  const stats = {
    total: versions.length,
    processed: 0,
    errors: 0,
    features: 0,
    retros: 0,
    releases_with_features: 0,
    releases_with_retros: 0,
    per_version: [],
  };

  let i = 0;
  for (const v of versions) {
    i++;
    const readmePath = join(RELEASE_NOTES_DIR, v, 'README.md');
    if (!existsSync(readmePath)) continue;
    const text = readFileSync(readmePath, 'utf8');
    try {
      const res = await processVersion(client, v, text, dryRun, stats);
      stats.processed++;
      if (res.features > 0 || res.retros > 0) stats.per_version.push(res);
    } catch (e) {
      stats.errors++;
      console.error(`[deep] FAIL ${v}: ${e.message}`);
    }
    if (i % 100 === 0) console.error(`[deep] ${i}/${versions.length}`);
  }

  await client.close();

  writeFileSync(REPORT_FILE, JSON.stringify(stats, null, 2));
  console.error(`[deep] done — ${stats.processed} processed, ${stats.errors} errors, ${stats.features} features, ${stats.retros} retros`);
  console.log(JSON.stringify({
    total: stats.total,
    processed: stats.processed,
    errors: stats.errors,
    features: stats.features,
    retros: stats.retros,
    releases_with_features: stats.releases_with_features,
    releases_with_retros: stats.releases_with_retros,
  }, null, 2));
  process.exit(stats.errors ? 1 : 0);
}

main().catch(e => {
  console.error('[deep] fatal:', e.message);
  process.exit(2);
});
