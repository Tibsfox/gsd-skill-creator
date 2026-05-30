#!/usr/bin/env node
/**
 * tools/ftp-sync.mjs — version-parameterized FTP push for tibsfox.com Research/
 *
 * Closes Lesson #10195 candidate from v1.49.589 §4: every milestone ship
 * pipeline pushes 49+ build artifacts (NASA + MUS + ELC index.html sets at
 * the new degree) to tibsfox.com via FTP. v1.49.589 used an ad-hoc
 * Python ftplib script (`/home/foxy/ftp-sync-v1-49-589.py`, deleted post-use).
 * The pattern recurs every milestone; this tool promotes it into the repo.
 *
 * FTP connection facts (per memory + .env-canonical + ad-hoc script):
 *   - host/user/pass/root path read from .env (FTP_HOST, FTP_USER, FTP_PASS,
 *     FTP_PATH); FTP_PASS leading character is a literal `'` (DO NOT strip)
 *   - remote root `/` maps to `/Research/` on the visible URL — the FTP
 *     account is chrooted; `cd /Research` BEFORE put will fail
 *   - upload base path is therefore the version directory directly:
 *     local `www/tibsfox/com/Research/{NASA,MUS,ELC}/<version>/...`
 *     → remote `/{NASA,MUS,ELC}/<version>/...`
 *
 * Usage:
 *   node tools/ftp-sync.mjs <version>                    # push NASA/MUS/ELC + verify
 *   node tools/ftp-sync.mjs scribe                       # push SCRIBE (no version subdir)
 *   node tools/ftp-sync.mjs <version> --dry-run          # list files, no upload
 *   node tools/ftp-sync.mjs scribe --dry-run             # SCRIBE dry-run
 *   node tools/ftp-sync.mjs <version> --json             # machine-readable summary
 *   node tools/ftp-sync.mjs <version> --no-verify        # skip post-upload HTTPS probe
 *   node tools/ftp-sync.mjs <version> --include-catalog-index
 *     # ALSO upload the NASA/MUS/ELC catalog index.html pages (one level up
 *     # from the version dir) — closes Lesson #10206 candidate from v1.49.591;
 *     # promotes the ad-hoc sync-catalog-indexes.mjs pattern (used at v1.49.590
 *     # + v1.49.591 ship pipelines) into the canonical FTP tool.
 *
 *   npm run ftp-sync -- 1.71
 *   npm run ftp-sync -- scribe
 *   npm run ftp-sync:dry-run -- 1.71
 *
 * Exit codes:
 *   0  all files PUT + verified successfully (or dry-run completed)
 *   1  one or more PUT failures OR verification failures
 *   2  invalid arguments OR .env missing required keys
 *   3  local source dir(s) missing for the requested version
 *   4  PUT succeeded but verification probe found 404s (drift detection)
 *   5  catalog-index drift detected (only raised when --include-catalog-index
 *      is set and update-catalog-indexes.mjs --check exits non-zero; added
 *      v1.49.601 as a precondition guard before uploading stale catalogs)
 *
 * Verification probe (added v1.49.590 post-ship; closes Lesson #10203 candidate):
 * After uploads complete, the tool issues HTTPS HEAD requests to a sample of
 * uploaded files (default: index.html for each track + 2 random files). If any
 * probe returns non-200, exit code 4 is raised. The probe URL is constructed
 * from FTP_PUBLIC_BASE_URL (defaults to https://tibsfox.com/Research). This
 * catches the v1.49.589 silent-failure mode where the ad-hoc Python ftplib
 * script reported "ALL PASS" but v1.70 NASA + MUS + ELC dirs never landed.
 *
 * Authored 2026-04-30 in v1.49.590 W0 component T2.1.
 * Verification probe added 2026-04-30 post-ship after v1.70 404 incident.
 */

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
// NOTE: `basic-ftp` is lazy-imported inside main() (the live-upload path) rather
// than at module top-level. It is an optional, undeclared runtime dependency
// needed ONLY for real (non-dry-run) FTP sync. A top-level import makes the
// module unloadable when basic-ftp is absent, which broke the pure-helper test
// suite (v1.49.913). The dynamic import lives in the same `if (!dryRun)` branch
// as the Client instantiation, so behavior on the live path is unchanged.

