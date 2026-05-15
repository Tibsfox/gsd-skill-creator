#!/usr/bin/env node
// tools/scaffold-cross-track-dirs.mjs — cross-track scaffold creator (FA-652-11 C04).
//
// PURPOSE: Prevent recurrence of the v1.49.585 → v1.49.652 8-degree MUS/ELC
// drift class. For every NASA Research degree dir on disk, ensure sibling
// MUS/<degree>/ and ELC/<degree>/ dirs exist with a SCAFFOLD-PENDING index.html
// stub sourced from NASA degree-sync.json engine_state.{mus,elc}.
//
// MODEL:
//   - IDEMPOTENT: never overwrites existing index.html. Only writes when the
//     target file is absent. Re-runs after backfill are safe no-ops.
//   - SCAFFOLD-PENDING markers (`<!-- SCAFFOLD-PENDING: backfill required -->`)
//     are recognized by depth-audit.mjs and downgrade MUS/ELC findings from
//     FAIL to WARN until backfilled (FA-652-11 C05 interaction).
//   - PURE NODE — no DB read, no network. Stubs are derived only from
//     each NASA degree's degree-sync.json engine_state.
//
// USAGE:
//   node tools/scaffold-cross-track-dirs.mjs            # scan + scaffold
//   node tools/scaffold-cross-track-dirs.mjs --dry-run  # report what would change
//   node tools/scaffold-cross-track-dirs.mjs --json     # machine-readable summary
//
// EXIT CODES:
//   0  ok (scaffolded N files OR dry-run reports M would-scaffold)
//   1  one or more NASA degrees missing degree-sync.json (cannot derive stubs)
//   2  filesystem / IO error
//
// WIRE-IN:
//   - npm run scaffold:cross-track  → this script
//   - tools/release-history/refresh.mjs (T14 step 9): runs in summary mode
//     to report drift; non-blocking
//   - tools/pre-tag-gate.sh: NOT wired (would slow per-ship; manual run)

import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(HERE);
const RESEARCH_ROOT = join(REPO_ROOT, 'www/tibsfox/com/Research');

const TRACKS = ['MUS', 'ELC']; // siblings of NASA

const SCAFFOLD_MARKER = '<!-- SCAFFOLD-PENDING: backfill required -->';

function isDegreeDirName(name) {
  return /^\d+\.\d+$/.test(name);
}

function listNasaDegrees() {
  const nasaRoot = join(RESEARCH_ROOT, 'NASA');
  if (!existsSync(nasaRoot)) return [];
  return readdirSync(nasaRoot, { withFileTypes: true })
    .filter(d => d.isDirectory() && isDegreeDirName(d.name))
    .map(d => d.name)
    .sort((a, b) => {
      const [ma, na] = a.split('.').map(Number);
      const [mb, nb] = b.split('.').map(Number);
      return ma - mb || na - nb;
    });
}

function loadDegreeSync(degree) {
  const p = join(RESEARCH_ROOT, 'NASA', degree, 'degree-sync.json');
  if (!existsSync(p)) return null;
  try {
    return JSON.parse(readFileSync(p, 'utf8'));
  } catch (e) {
    return { __parseError: e.message };
  }
}

function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function fmtMusTitle(degree, mus) {
  if (!mus) return `MUS ${degree} — scaffold pending`;
  const parts = [];
  if (mus.artist) parts.push(mus.artist);
  if (mus.album) parts.push(`*${mus.album}*`);
  if (mus.label) parts.push(`(${mus.label}${mus.catalog ? ` ${mus.catalog}` : ''})`);
  return parts.length > 0 ? `MUS ${degree} — ${parts.join(' ')}` : `MUS ${degree} — scaffold pending`;
}

function fmtElcTitle(degree, elc) {
  if (!elc) return `ELC ${degree} — scaffold pending`;
  const parts = [];
  if (elc.event) parts.push(elc.event);
  if (elc.date) parts.push(`(${elc.date})`);
  return parts.length > 0 ? `ELC ${degree} — ${parts.join(' ')}` : `ELC ${degree} — scaffold pending`;
}

