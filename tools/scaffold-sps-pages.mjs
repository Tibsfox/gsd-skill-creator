#!/usr/bin/env node
// tools/scaffold-sps-pages.mjs — manifest-driven SPS scaffold creator (cc-1 C04).
//
// PURPOSE: Close the FA-663-6 SPS staged-deck deficit by emitting minimal valid
// stubs (with SCAFFOLD-PENDING marker) for every species enumerated in
// `tools/scaffold-sps-pages.manifest.json`. Companion to scaffold-cross-track-dirs.mjs
// (which only handles MUS/ELC; SPS uses named dirs not degree-keyed indices, so
// extension was not 1:1).
//
// MODEL:
//   - IDEMPOTENT per file: never overwrites existing files; can complete a
//     partial directory (e.g. SPS/marbled-murrelet at cc-1 entry had only
//     index.html — script writes missing data-sources.json + knowledge-nodes.json
//     + artifacts/ subdir, leaving the existing index.html untouched).
//   - SCAFFOLD-PENDING markers in HTML (<!-- comment) + JSON ("scaffold_pending": true)
//     are recognized by depth-audit.mjs and downgrade SPS findings from FAIL to
//     WARN-equivalent until backfilled (cc-1 C10 wiring).
//   - PURE NODE — no DB read, no network. Stub content derived from manifest only.
//
// USAGE:
//   node tools/scaffold-sps-pages.mjs               # scan + scaffold
//   node tools/scaffold-sps-pages.mjs --dry-run     # report what would change
//   node tools/scaffold-sps-pages.mjs --json        # machine-readable summary
//   node tools/scaffold-sps-pages.mjs --manifest <path>  # alternate manifest
//
// EXIT CODES:
//   0  ok (scaffolded N files OR dry-run report)
//   2  filesystem / IO error
//
// WIRE-IN: lives alongside scaffold-cross-track-dirs.mjs; not currently wired
// into pre-tag-gate (manual run). Future: tools/release-history/refresh.mjs may
// invoke in summary mode.

import { readdirSync, existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(HERE);
const SPS_ROOT = join(REPO_ROOT, 'www/tibsfox/com/Research/SPS');
const DEFAULT_MANIFEST = join(HERE, 'scaffold-sps-pages.manifest.json');

const SCAFFOLD_MARKER = '<!-- SCAFFOLD-PENDING: backfill required -->';

function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderSpsStub(entry) {
  const title = `SPS #${entry.sps_number ?? '?'} — ${entry.common_name} (*${entry.scientific_name}*)`;
  return `<!DOCTYPE html>
<html lang="en" data-page="sps-scaffold" data-harness-version="1.0.0">
<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <title>${escHtml(title.replace(/[*]/g, ''))}</title>
  <meta name="description" content="${escHtml(`SPS species page scaffold for ${entry.common_name}; awaiting cc-2 backfill.`)}" />
  ${SCAFFOLD_MARKER}
  <style>
    body { font-family: 'DM Sans', -apple-system, sans-serif; background: #0a0808; color: #c8d6c8; padding: 2rem; line-height: 1.6; }
    .scaffold-banner { background: #1f1610; border: 1px solid #c87848; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; color: #eaecf4; }
    .scaffold-banner strong { color: #c87848; }
    h1 { color: #eaecf4; font-family: Georgia, serif; }
    dt { font-weight: bold; color: #c87848; margin-top: 0.6rem; }
    dd { margin-left: 1rem; }
    a { color: #c87848; }
  </style>
</head>
<body>
  <div class="scaffold-banner">
    <strong>SCAFFOLD-PENDING</strong> &mdash; SPS species page stub created by
    <code>tools/scaffold-sps-pages.mjs</code>. Backfill (substrate-tracked narrative cards,
    primary-source research, illustrations, knowledge-node authoring) is scheduled
    for cc-2 (v1.49.665) per FA-663-6 staged-deck closure plan.
  </div>
  <h1>SPS #${escHtml(entry.sps_number)} &mdash; ${escHtml(entry.common_name)} <em>(${escHtml(entry.scientific_name)})</em></h1>
  <dl>
    <dt>Scientific name</dt><dd>${escHtml(entry.scientific_name)} ${escHtml(entry.authority || '')}</dd>
    <dt>Class / Order / Family</dt><dd>${escHtml(entry.class)} / ${escHtml(entry.order)} / ${escHtml(entry.family)}</dd>
    <dt>Cohort entry milestone</dt><dd>${escHtml(entry.cohort_entry_milestone)}</dd>
    <dt>Cross-track NASA</dt><dd>${escHtml(entry.cross_track_nasa)}</dd>
    <dt>Structural firsts</dt><dd>${(entry.structural_firsts || []).map(s => escHtml(s)).join('; ')}</dd>
    <dt>Substrate tags</dt><dd>${(entry.substrate_tags || []).map(s => escHtml(s)).join('; ')}</dd>
  </dl>
  <p><strong>Status:</strong> SCAFFOLD-PENDING. cc-2 dispatch will replace this stub with full content.</p>
</body>
</html>
`;
}

function renderDataSourcesStub(entry) {
  return JSON.stringify({
    scaffold_pending: true,
    sps_number: entry.sps_number,
    species: entry.common_name,
    scientific_name: entry.scientific_name,
    authority: entry.authority || null,
    cohort_entry_milestone: entry.cohort_entry_milestone,
    cross_track_nasa: entry.cross_track_nasa || null,
    structural_firsts: entry.structural_firsts || [],
    data_sources: [],
  }, null, 2) + '\n';
}

function renderKnowledgeNodesStub(entry) {
  return JSON.stringify({
    scaffold_pending: true,
    sps_number: entry.sps_number,
    species: entry.common_name,
    scientific_name: entry.scientific_name,
    cohort_entry_milestone: entry.cohort_entry_milestone,
    knowledge_nodes: [],
  }, null, 2) + '\n';
}

function loadManifest(manifestPath) {
  if (!existsSync(manifestPath)) {
    throw new Error(`manifest not found: ${manifestPath}`);
  }
  const raw = readFileSync(manifestPath, 'utf8');
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`manifest parse error: ${e.message}`);
  }
  if (!Array.isArray(parsed.species)) {
    throw new Error(`manifest missing 'species' array`);
  }
  return parsed;
}