const HERE = dirname(fileURLToPath(import.meta.url));

function resolveRoot(argv) {
  const i = argv.indexOf('--root');
  if (i >= 0 && argv[i + 1]) return argv[i + 1];
  return join(HERE, '..');
}

const REPO_ROOT = resolveRoot(process.argv);
const TRACKS = ['NASA', 'MUS', 'ELC'];

/**
 * Parse .env into an object. Preserves the value verbatim (no quote-stripping)
 * so FTP_PASS leading-quote characters are preserved per memory rule.
 */
export function parseEnv(envText) {
  const out = {};
  for (const rawLine of envText.split(/\r?\n/)) {
    const line = rawLine.replace(/^﻿/, '');
    if (!line || line.trim().startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1);
    // Per memory note: FTP_PASS leading-quote IS the password, do NOT strip.
    // We only strip a *matched* surrounding pair of double-quotes (common .env
    // convention for values with spaces); single-quoted values are preserved
    // literally (single-quote is part of the FTP_PASS).
    if (val.length >= 2 && val.startsWith('"') && val.endsWith('"')) {
      val = val.slice(1, -1);
    }
    out[key] = val;
  }
  return out;
}

function loadEnv(repoRoot) {
  const envPath = process.env.RH_ENV_FILE || join(repoRoot, '.env');
  if (!existsSync(envPath)) {
    return { __missing: envPath };
  }
  const txt = readFileSync(envPath, 'utf8');
  return parseEnv(txt);
}

/**
 * Walk a local directory tree, returning files relative to it.
 * No symlink-following; no hidden-file inclusion (.* skipped).
 */
export function walkDir(absDir) {
  const out = [];
  function rec(rel) {
    const full = join(absDir, rel);
    let entries;
    try {
      entries = readdirSync(full, { withFileTypes: true });
    } catch {
      return;
    }
    for (const ent of entries) {
      if (ent.name.startsWith('.')) continue;
      const childRel = rel === '' ? ent.name : `${rel}/${ent.name}`;
      const childFull = join(absDir, childRel);
      if (ent.isDirectory()) {
        rec(childRel);
      } else if (ent.isFile()) {
        const st = statSync(childFull);
        out.push({ rel: childRel, size: st.size });
      }
    }
  }
  rec('');
  return out;
}

/**
 * Build the upload manifest for SCRIBE target.
 * SCRIBE is a single-shot research deliverable at www/tibsfox/com/Research/SCRIBE/
 * (no version-numbered subdirectory). Recursively walks all files.
 *
 * @param {string} repoRoot — absolute path to repo root
 * @returns { files: [{rel,size,localAbs,remoteAbs}...], totalFiles, totalBytes, missing }
 */
export function buildManifestScribe(repoRoot) {
  const sourceDir = join(repoRoot, 'www', 'tibsfox', 'com', 'Research', 'SCRIBE');
  const manifest = { files: [], totalFiles: 0, totalBytes: 0, missing: false };
  if (!existsSync(sourceDir)) {
    manifest.missing = true;
    return manifest;
  }
  const files = walkDir(sourceDir);
  for (const f of files) {
    manifest.files.push({
      rel: f.rel,
      size: f.size,
      localAbs: join(sourceDir, f.rel),
      remoteAbs: `/SCRIBE/${f.rel}`,
    });
  }
  manifest.totalFiles = manifest.files.length;
  manifest.totalBytes = manifest.files.reduce((sum, f) => sum + f.size, 0);
  return manifest;
}

