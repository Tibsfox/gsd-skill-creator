#!/usr/bin/env node
// Single source of truth for cross-manifest version bumps.
//
// Keeps these four in lockstep:
//   - package.json
//   - package-lock.json (root + packages[""])
//   - src-tauri/Cargo.toml
//   - src-tauri/tauri.conf.json
//
// Usage:
//   node scripts/bump-version.mjs 1.49.561      # explicit target
//   node scripts/bump-version.mjs --from-npm    # read target from package.json (for `npm version` lifecycle)
//   node scripts/bump-version.mjs --check       # verify all manifests agree, exit 1 on drift

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// ROOT defaults to the script's parent dir (real repo root); --root <path>
// override allows tests + tooling to point the script at a temporary
// manifests dir without touching the real four-manifest set.
//
// v1.49.589 T2.2 (closes Lesson #10187 candidate): added --root override
// to support hermetic atomic-bump invariant tests at scripts/__tests__/.
function resolveRoot(argv) {
  const rootIdx = argv.indexOf('--root');
  if (rootIdx >= 0 && argv[rootIdx + 1]) {
    return argv[rootIdx + 1];
  }
  return join(dirname(fileURLToPath(import.meta.url)), '..');
}

const ROOT = resolveRoot(process.argv);

const MANIFESTS = {
  pkg: join(ROOT, 'package.json'),
  lock: join(ROOT, 'package-lock.json'),
  cargo: join(ROOT, 'src-tauri', 'Cargo.toml'),
  tauri: join(ROOT, 'src-tauri', 'tauri.conf.json'),
};

const SEMVER_RE = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.-]+)?$/;

function readPkgVersion() {
  return JSON.parse(readFileSync(MANIFESTS.pkg, 'utf8')).version;
}

function readAllVersions() {
  const versions = [];
  if (existsSync(MANIFESTS.pkg)) {
    versions.push(['package.json', JSON.parse(readFileSync(MANIFESTS.pkg, 'utf8')).version]);
  }
  if (existsSync(MANIFESTS.lock)) {
    const lock = JSON.parse(readFileSync(MANIFESTS.lock, 'utf8'));
    versions.push(['package-lock.json (root)', lock.version]);
    if (lock.packages?.['']?.version) {
      versions.push(['package-lock.json (packages[""])', lock.packages[''].version]);
    }
  }
  if (existsSync(MANIFESTS.cargo)) {
    const m = readFileSync(MANIFESTS.cargo, 'utf8').match(/^version\s*=\s*"([^"]+)"/m);
    if (m) versions.push(['src-tauri/Cargo.toml', m[1]]);
  }
  if (existsSync(MANIFESTS.tauri)) {
    const conf = JSON.parse(readFileSync(MANIFESTS.tauri, 'utf8'));
    if (conf.version) versions.push(['src-tauri/tauri.conf.json', conf.version]);
  }
  return versions;
}

function bumpJsonVersion(path, next) {
  const obj = JSON.parse(readFileSync(path, 'utf8'));
  obj.version = next;
  writeFileSync(path, JSON.stringify(obj, null, 2) + '\n');
}

function bumpLockfile(path, next) {
  const lock = JSON.parse(readFileSync(path, 'utf8'));
  lock.version = next;
  if (lock.packages?.['']) lock.packages[''].version = next;
  writeFileSync(path, JSON.stringify(lock, null, 2) + '\n');
}

function bumpCargo(path, next) {
  const src = readFileSync(path, 'utf8');
  const out = src.replace(/^(version\s*=\s*")[^"]+(")/m, `$1${next}$2`);
  if (out === src) throw new Error(`Cargo.toml: no version line replaced`);
  writeFileSync(path, out);
}

function check() {
  const versions = readAllVersions();
  const uniq = new Set(versions.map(([, v]) => v));
  if (uniq.size === 1) {
    console.log(`OK: all manifests at ${[...uniq][0]}`);
    for (const [src, v] of versions) console.log(`  ${src} = ${v}`);
    return 0;
  }
  console.error('DRIFT:');
  for (const [src, v] of versions) console.error(`  ${src} = ${v}`);
  return 1;
}

function bump(next) {
  if (!SEMVER_RE.test(next)) {
    console.error(`Invalid version: ${next}`);
    process.exit(2);
  }
  if (existsSync(MANIFESTS.pkg)) bumpJsonVersion(MANIFESTS.pkg, next);
  if (existsSync(MANIFESTS.lock)) bumpLockfile(MANIFESTS.lock, next);
  if (existsSync(MANIFESTS.cargo)) bumpCargo(MANIFESTS.cargo, next);
  if (existsSync(MANIFESTS.tauri)) bumpJsonVersion(MANIFESTS.tauri, next);
  const code = check();
  if (code !== 0) {
    console.error('Post-bump drift — refusing to succeed.');
    process.exit(code);
  }
  console.log(`Bumped all manifests to ${next}.`);
}

// Strip --root <path> from argv positional parsing; remaining first arg is action
const filtered = process.argv.slice(2).filter((a, i, arr) => a !== '--root' && arr[i - 1] !== '--root');
const arg = filtered[0];
if (!arg || arg === '-h' || arg === '--help') {
  console.log('Usage:\n  bump-version.mjs <x.y.z> [--root <path>]\n  bump-version.mjs --from-npm [--root <path>]\n  bump-version.mjs --check [--root <path>]');
  process.exit(arg ? 0 : 1);
}
if (arg === '--check') process.exit(check());
if (arg === '--from-npm') bump(readPkgVersion());
else bump(arg);
