#!/usr/bin/env node
// Build forest-module-manifest.json by scanning the NASA mission tree.
//
// Reads:  www/tibsfox/com/Research/NASA/1.{V}/forest-module/*.js
// Writes: www/tibsfox/com/Research/NASA/_harness/v1.0.0/forest-module-manifest.json
//
// Skips any directory whose only entry is NOT_APPLICABLE.md. Modules that
// ship alongside a NOT_APPLICABLE marker (legacy state) are still included.
//
// The manifest contains relative URLs resolved from the manifest file's own
// location, e.g. "../../1.62/forest-module/surveyor5-alpha-scattering-triad.js".

import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('.', import.meta.url));
const repoRoot = join(here, '..', '..');
const nasaRoot = join(repoRoot, 'www/tibsfox/com/Research/NASA');
const harnessDir = join(nasaRoot, '_harness/v1.0.0');
const manifestPath = join(harnessDir, 'forest-module-manifest.json');

function semverKey(v) {
  // '1.62' -> [1, 62]; sorts numerically not lexicographically
  return v.split('.').map((p) => parseInt(p, 10) || 0);
}

function compareVersion(a, b) {
  const ak = semverKey(a);
  const bk = semverKey(b);
  for (let i = 0; i < Math.max(ak.length, bk.length); i++) {
    const d = (ak[i] || 0) - (bk[i] || 0);
    if (d !== 0) return d;
  }
  return 0;
}

const entries = [];
for (const child of readdirSync(nasaRoot)) {
  if (!child.startsWith('1.')) continue;
  const fmDir = join(nasaRoot, child, 'forest-module');
  let stat;
  try { stat = statSync(fmDir); } catch { continue; }
  if (!stat.isDirectory()) continue;
  const jsFiles = readdirSync(fmDir).filter((f) => f.endsWith('.js'));
  for (const f of jsFiles) {
    entries.push({
      missionVersion: child.replace(/^1\./, '1.'),
      version: child,
      url: relative(harnessDir, join(fmDir, f)).replaceAll('\\', '/'),
    });
  }
}

entries.sort((a, b) => compareVersion(a.version, b.version) || a.url.localeCompare(b.url));

const manifest = {
  harnessVersion: '1.0.0',
  generated: new Date().toISOString().slice(0, 10),
  modules: entries.map((e) => e.url),
};

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
console.log(`wrote ${manifestPath}`);
console.log(`  modules: ${entries.length}`);
console.log(`  first:   ${entries[0]?.url ?? '(none)'}`);
console.log(`  last:    ${entries[entries.length - 1]?.url ?? '(none)'}`);
