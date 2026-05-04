#!/usr/bin/env node
/**
 * tools/update-catalog-indexes.mjs — catalog-index drift detector / fixer.
 *
 * Closes the silent-drift class of failures surfaced post-v1.49.600 ship:
 * NASA/MUS/ELC catalog index files (www/tibsfox/com/Research/{track}/index.html)
 * accumulated 3 milestones of drift (v598/v599/v600 — degrees 1.78/1.79/1.80
 * missing from all three catalogs) before any gate fired.
 *
 * Root cause: on-disk degree dirs are auto-built per W2; catalog indexes are
 * hand-edited prose. No derivation step existed. This script auto-derives the
 * expected catalog state from on-disk degree dirs and enforces it.
 *
 * Modes:
 *   (default / --check)   exit 0 = no drift; exit 8 = drift detected
 *   --write               for NASA: rewrite completedMissions Set in place.
 *                         for MUS + ELC: REFUSE (cannot invent card content).
 *   --json                machine-readable JSON output
 *   --root <path>         override repo root (hermetic tests)
 *
 * Exit codes:
 *   0  all PASS (no drift)
 *   8  drift detected (mirrors pre-tag-gate exit code allocation: 1=build,
 *      2=vitest, 3=completeness, 4=CI-on-dev, 5=www-bundles, 6=depth-audit,
 *      7=CLAUDE.md drift; 8 = catalog-index drift — added v1.49.601)
 *   2  invalid arguments
 *   1  internal error / I/O failure
 *
 * Authored 2026-05-04 in v1.49.601 W0 (Catalog-Index Auto-Derive Counter-Cadence).
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));

const TRACKS = ['NASA', 'MUS', 'ELC'];

// Degree directory pattern: "1.N" where N is one or more digits.
// Excludes non-degree dirs like "catalog", "_harness", etc.
const DEGREE_DIR_RE = /^\d+\.\d+$/;

// ---- CLI parsing ----

function resolveRoot(argv) {
  const i = argv.indexOf('--root');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return join(HERE, '..');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const check = args.includes('--check') || (!args.includes('--write') && !args.includes('--json') && !args.includes('--help'));
  // --check is implied by default (no flags) OR explicit --check; also implied
  // alongside --json with no --write.
  const write = args.includes('--write');
  const json = args.includes('--json');
  const help = args.includes('--help') || args.includes('-h');
  return { check: check || (!write), write, json, help };
}

// ---- Degree scanning ----

/**
 * Scan a track directory for on-disk degree directories.
 * Returns sorted array of degree strings e.g. ["1.0","1.1",...,"1.80"].
 * Numeric sort on the minor portion (after the dot).
 */
export function scanOnDiskDegrees(researchRoot, track) {
  const trackDir = join(researchRoot, track);
  if (!existsSync(trackDir)) return [];
  let entries;
  try {
    entries = readdirSync(trackDir, { withFileTypes: true });
  } catch {
    return [];
  }
  const degrees = entries
    .filter((e) => e.isDirectory() && DEGREE_DIR_RE.test(e.name))
    .map((e) => e.name);
  // Sort numerically by minor version number.
  degrees.sort((a, b) => {
    const [aMaj, aMin] = a.split('.').map(Number);
    const [bMaj, bMin] = b.split('.').map(Number);
    if (aMaj !== bMaj) return aMaj - bMaj;
    return aMin - bMin;
  });
  return degrees;
}

// ---- NASA catalog parsing ----

/**
 * Extract the completedMissions Set from the NASA index.html.
 * Returns array of degree strings in the order they appear in the Set literal.
 *
 * The Set looks like:
 *   const completedMissions = new Set([
 *     '1.0', '1.1', ...
 *   ]);
 */
export function parseNasaCompletedSet(html) {
  // Match the Set([...]) block (may span multiple lines).
  const setMatch = html.match(/completedMissions\s*=\s*new\s+Set\(\[([\s\S]*?)\]\)/);
  if (!setMatch) return null; // could not parse
  const body = setMatch[1];
  // Extract all quoted degree strings.
  const found = [];
  const entryRe = /'([^']+)'/g;
  let m;
  while ((m = entryRe.exec(body)) !== null) {
    found.push(m[1]);
  }
  return found;
}

