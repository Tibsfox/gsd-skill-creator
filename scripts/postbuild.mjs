#!/usr/bin/env node
// scripts/postbuild.mjs — copy non-TS assets into dist/ after tsc.
//
// tsc only emits .js/.d.ts from .ts sources, so any .md/.json/.txt asset
// imported at runtime via fs.readFile needs to be mirrored into dist/ by hand.
// Add new (src, dest) pairs below as new asset types appear.

import { cp, mkdir, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const assetDirs = [
  // src/critique/prompts/*.md → dist/critique/prompts/*.md
  { src: 'src/critique/prompts', dest: 'dist/critique/prompts', ext: '.md' },
  // src/cartridge/templates/*.tmpl → dist/cartridge/templates/*.tmpl
  // Cartridge scaffold reads its templates off disk via fileURLToPath
  // (see scaffold.ts#HERE / TEMPLATES_ROOT). dist builds need the same
  // templates next to dist/cartridge/scaffold.js or `skill-creator
  // cartridge scaffold` throws ENOENT at runtime.
  { src: 'src/cartridge/templates', dest: 'dist/cartridge/templates', ext: '.tmpl' },
  // Phase 825 / C10: vision-doc.md.tmpl read at MissionEmitter construction time.
  {
    src: 'src/intelligence/emitter/templates',
    dest: 'dist/intelligence/emitter/templates',
    ext: '.tmpl',
  },
  // Phase 825 / C11: meeting-record.md.tmpl read at MeetingRecordGenerator
  // construction time.
  {
    src: 'src/intelligence/meetings/templates',
    dest: 'dist/intelligence/meetings/templates',
    ext: '.tmpl',
  },
  // Phase 825 / C10: vision-seed-meta + bundle-manifest schemas read at
  // ajv compile time by meta-validator.ts.
  {
    src: 'src/intelligence/schemas',
    dest: 'dist/intelligence/schemas',
    ext: '.json',
  },
  // W4c: KBStore.applyMigrations reads SQL migration files off disk at
  // runtime via the default migrationsDir resolution
  // (`<store.js dir>/../db/migrations`). dist builds (used by the dashboard
  // server's atlas indexer endpoint) need these alongside the compiled JS,
  // otherwise project DBs are created without tables and indexer runs fail
  // with "no such table: projects".
  {
    src: 'src/intelligence/db/migrations',
    dest: 'dist/intelligence/db/migrations',
    ext: '.sql',
  },
];

let copied = 0;
let skipped = 0;

for (const { src, dest, ext } of assetDirs) {
  const srcAbs = join(repoRoot, src);
  const destAbs = join(repoRoot, dest);

  if (!existsSync(srcAbs)) {
    skipped++;
    continue;
  }

  await mkdir(destAbs, { recursive: true });

  const entries = await readdir(srcAbs, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (ext && !entry.name.endsWith(ext)) continue;
    const from = join(srcAbs, entry.name);
    const to = join(destAbs, entry.name);
    await cp(from, to);
    copied++;
    console.log(`  copied ${relative(repoRoot, from)} → ${relative(repoRoot, to)}`);
  }
}

console.log(`postbuild: ${copied} asset(s) copied, ${skipped} source dir(s) skipped`);
