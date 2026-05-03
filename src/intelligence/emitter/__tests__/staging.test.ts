/**
 * C10 / T6 + T12 — Atomic write + transaction-directory staging.
 */
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  readFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  readdirSync,
  utimesSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  atomicWriteFile,
  emitBundle,
  cleanupOrphanTransactions,
} from '../staging.js';

let tmpRoot: string;

beforeEach(() => {
  tmpRoot = mkdtempSync(join(tmpdir(), 'c10-staging-'));
});

afterEach(() => {
  try {
    rmSync(tmpRoot, { recursive: true, force: true });
  } catch {
    /* ignore */
  }
});

describe('C10 / T6 — atomic write', () => {
  it('atomicWriteFile creates the file and removes the .tmp', () => {
    const target = join(tmpRoot, 'sub', 'a.json');
    atomicWriteFile(target, '{"x":1}');
    expect(existsSync(target)).toBe(true);
    expect(existsSync(`${target}.tmp`)).toBe(false);
    expect(readFileSync(target, 'utf8')).toBe('{"x":1}');
  });

  it('atomicWriteFile is idempotent (overwrites existing target)', () => {
    const target = join(tmpRoot, 'a.json');
    atomicWriteFile(target, 'first');
    atomicWriteFile(target, 'second');
    expect(readFileSync(target, 'utf8')).toBe('second');
  });
});

describe('C10 / T6 — emitBundle (transaction directory)', () => {
  it('emit_bundle with 3 decisions → 3 .md + 3 .meta.json + manifest', () => {
    const stagingRoot = tmpRoot;
    const emissions = [
      { request_id: 'req_a', vision_doc: '# A', meta_json: '{"a":1}' },
      { request_id: 'req_b', vision_doc: '# B', meta_json: '{"b":2}' },
      { request_id: 'req_c', vision_doc: '# C', meta_json: '{"c":3}' },
    ];
    const manifest = {
      bundle_id: 'M-test01',
      yaml: 'bundle_id: M-test01\n',
    };
    const result = emitBundle(emissions, manifest, stagingRoot);

    const inbox = join(stagingRoot, 'staging', 'inbox');
    expect(existsSync(join(inbox, 'req_a.md'))).toBe(true);
    expect(existsSync(join(inbox, 'req_a.meta.json'))).toBe(true);
    expect(existsSync(join(inbox, 'req_b.md'))).toBe(true);
    expect(existsSync(join(inbox, 'req_c.md'))).toBe(true);
    expect(existsSync(join(inbox, 'bundles', 'M-test01.bundle.yaml'))).toBe(true);
    expect(result.seedPaths.length).toBe(3);
    expect(result.manifestPath).toContain('M-test01.bundle.yaml');
  });

  it('after successful bundle emission no .inbox-txn-* dir remains', () => {
    const stagingRoot = tmpRoot;
    emitBundle(
      [{ request_id: 'req_x', vision_doc: '# X', meta_json: '{}' }],
      { bundle_id: 'M-x', yaml: 'bundle_id: M-x\n' },
      stagingRoot,
    );
    const entries = readdirSync(stagingRoot).filter((e) =>
      e.startsWith('.inbox-txn-'),
    );
    expect(entries.length).toBe(0);
  });

  it('S3: kill mid-rename → no manifest written, but seeds may be partial', () => {
    const stagingRoot = tmpRoot;
    const emissions = [
      { request_id: 'req_a', vision_doc: '# A', meta_json: '{"a":1}' },
      { request_id: 'req_b', vision_doc: '# B', meta_json: '{"b":2}' },
    ];
    expect(() =>
      emitBundle(
        emissions,
        { bundle_id: 'M-fail', yaml: 'bundle_id: M-fail\n' },
        stagingRoot,
        { injectFailureAtRename: 2 }, // fail after first .md+.meta moves
      ),
    ).toThrow('synthetic rename failure');

    // Manifest must NOT be present (commit-point invariant)
    const bundleDir = join(stagingRoot, 'staging', 'inbox', 'bundles');
    if (existsSync(bundleDir)) {
      const bundles = readdirSync(bundleDir);
      expect(bundles).not.toContain('M-fail.bundle.yaml');
    }

    // Orphan txn dir is left behind.
    const orphans = readdirSync(stagingRoot).filter((e) =>
      e.startsWith('.inbox-txn-'),
    );
    expect(orphans.length).toBe(1);
  });

  it('manifest mtime is AFTER all seed mtimes (D-25-11 commit-point invariant)', async () => {
    const stagingRoot = tmpRoot;
    const emissions = [
      { request_id: 'req_a', vision_doc: '# A', meta_json: '{"a":1}' },
      { request_id: 'req_b', vision_doc: '# B', meta_json: '{"b":2}' },
    ];
    const result = emitBundle(
      emissions,
      { bundle_id: 'M-mt01', yaml: 'bundle_id: M-mt01\n' },
      stagingRoot,
    );
    const fs = await import('node:fs');
    const seedMtimes = result.seedPaths.map(
      (p) => fs.statSync(p).mtimeMs,
    );
    const manifestMtime = fs.statSync(result.manifestPath).mtimeMs;
    for (const m of seedMtimes) {
      // The manifest should be moved last; its mtime should be >= every seed's.
      expect(manifestMtime).toBeGreaterThanOrEqual(m - 5);
    }
  });
});

describe('C10 / T12 — orphan transaction cleanup', () => {
  it('cleanupOrphanTransactions removes dirs older than maxAgeMs', () => {
    const stagingRoot = tmpRoot;
    const orphan = join(stagingRoot, '.inbox-txn-old01');
    mkdirSync(orphan);
    // Backdate it 2 hours
    const past = (Date.now() - 2 * 60 * 60 * 1000) / 1000;
    utimesSync(orphan, past, past);

    const fresh = join(stagingRoot, '.inbox-txn-fresh01');
    mkdirSync(fresh);

    const removed = cleanupOrphanTransactions(stagingRoot, 60 * 60 * 1000);
    expect(removed).toBe(1);
    expect(existsSync(orphan)).toBe(false);
    expect(existsSync(fresh)).toBe(true);
  });

  it('does nothing on missing staging root', () => {
    const removed = cleanupOrphanTransactions(
      join(tmpRoot, 'nonexistent'),
      1000,
    );
    expect(removed).toBe(0);
  });

  it('ignores non-txn directories', () => {
    const stagingRoot = tmpRoot;
    mkdirSync(join(stagingRoot, 'staging'));
    mkdirSync(join(stagingRoot, 'somedir'));
    const removed = cleanupOrphanTransactions(stagingRoot, 0);
    expect(removed).toBe(0);
    expect(existsSync(join(stagingRoot, 'staging'))).toBe(true);
    expect(existsSync(join(stagingRoot, 'somedir'))).toBe(true);
  });
});