/**
 * Build the upload manifest for a given version.
 *
 * @param {string} repoRoot — absolute path to repo root
 * @param {string} version  — e.g. "1.71"
 * @param {object} [opts]   — { includeCatalogIndex: boolean }
 *   includeCatalogIndex: when true, also include the per-track catalog
 *   index.html (located ONE LEVEL UP from the version dir at
 *   www/tibsfox/com/Research/{track}/index.html → /{track}/index.html).
 *   Closes Lesson #10206 candidate from v1.49.591 (T2.3 v1.49.592).
 *
 * Returns: { tracks: { NASA: [{rel,size,kind?}...], MUS: [...], ELC: [...] },
 *            totalFiles, totalBytes, missingTracks }
 *
 * Catalog-index entries carry kind: 'catalog' for downstream disambiguation
 * (per-version files have no kind field; treat absence as 'version').
 */
export function buildManifest(repoRoot, version, opts = {}) {
  const includeCatalogIndex = opts.includeCatalogIndex === true;
  const manifest = { tracks: {}, totalFiles: 0, totalBytes: 0, missingTracks: [] };
  for (const track of TRACKS) {
    const dir = join(repoRoot, 'www', 'tibsfox', 'com', 'Research', track, version);
    const trackEntries = [];
    if (!existsSync(dir)) {
      manifest.missingTracks.push(track);
    } else {
      const files = walkDir(dir);
      for (const f of files) {
        trackEntries.push({
          rel: f.rel,
          size: f.size,
          localAbs: join(dir, f.rel),
          remoteAbs: `/${track}/${version}/${f.rel}`,
        });
      }
    }
    if (includeCatalogIndex) {
      const catalogPath = join(repoRoot, 'www', 'tibsfox', 'com', 'Research', track, 'index.html');
      if (existsSync(catalogPath)) {
        const st = statSync(catalogPath);
        trackEntries.push({
          rel: 'index.html',
          size: st.size,
          localAbs: catalogPath,
          remoteAbs: `/${track}/index.html`,
          kind: 'catalog',
        });
      }
    }
    manifest.tracks[track] = trackEntries;
    manifest.totalFiles += trackEntries.length;
    manifest.totalBytes += trackEntries.reduce((sum, e) => sum + e.size, 0);
  }
  return manifest;
}

/**
 * Validate version string. Accepts "1.70", "1.71", etc. Rejects "v1.71" + paths.
 */
export function validateVersion(v) {
  if (!v || typeof v !== 'string') return false;
  return /^\d+\.\d+$/.test(v);
}

/**
 * Validate .env has the required FTP keys.
 * Returns { ok: true } or { ok: false, missing: [...] }.
 */
export function validateEnv(env) {
  const required = ['FTP_HOST', 'FTP_USER', 'FTP_PASS'];
  const missing = required.filter((k) => !env[k]);
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}

/**
 * Pick the sample of uploaded files to verify via HTTPS HEAD.
 * Handles both track-based manifests (NASA/MUS/ELC) and SCRIBE single-dir.
 * For tracks: always includes index.html for each present track + up to 2 random files.
 * For SCRIBE: always includes index.html (at SCRIBE root) + up to 2 random files.
 * Up to 5 probes total.
 *
 * Returns array of { remoteAbs, size } items.
 */
