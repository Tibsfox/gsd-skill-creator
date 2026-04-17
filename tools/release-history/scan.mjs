#!/usr/bin/env node
// Release History — Pass 1 Baseline Scan
// Reconciles docs/release-notes/ vs docs/RELEASE-HISTORY.md.
// Emits: .planning/release-cache/_reconciliation.json + .planning/roadmap/INDEX.md

import { readFileSync, readdirSync, writeFileSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig, REPO_ROOT } from './config.mjs';

const cfg = loadConfig();
const RELEASE_NOTES_DIR = cfg.source_dir_abs;
const HISTORY_FILE = cfg.index_file_abs;
const CACHE_FILE = join(cfg.cache_dir_abs, '_reconciliation.json');
const INDEX_FILE = join(cfg.roadmap_dir_abs, 'INDEX.md');
mkdirSync(cfg.cache_dir_abs, { recursive: true });
mkdirSync(cfg.roadmap_dir_abs, { recursive: true });

const VERSION_RE = cfg.version_regex_compiled;

function compareVersions(a, b) {
  const pa = parseVersion(a), pb = parseVersion(b);
  if (!pa || !pb) return a.localeCompare(b);
  if (pa.major !== pb.major) return pa.major - pb.major;
  if (pa.minor !== pb.minor) return pa.minor - pb.minor;
  if (pa.patch !== pb.patch) return pa.patch - pb.patch;
  return (pa.prerelease || '').localeCompare(pb.prerelease || '');
}

function parseVersion(v) {
  const m = VERSION_RE.exec(v);
  if (!m) return null;
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: m[3] ? parseInt(m[3], 10) : 0,
    prerelease: m[4] || null,
  };
}

function enumerateFilesystem() {
  const entries = readdirSync(RELEASE_NOTES_DIR, { withFileTypes: true });
  const versions = [];
  const nonVersion = [];
  for (const e of entries) {
    if (!e.isDirectory()) continue;
    if (VERSION_RE.test(e.name)) versions.push(e.name);
    else nonVersion.push(e.name);
  }
  versions.sort(compareVersions);
  return { versions, nonVersion };
}

function parseHistoryTable() {
  if (!existsSync(HISTORY_FILE)) return []; // fresh project — index doesn't exist yet
  const text = readFileSync(HISTORY_FILE, 'utf8');
  const rows = [];
  // Match: | [v1.49.557](release-notes/v1.49.557/) | Name | Date | Phases | Plans | Also |
  const re = /^\|\s*\[?(v[\d.]+)\]?\s*(?:\([^)]+\))?\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|\s*([^|]*?)\s*\|/gm;
  let m;
  while ((m = re.exec(text)) !== null) {
    const [, version, name, shipped, phases, plans, also] = m;
    if (version === 'Version') continue;
    rows.push({
      version,
      name: name.trim(),
      shipped: shipped.trim(),
      phases: phases.trim(),
      plans: plans.trim(),
      also: also.trim(),
    });
  }
  return rows;
}

function readReadmeMeta(version) {
  const readmePath = join(RELEASE_NOTES_DIR, version, 'README.md');
  if (!existsSync(readmePath)) return { exists: false };
  const text = readFileSync(readmePath, 'utf8').split(/\r?\n/).slice(0, 40).join('\n');
  const meta = { exists: true };
  const name = /^#\s*v[\d.]+\s*[—–-]\s*"?([^"\n]+)"?\s*$/m.exec(text);
  const shipped = /\*\*Shipped:\*\*\s*([\d-]+)/.exec(text);
  const commits = /\*\*Commits?:\*\*\s*(\d+)/.exec(text);
  const files = /\*\*Files(?:\s+changed)?:\*\*\s*(\d+)/.exec(text);
  if (name) meta.name = name[1].trim();
  if (shipped) meta.shipped = shipped[1];
  if (commits) meta.commits = parseInt(commits[1], 10);
  if (files) meta.files = parseInt(files[1], 10);
  return meta;
}