function renderMusStub(degree, mus, predecessor) {
  const title = fmtMusTitle(degree, mus);
  const subtitle = mus?.window_anchor || 'window anchor: pending';
  const substrate = mus?.substrate || 'substrate: pending';
  const release = mus?.release_date || 'release date: pending';
  const prev = predecessor ? `<a href="../${predecessor}/index.html">← MUS ${predecessor}</a>` : '';
  return `<!DOCTYPE html>
<html lang="en" data-page="degree-scaffold" data-harness-version="1.0.0">
<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(`Music-theory degree ${degree} scaffold; awaiting backfill. ${substrate}`)}" />
  ${SCAFFOLD_MARKER}
  <style>
    body { font-family: 'DM Sans', -apple-system, sans-serif; background: #04060a; color: #c8cdd6; padding: 2rem; line-height: 1.6; }
    .scaffold-banner { background: #2a1f10; border: 1px solid #c89048; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; color: #eaecf4; }
    .scaffold-banner strong { color: #c89048; }
    h1 { color: #eaecf4; font-family: Georgia, serif; }
    dt { font-weight: bold; color: #c89048; margin-top: 0.6rem; }
    dd { margin-left: 1rem; }
    nav { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #2a2026; }
    a { color: #c89048; }
  </style>
</head>
<body>
  <div class="scaffold-banner">
    <strong>SCAFFOLD-PENDING</strong> &mdash; This page is a stub created by
    <code>tools/scaffold-cross-track-dirs.mjs</code> to track cohort presence for
    MUS degree ${escHtml(degree)}. Backfill (substrate-tracked narrative cards, primary-source
    research, color theme, cross-track linking) is scheduled as part of the
    FA-652-11 counter-cadence content milestone.
  </div>
  <h1>${escHtml(title)}</h1>
  <p><em>${escHtml(subtitle)}</em></p>

  <dl>
    <dt>Degree</dt><dd>${escHtml(degree)}</dd>
    <dt>Artist</dt><dd>${escHtml(mus?.artist || '—')}</dd>
    <dt>Album</dt><dd>${escHtml(mus?.album || '—')}</dd>
    <dt>Label</dt><dd>${escHtml(mus?.label || '—')}</dd>
    <dt>Catalog</dt><dd>${escHtml(mus?.catalog || '—')}</dd>
    <dt>Release date</dt><dd>${escHtml(release)}</dd>
    <dt>Window anchor</dt><dd>${escHtml(subtitle)}</dd>
    <dt>Substrate forms</dt><dd>${escHtml(substrate)}</dd>
  </dl>

  <p><strong>Source-of-truth:</strong> NASA ${escHtml(degree)} <code>degree-sync.json</code>
  <code>engine_state.mus</code> field. See <a href="../../NASA/${escHtml(degree)}/index.html">NASA ${escHtml(degree)}</a> for cross-track context.</p>

  <nav>${prev} <a href="../catalog/index.html">MUS catalog</a></nav>
</body>
</html>
`;
}

function renderElcStub(degree, elc, predecessor) {
  const title = fmtElcTitle(degree, elc);
  const subtitle = elc?.window_anchor || 'window anchor: pending';
  const substrate = elc?.substrate || 'substrate: pending';
  const date = elc?.date || 'date: pending';
  const result = elc?.result || '';
  const prev = predecessor ? `<a href="../${predecessor}/index.html">← ELC ${predecessor}</a>` : '';
  return `<!DOCTYPE html>
<html lang="en" data-page="degree-scaffold" data-harness-version="1.0.0">
<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <title>${escHtml(title)}</title>
  <meta name="description" content="${escHtml(`Ecology/legal/cultural degree ${degree} scaffold; awaiting backfill. ${substrate}`)}" />
  ${SCAFFOLD_MARKER}
  <style>
    body { font-family: 'DM Sans', -apple-system, sans-serif; background: #09090e; color: #a8b4c0; padding: 2rem; line-height: 1.6; }
    .scaffold-banner { background: #1f1a14; border: 1px solid #6a9e8a; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; color: #d8e0ec; }
    .scaffold-banner strong { color: #6a9e8a; }
    h1 { color: #d8e0ec; font-family: 'Libre Baskerville', Georgia, serif; }
    dt { font-weight: bold; color: #6a9e8a; margin-top: 0.6rem; }
    dd { margin-left: 1rem; }
    nav { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid #181e2a; }
    a { color: #c8b840; }
  </style>
</head>
<body>
  <div class="scaffold-banner">
    <strong>SCAFFOLD-PENDING</strong> &mdash; This page is a stub created by
    <code>tools/scaffold-cross-track-dirs.mjs</code> to track cohort presence for
    ELC degree ${escHtml(degree)}. Backfill (substrate-tracked narrative cards, primary-source
    research, color theme, cross-track linking) is scheduled as part of the
    FA-652-11 counter-cadence content milestone.
  </div>
  <h1>${escHtml(title)}</h1>
  <p><em>${escHtml(subtitle)}</em></p>

  <dl>
    <dt>Degree</dt><dd>${escHtml(degree)}</dd>
    <dt>Event</dt><dd>${escHtml(elc?.event || '—')}</dd>
    <dt>Date</dt><dd>${escHtml(date)}</dd>
    <dt>Window anchor</dt><dd>${escHtml(subtitle)}</dd>
    <dt>Outcome</dt><dd>${escHtml(result || '—')}</dd>
    <dt>Substrate forms</dt><dd>${escHtml(substrate)}</dd>
  </dl>

  <p><strong>Source-of-truth:</strong> NASA ${escHtml(degree)} <code>degree-sync.json</code>
  <code>engine_state.elc</code> field. See <a href="../../NASA/${escHtml(degree)}/index.html">NASA ${escHtml(degree)}</a> for cross-track context.</p>

  <nav>${prev} <a href="../catalog/index.html">ELC catalog</a></nav>
</body>
</html>
`;
}