/**
 * Rewrite the completedMissions Set block in the NASA index.html.
 * Preserves the surrounding HTML; replaces only the Set literal content.
 * Formatting: entries <= 1.49 are kept 10-per-line (matching original);
 * entries >= 1.50 are placed one-per-line (matching original style post-1.50).
 */
export function rewriteNasaCompletedSet(html, degrees) {
  // Build the replacement body.
  // Original file has 1.0–1.49 packed 10-per-line, 1.50+ one-per-line.
  const lines = [];
  let lineAccum = [];
  for (const deg of degrees) {
    const minor = Number(deg.split('.')[1]);
    if (minor < 50) {
      lineAccum.push(`'${deg}'`);
      if (lineAccum.length === 10) {
        lines.push('  ' + lineAccum.join(', ') + ',');
        lineAccum = [];
      }
    } else {
      // Flush any pending lineAccum (handles transition from <50 to >=50).
      if (lineAccum.length > 0) {
        lines.push('  ' + lineAccum.join(', ') + ',');
        lineAccum = [];
      }
      lines.push(`  '${deg}'`+ (deg !== degrees[degrees.length - 1] ? ',' : ''));
    }
  }
  // Flush any remaining short line (e.g. if all degrees < 50).
  if (lineAccum.length > 0) {
    lines.push('  ' + lineAccum.join(', '));
  }
  const newBody = '\n' + lines.join('\n') + '\n';
  // Replace the existing Set literal.
  const updated = html.replace(
    /(completedMissions\s*=\s*new\s+Set\(\[)([\s\S]*?)(\]\))/,
    (_, open, _body, close) => open + newBody + close
  );
  return updated;
}

// ---- MUS/ELC catalog parsing ----

/**
 * Extract all degree hrefs from the MUS or ELC catalog index.html.
 * Looks for: href="N.NN/index.html" or href="N.N/index.html"
 * Returns array of degree strings (just the numeric part, e.g. "1.78").
 */
export function parseCatalogHrefs(html) {
  const found = [];
  // Match href="1.78/index.html" style references.
  const re = /href="(\d+\.\d+)\/index\.html"/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    found.push(m[1]);
  }
  return found;
}

// ---- Diff helpers ----

function setDiff(a, b) {
  const setA = new Set(a);
  const setB = new Set(b);
  return {
    missingFromB: [...setA].filter((x) => !setB.has(x)),
    extraInB: [...setB].filter((x) => !setA.has(x)),
  };
}

// ---- Per-track audit ----

/**
 * Audit a single track.
 * Returns a track-result object conforming to the --json schema.
 */
export function auditTrack(researchRoot, track) {
  const onDisk = scanOnDiskDegrees(researchRoot, track);
  const catalogPath = join(researchRoot, track, 'index.html');

  if (!existsSync(catalogPath)) {
    return {
      on_disk_degrees: onDisk,
      catalog_exists: false,
      error: `Catalog index not found: ${catalogPath}`,
      status: 'ERROR',
    };
  }

  let html;
  try {
    html = readFileSync(catalogPath, 'utf8');
  } catch (err) {
    return {
      on_disk_degrees: onDisk,
      catalog_exists: true,
      error: `Failed to read catalog: ${err.message}`,
      status: 'ERROR',
    };
  }

  if (track === 'NASA') {
    const inCatalog = parseNasaCompletedSet(html);
    if (inCatalog === null) {
      return {
        on_disk_degrees: onDisk,
        in_catalog_set: null,
        error: 'Could not parse completedMissions Set from NASA index.html',
        status: 'ERROR',
      };
    }
    const { missingFromB: missingFromCatalog, extraInB: extraInCatalog } =
      setDiff(onDisk, inCatalog);
    const anyDrift = missingFromCatalog.length > 0 || extraInCatalog.length > 0;
    return {
      on_disk_degrees: onDisk,
      in_catalog_set: inCatalog,
      missing_from_catalog: missingFromCatalog,
      extra_in_catalog: extraInCatalog,
      status: anyDrift ? 'DRIFT' : 'PASS',
    };
  } else {
    // MUS or ELC: check href presence.
    const inCatalog = parseCatalogHrefs(html);
    const { missingFromB: missingFromCatalog, extraInB: extraInCatalog } =
      setDiff(onDisk, inCatalog);
    const anyDrift = missingFromCatalog.length > 0 || extraInCatalog.length > 0;
    return {
      on_disk_degrees: onDisk,
      in_catalog_hrefs: inCatalog,
      missing_from_catalog: missingFromCatalog,
      extra_in_catalog: extraInCatalog,
      status: anyDrift ? 'DRIFT' : 'PASS',
    };
  }
}

