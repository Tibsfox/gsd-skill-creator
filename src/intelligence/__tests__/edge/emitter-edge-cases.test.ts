/**
 * Phase 826 / C13 — E9–E14: Emitter edge cases
 *
 * Edge cases: empty bundle, interrupted emit, manifest with 100 decisions,
 * request-id uniqueness, atomicWriteFile overwrites existing, staging
 * root auto-creation.
 *
 * Phase 826 / D-26-11 .. D-26-16.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const createTmp = () => {
  const d = mkdtempSync(join(tmpdir(), 'gsd-edge-'));
  return { dir: d, cleanup: () => rmSync(d, { recursive: true, force: true }) };
};

// ─── E9: atomicWriteFile overwrites an existing file ─────────────────────────

describe('E9: atomicWriteFile overwrites existing', () => {
  it('atomicWriteFile replaces existing file atomically', async () => {
    const tmp = createTmp();
    try {
      const { atomicWriteFile } = await import('../../emitter/staging.js');
      const target = join(tmp.dir, 'vision.md');

      atomicWriteFile(target, '# First version\n');
      expect(readFileSync(target, 'utf8')).toBe('# First version\n');

      atomicWriteFile(target, '# Second version\n');
      expect(readFileSync(target, 'utf8')).toBe('# Second version\n');

      // No .tmp file left behind after overwrite
      expect(existsSync(target + '.tmp')).toBe(false);
    } finally {
      tmp.cleanup();
    }
  });
});

// ─── E10: emitBundle creates staging dirs automatically ──────────────────────

describe('E10: staging dir auto-creation', () => {
  it('emitBundle creates staging/inbox/ if it does not exist', async () => {
    const tmp = createTmp();
    try {
      const { emitBundle } = await import('../../emitter/staging.js');
      const stagingRoot = join(tmp.dir, 'nonexistent-root');
      // Do NOT pre-create the dir

      const result = emitBundle(
        [{ request_id: 'req_2026-05-02_0001_aaaa', vision_doc: '# Vision', meta_json: '{}' }],
        { bundle_id: 'M-20260502-e10', yaml: 'bundle_id: M-20260502-e10\n' },
        stagingRoot,
      );
      expect(existsSync(result.manifestPath)).toBe(true);
      expect(existsSync(result.seedPaths[0]!)).toBe(true);
    } finally {
      tmp.cleanup();
    }
  });
});

// ─── E11: cleanupOrphanTransactions — no dirs, no crash ──────────────────────

describe('E11: cleanupOrphanTransactions on empty root', () => {
  it('returns 0 when no .inbox-txn-* dirs exist', async () => {
    const tmp = createTmp();
    try {
      const { cleanupOrphanTransactions } = await import('../../emitter/staging.js');
      const removed = cleanupOrphanTransactions(tmp.dir, 60 * 60 * 1000);
      expect(removed).toBe(0);
    } finally {
      tmp.cleanup();
    }
  });

  it('returns 0 when staging root does not exist', async () => {
    const { cleanupOrphanTransactions } = await import('../../emitter/staging.js');
    const removed = cleanupOrphanTransactions('/nonexistent/path/gsd-staging', 60 * 60 * 1000);
    expect(removed).toBe(0);
  });
});

// ─── E12: emitBundle with many decisions ─────────────────────────────────────

describe('E12: large bundle (50 seeds)', () => {
  it('emitBundle with 50 seeds completes without error', async () => {
    const tmp = createTmp();
    try {
      const { emitBundle } = await import('../../emitter/staging.js');
      const emissions = Array.from({ length: 50 }, (_, i) => ({
        request_id: `req_2026-05-02_0000_${i.toString().padStart(4, '0')}`,
        vision_doc: `# Vision ${i}\nContent here.`,
        meta_json: `{"i":${i}}`,
      }));

      const result = emitBundle(
        emissions,
        { bundle_id: 'M-20260502-large', yaml: 'bundle_id: M-20260502-large\n' },
        join(tmp.dir, 'large-bundle'),
      );

      expect(result.seedPaths).toHaveLength(50);
      expect(existsSync(result.manifestPath)).toBe(true);
      for (const p of result.seedPaths) {
        expect(existsSync(p)).toBe(true);
      }
    } finally {
      tmp.cleanup();
    }
  });
});

// ─── E13: request-id uniqueness ──────────────────────────────────────────────

describe('E13: request-id uniqueness', () => {
  it('generateRequestId produces unique IDs on rapid successive calls', async () => {
    const { generateRequestId } = await import('../../emitter/request-id.js');
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(generateRequestId());
    }
    expect(ids.size).toBe(100);
  });

  it('generateRequestId matches req_YYYY-MM-DD_HHMM_XXX pattern', async () => {
    const { generateRequestId } = await import('../../emitter/request-id.js');
    const id = generateRequestId();
    // Format: req_YYYY-MM-DD_HHMM_randomsuffix
    expect(id).toMatch(/^req_[\d-]+_\d{4}_[a-z0-9]+$/);
  });
});

// ─── E14: emitBundle failure mid-rename leaves no committed state ─────────────

describe('E14: emitBundle crash-safety', () => {
  it('injectFailureAtRename=0 throws and leaves no committed files in inbox', async () => {
    const tmp = createTmp();
    try {
      const { emitBundle } = await import('../../emitter/staging.js');
      const stagingRoot = join(tmp.dir, 'crash-test');

      expect(() => emitBundle(
        [{ request_id: 'req_2026-05-02_0002_aaaa', vision_doc: '# Vision', meta_json: '{}' }],
        { bundle_id: 'M-20260502-crash', yaml: 'bundle_id: M-20260502-crash\n' },
        stagingRoot,
        { injectFailureAtRename: 0 },
      )).toThrow('synthetic rename failure');

      // Manifest should NOT be present (transaction wasn't committed)
      const bundlesDir = join(stagingRoot, 'staging', 'inbox', 'bundles');
      if (existsSync(bundlesDir)) {
        const manifests = require('node:fs').readdirSync(bundlesDir).filter((f: string) => f.endsWith('.yaml'));
        expect(manifests).toHaveLength(0);
      }
    } finally {
      tmp.cleanup();
    }
  });
});
