#!/usr/bin/env node
// tools/scaffold-trs-packs.mjs — manifest-driven TRS pack scaffold creator (cc-1 C07).
//
// PURPOSE: Close the FA-663-6 + operator-absorbed TRS pack 14-38 drift by emitting
// minimal valid index.html stubs (with SCAFFOLD-PENDING marker) for every pack-NN
// dir enumerated in `tools/scaffold-trs-packs.manifest.json`. Companion to
// scaffold-cross-track-dirs.mjs + scaffold-sps-pages.mjs.
//
// MODEL:
//   - IDEMPOTENT per dir: never overwrites existing index.html; only writes when
//     the target pack-NN/index.html is absent. Re-runs are safe no-ops.
//   - SCAFFOLD-PENDING HTML comment marker recognized by depth-audit.mjs.
//   - PURE NODE — no DB read, no network. Stub content derived from manifest.
//
// USAGE:
//   node tools/scaffold-trs-packs.mjs               # scan + scaffold
//   node tools/scaffold-trs-packs.mjs --dry-run     # report what would change
//   node tools/scaffold-trs-packs.mjs --json        # machine-readable summary
//   node tools/scaffold-trs-packs.mjs --manifest <path>  # alternate manifest
//
// EXIT CODES:
//   0  ok (scaffolded N files OR dry-run report)
//   2  filesystem / IO error

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = dirname(HERE);
const TRS_ROOT = join(REPO_ROOT, 'www/tibsfox/com/Research/TRS');
const DEFAULT_MANIFEST = join(HERE, 'scaffold-trs-packs.manifest.json');

const SCAFFOLD_MARKER = '<!-- SCAFFOLD-PENDING: backfill required -->';

function escHtml(s) {
  if (s === null || s === undefined) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function packDirName(n) {
  return `pack-${String(n).padStart(2, '0')}`;
}

export function renderTrsStub(entry) {
  const dirName = packDirName(entry.pack);
  const theme = entry.theme || 'pending';
  const kn = entry.k_n != null ? `K_${entry.pack} = ${entry.k_n} edges` : `K_${entry.pack} = pending`;
  const ms = entry.milestone_bound || 'pending';
  return `<!DOCTYPE html>
<html lang="en" data-page="trs-scaffold" data-harness-version="1.0.0">
<head>
  <meta charset="utf-8" />
  <meta content="width=device-width, initial-scale=1.0" name="viewport" />
  <title>TRS ${escHtml(dirName)} &mdash; ${escHtml(theme)} (${escHtml(kn)})</title>
  <meta name="description" content="${escHtml(`TRS pack ${entry.pack} scaffold; ${theme}; awaiting cc-2 backfill.`)}" />
  ${SCAFFOLD_MARKER}
  <style>
    body { font-family: 'DM Sans', -apple-system, sans-serif; background: #08090A; color: #D4D0C8; padding: 2rem; line-height: 1.65; }
    .scaffold-banner { background: #1B2838; border: 1px solid #C4A35A; padding: 1rem; border-radius: 8px; margin-bottom: 1.5rem; color: #E8EBF2; }
    .scaffold-banner strong { color: #C4A35A; }
    h1 { color: #E8EBF2; font-family: 'Libre Baskerville', Georgia, serif; }
    dt { font-weight: bold; color: #C4A35A; margin-top: 0.6rem; }
    dd { margin-left: 1rem; }
    a { color: #C4A35A; }
  </style>
</head>
<body>
  <div class="scaffold-banner">
    <strong>SCAFFOLD-PENDING</strong> &mdash; TRS pack stub created by
    <code>tools/scaffold-trs-packs.mjs</code>. Backfill (edge enumeration, bridge categories,
    K_N achievement, narrative cards) is scheduled for cc-2 (v1.49.665) per FA-663-6
    + operator-absorbed pack-14..38 drift closure plan.
  </div>
  <h1>TRS ${escHtml(dirName)} &mdash; <em>${escHtml(theme)}</em></h1>
  <dl>
    <dt>Pack</dt><dd>${escHtml(dirName)}</dd>
    <dt>Theme</dt><dd>${escHtml(theme)}</dd>
    <dt>K_N target</dt><dd>${escHtml(kn)}</dd>
    <dt>Milestone bound</dt><dd>${escHtml(ms)}</dd>
  </dl>
  <p><strong>Status:</strong> SCAFFOLD-PENDING. cc-2 dispatch will replace this stub with full content (edge enumeration, bridge categories, substrate-coherence with cross-track NASA/MUS/ELC/SPS, K_N completion).</p>
</body>
</html>
`;
}

export function loadManifest(manifestPath) {
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
  if (!Array.isArray(parsed.packs)) {
    throw new Error(`manifest missing 'packs' array`);
  }
  return parsed;
}

export function scaffoldTrsPacks({ dryRun = false, manifestPath = DEFAULT_MANIFEST, trsRoot = TRS_ROOT } = {}) {
  const summary = {
    packs_in_manifest: 0,
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
  summary.packs_in_manifest = manifest.packs.length;

  for (const entry of manifest.packs) {
    const dirName = packDirName(entry.pack);
    const packDir = join(trsRoot, dirName);
    const indexPath = join(packDir, 'index.html');

    if (existsSync(indexPath)) {
      summary.files_skipped_existing.push(`${dirName}/index.html`);
      continue;
    }

    if (!existsSync(packDir)) {
      if (!dryRun) {
        try { mkdirSync(packDir, { recursive: true }); }
        catch (e) { summary.errors.push({ pack: dirName, error: `mkdir failed: ${e.message}` }); continue; }
      }
      summary.dirs_created.push(dirName);
    }

    if (!dryRun) {
      try { writeFileSync(indexPath, renderTrsStub(entry)); }
      catch (e) { summary.errors.push({ pack: dirName, error: e.message }); continue; }
    }
    summary.files_created.push(`${dirName}/index.html`);
  }

  return summary;
}

function formatSummary(s, dryRun) {
  const verb = dryRun ? 'would create' : 'created';
  const lines = [];
  lines.push(`scaffold-trs-packs: ${s.packs_in_manifest} packs in manifest`);
  lines.push(`  dirs ${verb}: ${s.dirs_created.length}`);
  lines.push(`  files ${verb}: ${s.files_created.length}`);
  if (s.files_created.length > 0 && s.files_created.length <= 40) {
    for (const f of s.files_created) lines.push(`    ${f}`);
  }
  lines.push(`  files skipped (existing): ${s.files_skipped_existing.length}`);
  if (s.errors.length > 0) {
    lines.push(`  ERRORS:`);
    for (const e of s.errors) lines.push(`    ${e.pack || e.scope || '?'}: ${e.error}`);
  }
  return lines.join('\n');
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const jsonMode = args.includes('--json');
  const manifestIdx = args.indexOf('--manifest');
  const manifestPath = manifestIdx >= 0 ? resolve(args[manifestIdx + 1]) : DEFAULT_MANIFEST;

  const summary = scaffoldTrsPacks({ dryRun, manifestPath });

  if (jsonMode) console.log(JSON.stringify(summary, null, 2));
  else console.log(formatSummary(summary, dryRun));

  if (summary.errors.length > 0) process.exit(2);
  process.exit(0);
}

const invokedDirectly = process.argv[1] && process.argv[1].endsWith('scaffold-trs-packs.mjs');
if (invokedDirectly) main();

export { SCAFFOLD_MARKER, packDirName };