export function scaffoldSpsPages({ dryRun = false, manifestPath = DEFAULT_MANIFEST, spsRoot = SPS_ROOT } = {}) {
  const summary = {
    species_in_manifest: 0,
    files_created: [],
    files_skipped_existing: [],
    dirs_created: [],
    errors: [],
  };

  let manifest;
  try {
    manifest = loadManifest(manifestPath);
  } catch (e) {
    summary.errors.push({ scope: 'manifest', error: e.message });
    return summary;
  }
  summary.species_in_manifest = manifest.species.length;

  for (const entry of manifest.species) {
    const speciesDir = join(spsRoot, entry.slug);
    if (!existsSync(speciesDir)) {
      if (!dryRun) {
        try { mkdirSync(speciesDir, { recursive: true }); }
        catch (e) { summary.errors.push({ slug: entry.slug, error: `mkdir failed: ${e.message}` }); continue; }
      }
      summary.dirs_created.push(entry.slug);
    }

    const targets = [
      { name: 'index.html', render: () => renderSpsStub(entry) },
      { name: 'data-sources.json', render: () => renderDataSourcesStub(entry) },
      { name: 'knowledge-nodes.json', render: () => renderKnowledgeNodesStub(entry) },
    ];

    for (const t of targets) {
      const path = join(speciesDir, t.name);
      if (existsSync(path)) {
        summary.files_skipped_existing.push(`${entry.slug}/${t.name}`);
        continue;
      }
      if (!dryRun) {
        try { writeFileSync(path, t.render()); }
        catch (e) { summary.errors.push({ slug: entry.slug, file: t.name, error: e.message }); continue; }
      }
      summary.files_created.push(`${entry.slug}/${t.name}`);
    }

    // artifacts/ subdir as marker (depth-audit checks for its presence)
    const artifactsDir = join(speciesDir, 'artifacts');
    if (!existsSync(artifactsDir)) {
      if (!dryRun) {
        try { mkdirSync(artifactsDir, { recursive: true }); }
        catch (e) { summary.errors.push({ slug: entry.slug, error: `artifacts mkdir failed: ${e.message}` }); continue; }
      }
      summary.files_created.push(`${entry.slug}/artifacts/`);
    } else {
      summary.files_skipped_existing.push(`${entry.slug}/artifacts/`);
    }
  }

  return summary;
}

function formatSummary(s, dryRun) {
  const verb = dryRun ? 'would create' : 'created';
  const lines = [];
  lines.push(`scaffold-sps-pages: ${s.species_in_manifest} species in manifest`);
  lines.push(`  dirs ${verb}: ${s.dirs_created.length}${s.dirs_created.length ? ' (' + s.dirs_created.join(', ') + ')' : ''}`);
  lines.push(`  files ${verb}: ${s.files_created.length}`);
  if (s.files_created.length > 0 && s.files_created.length <= 30) {
    for (const f of s.files_created) lines.push(`    ${f}`);
  }
  lines.push(`  files skipped (existing): ${s.files_skipped_existing.length}`);
  if (s.errors.length > 0) {
    lines.push(`  ERRORS:`);
    for (const e of s.errors) lines.push(`    ${e.slug || e.scope || '?'}${e.file ? '/' + e.file : ''}: ${e.error}`);
  }
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const jsonMode = args.includes('--json');
  const manifestIdx = args.indexOf('--manifest');
  const manifestPath = manifestIdx >= 0 ? resolve(args[manifestIdx + 1]) : DEFAULT_MANIFEST;

  const summary = scaffoldSpsPages({ dryRun, manifestPath });

  if (jsonMode) console.log(JSON.stringify(summary, null, 2));
  else console.log(formatSummary(summary, dryRun));

  if (summary.errors.length > 0) process.exit(2);
  process.exit(0);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('scaffold-sps-pages.mjs');
if (invokedDirectly) main();

export { SCAFFOLD_MARKER, renderSpsStub, renderDataSourcesStub, renderKnowledgeNodesStub, loadManifest };
