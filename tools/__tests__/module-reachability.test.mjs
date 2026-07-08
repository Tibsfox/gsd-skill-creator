// Ledger drift-guard for the module-reachability orphan ratchet.
// Mirrors the loader-context-audit discipline: NEW orphans fail, and the
// allowlist can only shrink (a stale entry that became reachable or vanished
// from the universe fails, forcing it out). Runs under vitest.tools.config.mjs.
import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const TOOL = join(REPO, 'tools', 'module-reachability.mjs');
const SRC = join(REPO, 'src');
const SRC_ALLOWLIST = join(REPO, 'tools', 'module-reachability.allowlist.json');
const TAURI_ALLOWLIST = join(REPO, 'tools', 'tauri-command-reachability.allowlist.json');

function runJson() {
  const out = execFileSync('node', [TOOL, '--json'], { cwd: REPO, encoding: 'utf8' });
  return JSON.parse(out);
}

describe('module-reachability — src/ orphan ratchet', () => {
  const report = runJson();

  it('reports no NEW orphan dirs against the allowlist', () => {
    expect(report.ledger.src.newOrphans).toEqual([]);
  });

  it('has no stale allowlist entries — every grandfathered orphan is still a real, still-unreachable dir', () => {
    // staleReachable = allowlisted but now reachable (chip it out);
    // staleMissing = allowlisted but no longer a top-level src/ dir (remove it).
    expect(report.ledger.src.staleReachable).toEqual([]);
    expect(report.ledger.src.staleMissing).toEqual([]);
  });

  it('every allowlist entry is a real top-level src/ directory', () => {
    const allow = JSON.parse(readFileSync(SRC_ALLOWLIST, 'utf8')).orphans;
    for (const dir of allow) {
      expect(existsSync(join(SRC, dir)), `allowlisted orphan '${dir}' no longer exists`).toBe(true);
    }
  });

  it('reached-dir count stays above a sanity floor (resolver did not silently break)', () => {
    // 87 reached today; a resolver regression (e.g. losing dynamic-import edges)
    // would collapse this well below 80.
    expect(report.src.reached.length).toBeGreaterThan(80);
  });

  it('accounts for every top-level src/ dir as either reached or orphan', () => {
    const dirs = readdirSync(SRC, { withFileTypes: true })
      .filter((d) => d.isDirectory() && d.name !== '__tests__').length;
    expect(report.src.reached.length + report.src.orphans.length).toBe(dirs);
  });
});

describe('module-reachability — Tauri command ratchet', () => {
  const report = runJson();

  it('reports no NEW orphan commands and no stale allowlist entries', () => {
    expect(report.ledger.tauri.newOrphans).toEqual([]);
    expect(report.ledger.tauri.staleReachable).toEqual([]);
    expect(report.ledger.tauri.staleMissing).toEqual([]);
  });

  it('the Tauri allowlist file parses and is a subset of registered commands', () => {
    expect(existsSync(TAURI_ALLOWLIST)).toBe(true);
    const allow = JSON.parse(readFileSync(TAURI_ALLOWLIST, 'utf8')).orphans;
    expect(Array.isArray(allow)).toBe(true);
    // Every allowlisted orphan must currently be an orphan (registered, uninvoked).
    for (const cmd of allow) {
      expect(report.tauri.orphans.includes(cmd), `allowlisted command '${cmd}' is no longer an orphan`).toBe(true);
    }
  });
});

describe('module-reachability — gate contract', () => {
  it('--check exits 0 on the seeded repo', () => {
    // execFileSync throws on non-zero exit; reaching the assertion means exit 0.
    execFileSync('node', [TOOL, '--check'], { cwd: REPO, encoding: 'utf8' });
    expect(true).toBe(true);
  });

  it('overall ok flag is true', () => {
    expect(runJson().ok).toBe(true);
  });
});