export function pickVerificationSample(manifest, sampleSize = 5) {
  const sample = [];
  const seen = new Set();
  const add = (item) => {
    if (!item || seen.has(item.remoteAbs)) return;
    seen.add(item.remoteAbs);
    sample.push(item);
  };

  // SCRIBE format: { files: [...], totalFiles, totalBytes, missing }
  if (manifest.files !== undefined) {
    const rootIndex = manifest.files.find((f) => f.rel === 'index.html');
    if (rootIndex) add(rootIndex);
    while (sample.length < sampleSize && sample.length < manifest.files.length) {
      const f = manifest.files[Math.floor(Math.random() * manifest.files.length)];
      add(f);
    }
    return sample;
  }

  // Track-based format: { tracks: {...}, totalFiles, totalBytes, missingTracks }
  for (const track of Object.keys(manifest.tracks)) {
    const files = manifest.tracks[track];
    const idx = files.find((f) => f.rel === 'index.html');
    if (idx) add(idx);
  }
  const allFiles = Object.values(manifest.tracks).flat();
  while (sample.length < sampleSize && sample.length < allFiles.length) {
    const f = allFiles[Math.floor(Math.random() * allFiles.length)];
    add(f);
  }
  return sample;
}

/**
 * Translate a remote FTP path to a public URL.
 * remoteAbs format: /<TRACK>/<version>/<path>
 * URL format: <baseUrl>/<TRACK>/<version>/<path>
 *
 * baseUrl defaults to https://tibsfox.com/Research per FTP root → URL mapping.
 * Override via FTP_PUBLIC_BASE_URL env var.
 */
export function remotePathToUrl(remoteAbs, baseUrl = 'https://tibsfox.com/Research') {
  return baseUrl.replace(/\/$/, '') + remoteAbs;
}

/**
 * HEAD-probe a URL. Returns { url, status, ok } where ok = (status === 200).
 * Uses Node's built-in fetch (>= Node 18).
 */
export async function probeUrl(url, timeoutMs = 10000) {
  try {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), timeoutMs);
    const res = await fetch(url, { method: 'HEAD', signal: ac.signal });
    clearTimeout(t);
    return { url, status: res.status, ok: res.status === 200 };
  } catch (err) {
    return { url, status: 0, ok: false, error: String(err.message || err) };
  }
}

async function pushFiles(client, files, opts) {
  const results = [];
  for (const f of files) {
    if (opts.dryRun) {
      results.push({ ...f, status: 'dry-run-listed' });
      if (!opts.json) console.log(`[dry-run] ${f.remoteAbs} (${f.size} bytes)`);
      continue;
    }
    try {
      // basic-ftp: ensureDir + uploadFrom semantics. ensureDir creates
      // parent directories on the remote as needed.
      const remoteDir = dirname(f.remoteAbs);
      await client.ensureDir(remoteDir);
      // ensureDir leaves us inside remoteDir; cd back to root for next file.
      await client.cd('/');
      await client.uploadFrom(f.localAbs, f.remoteAbs);
      results.push({ ...f, status: 'uploaded' });
      if (!opts.json) console.log(`[ok] ${f.remoteAbs} (${f.size} bytes)`);
    } catch (err) {
      results.push({ ...f, status: 'failed', error: String(err.message || err) });
      if (!opts.json) console.error(`[FAIL] ${f.remoteAbs}: ${err.message || err}`);
    }
  }
  return results;
}

