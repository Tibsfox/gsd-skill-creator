#!/usr/bin/env node
/**
 * nasa-forest-manifest-regen.mjs — regenerate the forest-module manifest from
 * disk (canonical §14.0: a module not in the manifest does not load).
 *
 * Scans www/tibsfox/com/Research/NASA/1.N/forest-module/*.js and rewrites
 * _harness/v1.0.0/forest-module-manifest.json with every module found,
 * ordered by mission number then filename.
 *
 * Usage: node tools/nasa-forest-manifest-regen.mjs [--dry-run]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NASA = path.join(ROOT, 'www/tibsfox/com/Research/NASA');
const MANIFEST = path.join(NASA, '_harness/v1.0.0/forest-module-manifest.json');
const DRY = process.argv.includes('--dry-run');

const missions = fs.readdirSync(NASA)
  .filter((d) => /^1\.\d+$/.test(d))
  .sort((a, b) => Number(a.slice(2)) - Number(b.slice(2)));

const modules = [];
for (const m of missions) {
  const fm = path.join(NASA, m, 'forest-module');
  if (!fs.existsSync(fm)) continue;
  for (const f of fs.readdirSync(fm).sort()) {
    if (f.endsWith('.js') && !/\.bak\d*$/.test(f)) modules.push(`../../${m}/forest-module/${f}`);
  }
}

const prev = fs.existsSync(MANIFEST) ? JSON.parse(fs.readFileSync(MANIFEST, 'utf8')) : {};
const next = {
  harnessVersion: prev.harnessVersion || '1.0.0',
  generated: new Date().toISOString().slice(0, 10),
  modules,
};

console.log(`modules on disk: ${modules.length} (manifest previously: ${(prev.modules || []).length})`);
if (DRY) {
  console.log('[dry-run] not writing');
} else {
  fs.writeFileSync(MANIFEST, JSON.stringify(next, null, 1) + '\n');
  console.log(`wrote ${MANIFEST}`);
}