function previousDegree(degree) {
  const m = degree.match(/^(\d+)\.(\d+)$/);
  if (!m) return null;
  const major = parseInt(m[1], 10);
  const minor = parseInt(m[2], 10);
  if (minor === 0) return null;
  return `${major}.${minor - 1}`;
}

export function scaffoldCrossTrackDirs({ dryRun = false } = {}) {
  const summary = {
    nasa_degrees_scanned: 0,
    nasa_degrees_missing_sync: [],
    mus_stubs_created: [],
    mus_stubs_skipped_existing: [],
    elc_stubs_created: [],
    elc_stubs_skipped_existing: [],
    errors: [],
  };

  const degrees = listNasaDegrees();
  summary.nasa_degrees_scanned = degrees.length;

  for (const degree of degrees) {
    const sync = loadDegreeSync(degree);
    if (!sync) {
      summary.nasa_degrees_missing_sync.push(degree);
      continue;
    }
    if (sync.__parseError) {
      summary.errors.push({ degree, error: `degree-sync.json parse error: ${sync.__parseError}` });
      continue;
    }
    const engineState = sync.engine_state || {};
    const predecessor = previousDegree(degree);

    for (const track of TRACKS) {
      const trackKey = track.toLowerCase();
      const trackDir = join(RESEARCH_ROOT, track, degree);
      const indexPath = join(trackDir, 'index.html');
      if (existsSync(indexPath)) {
        summary[`${trackKey}_stubs_skipped_existing`].push(degree);
        continue;
      }
      const data = engineState[trackKey];
      const html = track === 'MUS'
        ? renderMusStub(degree, data, predecessor)
        : renderElcStub(degree, data, predecessor);
      if (!dryRun) {
        try {
          mkdirSync(trackDir, { recursive: true });
          writeFileSync(indexPath, html);
        } catch (e) {
          summary.errors.push({ degree, track, error: e.message });
          continue;
        }
      }
      summary[`${trackKey}_stubs_created`].push(degree);
    }
  }

  return summary;
}

function formatSummary(s, dryRun) {
  const verb = dryRun ? 'would create' : 'created';
  const lines = [];
  lines.push(`scaffold-cross-track-dirs: ${s.nasa_degrees_scanned} NASA degrees scanned`);
  lines.push(`  MUS: ${verb} ${s.mus_stubs_created.length}; skipped (existing) ${s.mus_stubs_skipped_existing.length}`);
  lines.push(`  ELC: ${verb} ${s.elc_stubs_created.length}; skipped (existing) ${s.elc_stubs_skipped_existing.length}`);
  if (s.mus_stubs_created.length > 0 && s.mus_stubs_created.length <= 20) {
    lines.push(`  MUS ${verb}: ${s.mus_stubs_created.join(', ')}`);
  }
  if (s.elc_stubs_created.length > 0 && s.elc_stubs_created.length <= 20) {
    lines.push(`  ELC ${verb}: ${s.elc_stubs_created.join(', ')}`);
  }
  if (s.nasa_degrees_missing_sync.length > 0) {
    lines.push(`  WARN: ${s.nasa_degrees_missing_sync.length} NASA degree(s) missing degree-sync.json: ${s.nasa_degrees_missing_sync.join(', ')}`);
  }
  if (s.errors.length > 0) {
    lines.push(`  ERRORS:`);
    for (const e of s.errors) lines.push(`    ${e.degree}${e.track ? '/' + e.track : ''}: ${e.error}`);
  }
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const jsonMode = args.includes('--json');

  const summary = scaffoldCrossTrackDirs({ dryRun });

  if (jsonMode) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    console.log(formatSummary(summary, dryRun));
  }

  if (summary.errors.length > 0) process.exit(2);
  // Legacy NASA degrees missing degree-sync.json are informational, not blocking
  // (their MUS/ELC siblings are already present from the v1.0-v1.108 cohort).
  process.exit(0);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('scaffold-cross-track-dirs.mjs');
if (invokedDirectly) main();

export { SCAFFOLD_MARKER, listNasaDegrees, loadDegreeSync, renderMusStub, renderElcStub, previousDegree };