async function main() {
  const argv = process.argv.slice(2);
  const dryRun = argv.includes('--dry-run');
  const json = argv.includes('--json');
  const noVerify = argv.includes('--no-verify');
  const includeCatalogIndex = argv.includes('--include-catalog-index');
  const target = argv.find((a) => !a.startsWith('--') && a !== process.argv[1]);

  // Determine target type: 'scribe' or version number
  const isScribe = target === 'scribe';
  const isVersioned = !isScribe && validateVersion(target);

  if (!isScribe && !isVersioned) {
    console.error('Usage: node tools/ftp-sync.mjs <version|scribe> [--dry-run] [--json] [--no-verify] [--include-catalog-index]');
    console.error('Examples:');
    console.error('  node tools/ftp-sync.mjs 1.71                                  # sync v1.71 NASA/MUS/ELC');
    console.error('  node tools/ftp-sync.mjs scribe                                # sync SCRIBE research');
    console.error('  node tools/ftp-sync.mjs 1.71 --include-catalog-index          # include catalog indexes');
    console.error('  node tools/ftp-sync.mjs scribe --dry-run                      # preview SCRIBE upload');
    process.exit(2);
  }

  const env = loadEnv(REPO_ROOT);
  if (env.__missing) {
    console.error(`.env not found at: ${env.__missing}`);
    process.exit(2);
  }
  const v = validateEnv(env);
  if (!v.ok) {
    console.error(`.env missing required keys: ${v.missing.join(', ')}`);
    process.exit(2);
  }

  // Build manifest based on target type
  let manifest;
  let targetLabel;
  if (isScribe) {
    manifest = buildManifestScribe(REPO_ROOT);
    targetLabel = 'SCRIBE';
    if (manifest.missing) {
      console.error('SCRIBE source dir not found: www/tibsfox/com/Research/SCRIBE/');
      process.exit(3);
    }
  } else {
    manifest = buildManifest(REPO_ROOT, target, { includeCatalogIndex });
    targetLabel = `v${target}`;
    if (manifest.missingTracks.length === TRACKS.length) {
      console.error(`No source dirs for v${target}: missing ${manifest.missingTracks.join(', ')}`);
      process.exit(3);
    }
  }

  // Catalog-index precondition (added v1.49.601): when --include-catalog-index
  // is set, verify catalog indexes are in sync with on-disk degree dirs before
  // uploading. A stale catalog index uploaded to tibsfox.com would replace the
  // live catalog with a regressed version, silently hiding new degrees.
  // Exit code 5 = catalog-index drift (new for ftp-sync; distinct from the
  // pre-tag-gate exit-8 allocation which scopes differently).
  // (Not applicable for SCRIBE, which has no catalog).
  if (includeCatalogIndex && !dryRun && !isScribe) {
    const checkTool = join(REPO_ROOT, 'tools', 'update-catalog-indexes.mjs');
    if (existsSync(checkTool)) {
      if (!json) {
        console.log('[ftp-sync] precondition: checking catalog-index drift before upload...');
      }
      const result = spawnSync(process.execPath, [checkTool, '--check'], {
        encoding: 'utf8',
        stdio: 'pipe',
      });
      if (result.status !== 0) {
        console.error('[ftp-sync] ABORT: catalog-index drift detected.');
        console.error('[ftp-sync]   Uploading a stale catalog would regress the live site.');
        console.error('[ftp-sync]   Run: node tools/update-catalog-indexes.mjs --check');
        console.error('[ftp-sync]   NASA fix:  node tools/update-catalog-indexes.mjs --write');
        console.error('[ftp-sync]   MUS/ELC:   author missing degree-card divs manually');
        console.error('[ftp-sync]   Re-run ftp-sync after fixing drift.');
        if (result.stderr) console.error(result.stderr.trim());
        process.exit(5);
      }
      if (!json) {
        console.log('[ftp-sync] precondition: catalog-index PASS — proceeding with upload');
      }
    }
  }

  if (!json) {
    console.log(`FTP sync ${targetLabel} → ${env.FTP_HOST}`);
    if (isVersioned) {
      console.log(`  Tracks: ${TRACKS.filter((t) => !manifest.missingTracks.includes(t)).join(', ')}`);
      if (manifest.missingTracks.length) {
        console.log(`  Missing locally (skipped): ${manifest.missingTracks.join(', ')}`);
      }
    }
    console.log(`  Files: ${manifest.totalFiles} / Bytes: ${manifest.totalBytes}`);
    if (isVersioned && includeCatalogIndex) {
      const catalogCount = Object.values(manifest.tracks)
        .flat()
        .filter((e) => e.kind === 'catalog').length;
      console.log(`  Catalog indexes included: ${catalogCount} (--include-catalog-index)`);
    }
    console.log(`  Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`);
    console.log('');
  }

  let client;
  if (!dryRun) {
    const { Client } = await import('basic-ftp'); // lazy — see top-of-file note
    client = new Client();
    client.ftp.verbose = false;
    try {
      await client.access({
        host: env.FTP_HOST,
        user: env.FTP_USER,
        password: env.FTP_PASS,
        secure: false, // tibsfox.com FTP is plain FTP per ad-hoc script
      });
    } catch (err) {
      console.error(`FTP connect failed: ${err.message || err}`);
      client.close();
      process.exit(1);
    }
  }

  let allResults = [];
  if (isScribe) {
    // SCRIBE single-dir upload
    const results = await pushFiles(client, manifest.files, { dryRun, json });
    allResults = results;
  } else {
    // Version-based track upload
    for (const track of TRACKS) {
      const files = manifest.tracks[track] || [];
      if (files.length === 0) continue;
      const results = await pushFiles(client, files, { dryRun, json });
      allResults = allResults.concat(results);
    }
  }

  if (client) client.close();

  const failures = allResults.filter((r) => r.status === 'failed');
  const uploads = allResults.filter((r) => r.status === 'uploaded');
  const totalUploadedBytes = uploads.reduce((s, r) => s + r.size, 0);

  // Post-upload HTTPS verification probe (Lesson #10203)
  let verification = { skipped: true, probes: [], failures: 0 };
  if (!dryRun && !noVerify && uploads.length > 0) {
    const baseUrl = env.FTP_PUBLIC_BASE_URL || 'https://tibsfox.com/Research';
    const sample = pickVerificationSample(manifest);
    if (!json) {
      console.log('');
      console.log(`=== verification probe (${sample.length} HEAD requests to ${baseUrl}) ===`);
    }
    const probes = [];
    for (const f of sample) {
      const url = remotePathToUrl(f.remoteAbs, baseUrl);
      const result = await probeUrl(url);
      probes.push(result);
      if (!json) {
        const tag = result.ok ? '[verified]' : '[DRIFT]';
        console.log(`${tag} ${result.status}  ${url}`);
      }
    }
    const probeFailures = probes.filter((p) => !p.ok);
    verification = {
      skipped: false,
      sample_size: sample.length,
      probes,
      failures: probeFailures.length,
    };
    if (!json && probeFailures.length > 0) {
      console.log('');
      console.log('  DRIFT DETECTED — uploaded files not reachable via HTTPS:');
      for (const p of probeFailures) {
        console.log(`    ${p.status} ${p.url}${p.error ? ` (${p.error})` : ''}`);
      }
    }
  }

  if (json) {
    const output = {
      target: targetLabel,
      mode: dryRun ? 'dry-run' : 'execute',
      total_files: manifest.totalFiles,
      total_bytes: manifest.totalBytes,
      uploaded_files: uploads.length,
      uploaded_bytes: totalUploadedBytes,
      failures: failures.length,
      verification,
    };
    if (isVersioned) output.missing_tracks = manifest.missingTracks;
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log('');
    console.log(`=== summary ===`);
    console.log(`  Uploaded: ${uploads.length} / ${manifest.totalFiles} files`);
    console.log(`  Bytes:    ${totalUploadedBytes} / ${manifest.totalBytes}`);
    console.log(`  Failed:   ${failures.length}`);
    if (!verification.skipped) {
      console.log(`  Verified: ${verification.sample_size - verification.failures} / ${verification.sample_size} probes (${verification.failures} drift)`);
    }
    if (failures.length > 0) {
      console.log('  Failures:');
      for (const f of failures) {
        console.log(`    ${f.remoteAbs}: ${f.error}`);
      }
    }
  }

  if (failures.length > 0) process.exit(1);
  if (verification.failures > 0) process.exit(4);
  process.exit(0);
}

// Only run main() when invoked directly (not when imported by tests).
const invokedDirectly = process.argv[1] && process.argv[1].endsWith('ftp-sync.mjs');
if (invokedDirectly) {
  main().catch((err) => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
}
