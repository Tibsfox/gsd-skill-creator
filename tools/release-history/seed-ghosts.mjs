#!/usr/bin/env node
// Seed known ghost releases — indexed in RELEASE-HISTORY.md but with no README
// directory on disk. Chapter generator expects a release row per version; this
// gives it one so ghost chapters render as stubs.
//
// Ghost list comes from release-history.local.json → `ghosts: [...]`.
// If the list is empty, this is a no-op (expected for generic installs).

import { loadConfig } from './config.mjs';
import { openDb } from './db.mjs';

// Parse "v1.49.20.1" → { major: 1, minor: 49, patch: 20, prerelease: '1' }
function parseVersion(v) {
  const m = /^v(\d+)\.(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-(.+))?$/.exec(v);
  if (!m) throw new Error(`bad version: ${v}`);
  return {
    major: parseInt(m[1], 10),
    minor: parseInt(m[2], 10),
    patch: m[3] ? parseInt(m[3], 10) : 0,
    prerelease: m[4] || m[5] || null,
  };
}

async function main() {
  const cfg = loadConfig();
  const ghosts = cfg.ghosts || [];
  if (ghosts.length === 0) {
    console.error('[seed-ghosts] no ghosts configured — nothing to do');
    console.log(JSON.stringify({ seeded: 0 }));
    return;
  }

  const db = await openDb(cfg);
  for (const g of ghosts) {
    const v = parseVersion(g.version);
    await db.query(
      `INSERT INTO release_history.release
         (version, semver_major, semver_minor, semver_patch, semver_prerelease,
          name, shipped_at, phases, plans, source_readme,
          parse_confidence, has_retrospective, retrospective_status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0.30, false, $11)
       ON CONFLICT (version) DO UPDATE SET
         name = EXCLUDED.name,
         shipped_at = EXCLUDED.shipped_at,
         phases = EXCLUDED.phases,
         plans = EXCLUDED.plans,
         source_readme = EXCLUDED.source_readme,
         retrospective_status = EXCLUDED.retrospective_status`,
      [g.version, v.major, v.minor, v.patch, v.prerelease,
       g.name, g.shipped_at, g.phases ?? null, g.plans ?? null,
       g.source_readme || '(never existed)', g.retrospective_status || 'missing']
    );
    console.error(`[seed-ghosts] upserted ${g.version}`);
  }
  await db.close();
  console.log(JSON.stringify({ seeded: ghosts.length }));
}
main().catch(e => { console.error('fatal:', e.message); process.exit(1); });
