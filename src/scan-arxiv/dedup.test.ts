// === Dedup state tests ===
//
// Covers: atomic-write crash safety, round-trip persistence,
// isSeen/recordSeen semantics.

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import {
  loadSeenIds,
  recordSeen,
  isSeen,
  saveSeenIds,
  emptyState,
  type SeenIdsState,
} from './dedup.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function tmpDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'dedup-test-'));
}

// ── tests ─────────────────────────────────────────────────────────────────────

describe('dedup', () => {
  let dir: string;
  let seenPath: string;

  beforeEach(() => {
    dir = tmpDir();
    seenPath = path.join(dir, 'seen-ids.json');
  });

  afterEach(() => {
    fs.rmSync(dir, { recursive: true, force: true });
  });

  it('loadSeenIds returns empty state when file does not exist', () => {
    const state = loadSeenIds(seenPath);
    expect(state.version).toBe(1);
    expect(Object.keys(state.ids)).toHaveLength(0);
  });

  it('round-trip: recordSeen → saveSeenIds → loadSeenIds returns same state', () => {
    let state = emptyState();
    state = recordSeen(state, '2605.10001', '/reports/r1.md');
    state = recordSeen(state, '2605.10002', '/reports/r2.md');
    saveSeenIds(state, seenPath);

    const loaded = loadSeenIds(seenPath);
    expect(loaded.version).toBe(1);
    expect(isSeen(loaded, '2605.10001')).toBe(true);
    expect(isSeen(loaded, '2605.10002')).toBe(true);
    expect(isSeen(loaded, '2605.99999')).toBe(false);
    expect(loaded.ids['2605.10001'].reportPath).toBe('/reports/r1.md');
  });

  it('atomic write: a pre-existing file is intact if only .tmp exists', () => {
    // Write a known-good state to the canonical path.
    const good: SeenIdsState = {
      version: 1,
      ids: { '2605.10001': { ingestedAt: '2026-05-01T00:00:00Z', reportPath: '/good.md' } },
    };
    fs.writeFileSync(seenPath, JSON.stringify(good), 'utf-8');

    // Simulate: .tmp was written but rename never happened (process crashed).
    const tmpPath = `${seenPath}.tmp`;
    const corrupted: SeenIdsState = { version: 1, ids: { 'CORRUPTED': { ingestedAt: '', reportPath: '' } } };
    fs.writeFileSync(tmpPath, JSON.stringify(corrupted), 'utf-8');

    // loadSeenIds reads the canonical path, not the .tmp — original must be intact.
    const loaded = loadSeenIds(seenPath);
    expect(isSeen(loaded, '2605.10001')).toBe(true);
    expect(isSeen(loaded, 'CORRUPTED')).toBe(false);
  });

  it('isSeen returns false for unknown id', () => {
    const state = emptyState();
    expect(isSeen(state, '9999.00000')).toBe(false);
  });

  it('recordSeen does not mutate the original state object', () => {
    const original = emptyState();
    const updated = recordSeen(original, '2605.10001', '/r.md');
    expect(isSeen(original, '2605.10001')).toBe(false);
    expect(isSeen(updated, '2605.10001')).toBe(true);
  });
});
