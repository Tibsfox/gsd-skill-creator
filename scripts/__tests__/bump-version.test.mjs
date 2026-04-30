/**
 * T2.2 (v1.49.589) — bump-version atomic 4-manifest invariant tests
 *
 * Closes Lesson #10187 candidate from v1.49.588 §5: bumping the dev-line
 * milestone version requires ALL FOUR manifests to move together
 * (package.json, src-tauri/tauri.conf.json, src-tauri/Cargo.toml,
 * package-lock.json). v1.49.588 ship pipeline manually bumped 2 of 4 and
 * CI harness-integrity caught the drift in run 25148062618; commit
 * d30668660 was the correction-after-detection. This test fixes the
 * direction of detection: from CI-after-the-fact to local-pre-tag.
 *
 * Tests run in temp dir, never touch the real manifests.
 *
 * NOTE: this test file lives at scripts/__tests__/ which is OUTSIDE the
 * vitest include glob (vitest.config.ts scopes to src/, .college/, tests/,
 * www/...). It is forward-ready: a future milestone widening vitest scope
 * to scripts/** activates it automatically. For v1.49.589, run via
 * `npx vitest run --config <one-off>` or invoke the asserted invariants
 * directly via node.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { execSync } from 'node:child_process';

let tmpRoot;
const ORIG_CWD = process.cwd();

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'bump-version-test-'));
  mkdirSync(join(tmpRoot, 'src-tauri'), { recursive: true });
});

afterEach(() => {
  process.chdir(ORIG_CWD);
  try { rmSync(tmpRoot, { recursive: true, force: true }); } catch {}
});

function writeManifests(version, lockVersion = version, cargoVersion = version, tauriVersion = version) {
  writeFileSync(join(tmpRoot, 'package.json'), JSON.stringify({
    name: 'test-pkg',
    version,
  }, null, 2) + '\n');
  writeFileSync(join(tmpRoot, 'package-lock.json'), JSON.stringify({
    name: 'test-pkg',
    version: lockVersion,
    lockfileVersion: 3,
    packages: {
      '': { name: 'test-pkg', version: lockVersion },
    },
  }, null, 2) + '\n');
  writeFileSync(join(tmpRoot, 'src-tauri', 'Cargo.toml'),
    `[package]\nname = "test"\nversion = "${cargoVersion}"\n`);
  writeFileSync(join(tmpRoot, 'src-tauri', 'tauri.conf.json'), JSON.stringify({
    $schema: 'https://schema.tauri.app/config/2',
    productName: 'test',
    version: tauriVersion,
  }, null, 2) + '\n');
}

function runBumpCheck() {
  const scriptPath = join(ORIG_CWD, 'scripts', 'bump-version.mjs');
  try {
    const stdout = execSync(`node ${scriptPath} --check --root ${tmpRoot}`, {
      cwd: tmpRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status || 1, stdout: e.stdout?.toString() || '', stderr: e.stderr?.toString() || '' };
  }
}

function runBump(target) {
  const scriptPath = join(ORIG_CWD, 'scripts', 'bump-version.mjs');
  try {
    const stdout = execSync(`node ${scriptPath} ${target} --root ${tmpRoot}`, {
      cwd: tmpRoot,
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    return { code: 0, stdout, stderr: '' };
  } catch (e) {
    return { code: e.status || 1, stdout: e.stdout?.toString() || '', stderr: e.stderr?.toString() || '' };
  }
}

function readVersions() {
  return {
    pkg: JSON.parse(readFileSync(join(tmpRoot, 'package.json'), 'utf8')).version,
    lockRoot: JSON.parse(readFileSync(join(tmpRoot, 'package-lock.json'), 'utf8')).version,
    lockPkgs: JSON.parse(readFileSync(join(tmpRoot, 'package-lock.json'), 'utf8')).packages[''].version,
    cargo: readFileSync(join(tmpRoot, 'src-tauri', 'Cargo.toml'), 'utf8').match(/^version\s*=\s*"([^"]+)"/m)?.[1],
    tauri: JSON.parse(readFileSync(join(tmpRoot, 'src-tauri', 'tauri.conf.json'), 'utf8')).version,
  };
}

describe('T2.2 (v1.49.589): bump-version 4-manifest atomic invariant', () => {
  it('--check passes when all 5 version slots agree', () => {
    writeManifests('1.49.500');
    const r = runBumpCheck();
    expect(r.code).toBe(0);
    expect(r.stdout).toMatch(/OK: all manifests at 1\.49\.500/);
  });

  it('--check FAILS when package.json differs from Cargo.toml', () => {
    writeManifests('1.49.500');
    // Simulate the v1.49.588 divergence: pkg + lock bumped, Cargo + tauri NOT
    writeFileSync(join(tmpRoot, 'package.json'), JSON.stringify({
      name: 'test-pkg', version: '1.49.501',
    }, null, 2) + '\n');
    const r = runBumpCheck();
    expect(r.code).toBe(1);
    expect(r.stderr).toMatch(/DRIFT/);
  });

  it('--check FAILS when Cargo.toml differs from package.json', () => {
    writeManifests('1.49.500');
    writeFileSync(join(tmpRoot, 'src-tauri', 'Cargo.toml'),
      `[package]\nname = "test"\nversion = "1.49.499"\n`);
    const r = runBumpCheck();
    expect(r.code).toBe(1);
  });

  it('--check FAILS when package-lock.json packages[""] drifts independently', () => {
    writeManifests('1.49.500');
    const lock = JSON.parse(readFileSync(join(tmpRoot, 'package-lock.json'), 'utf8'));
    lock.packages[''].version = '1.49.499';
    writeFileSync(join(tmpRoot, 'package-lock.json'), JSON.stringify(lock, null, 2) + '\n');
    const r = runBumpCheck();
    expect(r.code).toBe(1);
  });

  it('explicit bump x.y.z updates ALL 4 manifests + 5 version slots atomically', () => {
    writeManifests('1.49.500');
    const r = runBump('1.49.589');
    expect(r.code).toBe(0);
    const v = readVersions();
    expect(v.pkg).toBe('1.49.589');
    expect(v.lockRoot).toBe('1.49.589');
    expect(v.lockPkgs).toBe('1.49.589');
    expect(v.cargo).toBe('1.49.589');
    expect(v.tauri).toBe('1.49.589');
  });

  it('bump REJECTS invalid semver (exits 2)', () => {
    writeManifests('1.49.500');
    const r = runBump('not-a-version');
    expect(r.code).toBe(2);
    // Versions unchanged
    const v = readVersions();
    expect(v.pkg).toBe('1.49.500');
  });

  it('bump from drifted state RESTORES alignment to target', () => {
    // v1.49.588 scenario: pkg+lock at .588, Cargo+tauri stuck at .587
    writeManifests('1.49.588', '1.49.588', '1.49.587', '1.49.587');
    let r = runBumpCheck();
    expect(r.code).toBe(1); // Confirm drift detected pre-bump
    r = runBump('1.49.588');
    expect(r.code).toBe(0); // Bump to common version recovers
    const v = readVersions();
    expect(v.cargo).toBe('1.49.588');
    expect(v.tauri).toBe('1.49.588');
  });
});
