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
 *   node tools/ftp-sync.mjs <version>             # push + verify
 *   node tools/ftp-sync.mjs <version> --dry-run   # list files, no upload
 *   node tools/ftp-sync.mjs <version> --json      # machine-readable summary
 *   node tools/ftp-sync.mjs <version> --no-verify # skip post-upload HTTPS probe
 *
 *   npm run ftp-sync -- 1.71
 *   npm run ftp-sync:dry-run -- 1.71
 *
 * Exit codes:
 *   0  all files PUT + verified successfully (or dry-run completed)
 *   1  one or more PUT failures OR verification failures
 *   2  invalid arguments OR .env missing required keys
 *   3  local source dir(s) missing for the requested version
 *   4  PUT succeeded but verification probe found 404s (drift detection)
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
import { Client } from 'basic-ftp';

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
 * Build the upload manifest for a given version.
 *
 * Returns: { tracks: { NASA: [{rel,size}...], MUS: [...], ELC: [...] },
 *            totalFiles, totalBytes, missingTracks }
 */
export function buildManifest(repoRoot, version) {
  const manifest = { tracks: {}, totalFiles: 0, totalBytes: 0, missingTracks: [] };
  for (const track of TRACKS) {
    const dir = join(repoRoot, 'www', 'tibsfox', 'com', 'Research', track, version);
    if (!existsSync(dir)) {
      manifest.missingTracks.push(track);
      manifest.tracks[track] = [];
      continue;
    }
    const files = walkDir(dir);
    manifest.tracks[track] = files.map((f) => ({
      rel: f.rel,
      size: f.size,
      localAbs: join(dir, f.rel),
      remoteAbs: `/${track}/${version}/${f.rel}`,
    }));
    manifest.totalFiles += files.length;
    manifest.totalBytes += files.reduce((sum, f) => sum + f.size, 0);
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
 * Default sample: index.html for each present track + 2 random files (one from
 * NASA artifacts/ if present + one random from any track). Up to 5 probes.
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

async function pushTrack(client, trackName, files, opts) {
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
  const version = argv.find((a) => !a.startsWith('--') && a !== process.argv[1]);

  if (!validateVersion(version)) {
    console.error('Usage: node tools/ftp-sync.mjs <version> [--dry-run] [--json]');
    console.error('Example: node tools/ftp-sync.mjs 1.71');
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

  const manifest = buildManifest(REPO_ROOT, version);
  if (manifest.missingTracks.length === TRACKS.length) {
    console.error(`No source dirs for v${version}: missing ${manifest.missingTracks.join(', ')}`);
    process.exit(3);
  }

  if (!json) {
    console.log(`FTP sync v${version} → ${env.FTP_HOST}`);
    console.log(`  Tracks: ${TRACKS.filter((t) => !manifest.missingTracks.includes(t)).join(', ')}`);
    if (manifest.missingTracks.length) {
      console.log(`  Missing locally (skipped): ${manifest.missingTracks.join(', ')}`);
    }
    console.log(`  Files: ${manifest.totalFiles} / Bytes: ${manifest.totalBytes}`);
    console.log(`  Mode: ${dryRun ? 'DRY-RUN' : 'EXECUTE'}`);
    console.log('');
  }

  let client;
  if (!dryRun) {
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
  for (const track of TRACKS) {
    const files = manifest.tracks[track] || [];
    if (files.length === 0) continue;
    const results = await pushTrack(client, track, files, { dryRun, json });
    allResults = allResults.concat(results);
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
      console.log('  ⚠ DRIFT DETECTED — uploaded files not reachable via HTTPS:');
      for (const p of probeFailures) {
        console.log(`    ${p.status} ${p.url}${p.error ? ` (${p.error})` : ''}`);
      }
    }
  }

  if (json) {
    console.log(JSON.stringify({
      version,
      mode: dryRun ? 'dry-run' : 'execute',
      total_files: manifest.totalFiles,
      total_bytes: manifest.totalBytes,
      uploaded_files: uploads.length,
      uploaded_bytes: totalUploadedBytes,
      failures: failures.length,
      missing_tracks: manifest.missingTracks,
      verification,
    }, null, 2));
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