// ---- Write mode ----

/**
 * Apply --write for a single track.
 * NASA: rewrites the completedMissions Set.
 * MUS/ELC: refuses (cannot invent card content).
 *
 * Returns { ok, message }.
 */
export function writeTrack(researchRoot, track, trackResult) {
  if (trackResult.status === 'PASS') {
    return { ok: true, message: `${track}: already in sync — no write needed` };
  }
  if (trackResult.status === 'ERROR') {
    return { ok: false, message: `${track}: cannot write — read error: ${trackResult.error}` };
  }

  if (track === 'NASA') {
    // Rewrite the completedMissions Set.
    const catalogPath = join(researchRoot, track, 'index.html');
    let html;
    try {
      html = readFileSync(catalogPath, 'utf8');
    } catch (err) {
      return { ok: false, message: `NASA: failed to read catalog for write: ${err.message}` };
    }
    const newDegrees = trackResult.on_disk_degrees;
    const updated = rewriteNasaCompletedSet(html, newDegrees);
    try {
      writeFileSync(catalogPath, updated, 'utf8');
    } catch (err) {
      return { ok: false, message: `NASA: failed to write catalog: ${err.message}` };
    }
    return { ok: true, message: `NASA: rewrote completedMissions Set with ${newDegrees.length} entries` };
  } else {
    // MUS/ELC: refuse — cannot invent card content.
    const missing = trackResult.missing_from_catalog || [];
    if (missing.length === 0) {
      // Only extra-in-catalog drift — still refuse auto-write (would delete hand-authored content).
      const extra = trackResult.extra_in_catalog || [];
      return {
        ok: false,
        message:
          `${track}: --write refused. Catalog has ${extra.length} extra href(s) not matching ` +
          `any on-disk degree dir: ${extra.join(', ')}. ` +
          `Remove stale entries manually from www/tibsfox/com/Research/${track}/index.html, ` +
          `then re-run --check.`,
      };
    }
    // Find an example degree-card div line number for user guidance.
    const catalogPath = join(researchRoot, track, 'index.html');
    let exampleLine = '(see existing degree-card divs in catalog)';
    try {
      const lines = readFileSync(catalogPath, 'utf8').split('\n');
      const idx = lines.findIndex((l) => l.includes('degree-card') && l.includes('href='));
      if (idx >= 0) exampleLine = `line ${idx + 1}`;
    } catch {}
    return {
      ok: false,
      message:
        `${track}: --write refused. Missing degree-card stub(s) in ${track} catalog: ` +
        `${missing.join(', ')}. ` +
        `Author cards manually following the pattern at ${exampleLine} in ` +
        `www/tibsfox/com/Research/${track}/index.html, then re-run --check.`,
    };
  }
}

// ---- Main ----

function buildSummary(trackResults) {
  const totalDrift = Object.values(trackResults).reduce(
    (sum, t) => sum + (t.missing_from_catalog || []).length + (t.extra_in_catalog || []).length,
    0
  );
  const anyDrift = Object.values(trackResults).some((t) => t.status !== 'PASS');
  return {
    total_drift_degrees: totalDrift,
    any_drift: anyDrift,
    status: anyDrift ? 'DRIFT' : 'PASS',
  };
}