function main() {
  console.error('[scan] enumerating filesystem...');
  const { versions: fsVersions, nonVersion: nonVersionDirs } = enumerateFilesystem();
  console.error(`[scan] fs versions: ${fsVersions.length}, non-version dirs: ${nonVersionDirs.length}`);

  console.error('[scan] parsing RELEASE-HISTORY.md...');
  const tableRows = parseHistoryTable();
  console.error(`[scan] table rows: ${tableRows.length}`);
  const tableVersions = new Set(tableRows.map(r => r.version));

  const fsSet = new Set(fsVersions);
  const missingInTable = fsVersions.filter(v => !tableVersions.has(v));
  const missingOnDisk = [...tableVersions].filter(v => !fsSet.has(v));

  console.error('[scan] reading per-release metadata...');
  const metadata = {};
  for (const v of fsVersions) metadata[v] = readReadmeMeta(v);

  const tableRowsByVersion = Object.fromEntries(tableRows.map(r => [r.version, r]));

  const report = {
    scanned_at: new Date().toISOString(),
    repo_root: REPO_ROOT,
    fs_count: fsVersions.length,
    table_count: tableRows.length,
    drift_count: missingInTable.length + missingOnDisk.length,
    missing_in_table: missingInTable,
    missing_on_disk: missingOnDisk,
    non_version_dirs: nonVersionDirs,
    metadata_gaps: fsVersions
      .filter(v => metadata[v].exists && (!metadata[v].shipped || !metadata[v].name))
      .map(v => ({
        version: v,
        missing: [
          !metadata[v].name && 'name',
          !metadata[v].shipped && 'shipped_at',
        ].filter(Boolean),
      })),
    releases: fsVersions.map(v => ({
      version: v,
      ...metadata[v],
      in_table: tableVersions.has(v),
      table_row: tableRowsByVersion[v] || null,
    })),
  };

  writeFileSync(CACHE_FILE, JSON.stringify(report, null, 2));
  console.error(`[scan] wrote ${CACHE_FILE}`);

  // Write INDEX.md
  const lines = [];
  lines.push('# Release History — Baseline Index');
  lines.push('');
  lines.push(`_Generated ${report.scanned_at.slice(0, 10)} by \`tools/release-history/scan.mjs\`. Authoritative source: filesystem (\`docs/release-notes/\`)._`);
  lines.push('');
  lines.push(`**Total releases on disk:** ${report.fs_count}`);
  lines.push(`**Rows in docs/RELEASE-HISTORY.md:** ${report.table_count}`);
  lines.push(`**Drift count:** ${report.drift_count}`);
  lines.push(`**Non-version dirs:** ${report.non_version_dirs.length}${report.non_version_dirs.length ? ' (' + report.non_version_dirs.join(', ') + ')' : ''}`);
  lines.push('');
  if (missingInTable.length) {
    lines.push('## Drift — On disk but missing from RELEASE-HISTORY.md');
    lines.push('');
    for (const v of missingInTable) lines.push(`- \`${v}\` — ${metadata[v].name || '(no name)'} — ${metadata[v].shipped || '(no date)'}`);
    lines.push('');
  }
  if (missingOnDisk.length) {
    lines.push('## Drift — In RELEASE-HISTORY.md but missing on disk');
    lines.push('');
    for (const v of missingOnDisk) lines.push(`- \`${v}\``);
    lines.push('');
  }
  lines.push('## Full Index (newest first)');
  lines.push('');
  lines.push('| Version | Name | Shipped | Commits | Files | Chapter |');
  lines.push('|---------|------|---------|---------|-------|---------|');
  for (const v of [...fsVersions].reverse()) {
    const md = metadata[v];
    const chapter = existsSync(join(REPO_ROOT, '.planning', 'roadmap', v))
      ? `[read](${v}/00-summary.md)`
      : '—';
    lines.push(`| \`${v}\` | ${md.name || '—'} | ${md.shipped || '—'} | ${md.commits ?? '—'} | ${md.files ?? '—'} | ${chapter} |`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push('_Reconciliation report: [\\_reconciliation.json](../release-cache/_reconciliation.json)_');

  writeFileSync(INDEX_FILE, lines.join('\n'));
  console.error(`[scan] wrote ${INDEX_FILE}`);

  // Summary to stdout
  console.log(JSON.stringify({
    fs_count: report.fs_count,
    table_count: report.table_count,
    drift_count: report.drift_count,
    missing_in_table: report.missing_in_table.length,
    missing_on_disk: report.missing_on_disk.length,
    non_version_dirs: report.non_version_dirs,
    metadata_gaps: report.metadata_gaps.length,
  }, null, 2));

  process.exit(report.drift_count === 0 ? 0 : 2);
}

main();