export async function main(argv = process.argv) {
  const REPO_ROOT = resolveRoot(argv);
  const RESEARCH_ROOT = join(REPO_ROOT, 'www', 'tibsfox', 'com', 'Research');

  const { check, write, json, help } = parseArgs(argv);

  if (help) {
    console.log(`
update-catalog-indexes.mjs — catalog-index drift detector / fixer

Usage:
  node tools/update-catalog-indexes.mjs           # --check (default)
  node tools/update-catalog-indexes.mjs --check   # exit 0 OK; exit 8 drift
  node tools/update-catalog-indexes.mjs --write   # rewrite NASA Set; refuse MUS/ELC
  node tools/update-catalog-indexes.mjs --json    # machine-readable output
  node tools/update-catalog-indexes.mjs --json --check  # combined

Exit codes: 0=PASS, 8=drift, 2=bad args, 1=internal error
`.trim());
    process.exit(0);
  }

  // Audit all tracks.
  const trackResults = {};
  for (const track of TRACKS) {
    trackResults[track] = auditTrack(RESEARCH_ROOT, track);
  }
  const summary = buildSummary(trackResults);

  // --write mode.
  if (write) {
    const writeResults = {};
    let anyWriteFailure = false;
    for (const track of TRACKS) {
      const wr = writeTrack(RESEARCH_ROOT, track, trackResults[track]);
      writeResults[track] = wr;
      if (!wr.ok) anyWriteFailure = true;
    }

    if (json) {
      // Re-audit after writes to show updated state.
      const postTrackResults = {};
      for (const track of TRACKS) {
        postTrackResults[track] = auditTrack(RESEARCH_ROOT, track);
      }
      const postSummary = buildSummary(postTrackResults);
      console.log(JSON.stringify({
        mode: 'write',
        write_results: writeResults,
        post_write: {
          tracks: postTrackResults,
          summary: postSummary,
        },
      }, null, 2));
    } else {
      for (const track of TRACKS) {
        const wr = writeResults[track];
        const prefix = wr.ok ? '[ok]' : '[FAIL]';
        if (wr.ok) {
          console.log(`${prefix} ${wr.message}`);
        } else {
          console.error(`${prefix} ${wr.message}`);
        }
      }
    }

    if (anyWriteFailure) process.exit(8);
    process.exit(0);
  }

  // --check / default mode.
  if (json) {
    console.log(JSON.stringify({
      tracks: trackResults,
      summary,
    }, null, 2));
  } else {
    for (const track of TRACKS) {
      const t = trackResults[track];
      if (t.status === 'ERROR') {
        console.error(`[ERROR] ${track}: ${t.error}`);
      } else if (t.status === 'DRIFT') {
        const missing = t.missing_from_catalog || [];
        const extra = t.extra_in_catalog || [];
        if (missing.length > 0) {
          console.error(`[DRIFT] ${track}: ${missing.length} degree(s) on disk but missing from catalog: ${missing.join(', ')}`);
        }
        if (extra.length > 0) {
          console.error(`[DRIFT] ${track}: ${extra.length} catalog entry/entries have no matching on-disk degree dir: ${extra.join(', ')}`);
        }
        if (track !== 'NASA') {
          console.error(`  Fix: author degree-card div(s) manually in www/tibsfox/com/Research/${track}/index.html, then re-run --check.`);
        } else {
          console.error(`  Fix: run --write to auto-update the NASA completedMissions Set, then re-run --check.`);
        }
      } else {
        console.log(`[PASS] ${track}: ${(t.on_disk_degrees || []).length} degrees — catalog in sync`);
      }
    }
    console.log('');
    if (summary.any_drift) {
      console.error(`[DRIFT] catalog-index drift detected — ${summary.total_drift_degrees} degree(s) out of sync`);
      console.error('  Pre-tag-gate step 8 BLOCKER: fix drift before tagging.');
    } else {
      console.log('[PASS] all catalog indexes in sync with on-disk degrees');
    }
  }

  if (summary.any_drift) process.exit(8);
  process.exit(0);
}

// Only run main() when invoked directly (not when imported by tests).
const invokedDirectly =
  process.argv[1] && (
    process.argv[1].endsWith('update-catalog-indexes.mjs') ||
    process.argv[1].endsWith('update-catalog-indexes')
  );
if (invokedDirectly) {
  main(process.argv).catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
