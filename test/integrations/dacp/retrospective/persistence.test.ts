/**
 * Tests for DACP retrospective JSONL persistence.
 *
 * Verifies append-only JSONL storage and retrieval of drift score records.
 * Uses temp directories to avoid filesystem side effects.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm, readFile } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  appendDriftScore,
  readDriftHistory,
} from '../../../../src/integrations/dacp/retrospective/persistence.js';
import type { DriftScoreRecord } from '../../../../src/integrations/dacp/retrospective/types.js';

/** Factory for DriftScoreRecord test data */
function makeDriftScoreRecord(
  overrides: Partial<DriftScoreRecord> = {},
): DriftScoreRecord {
  return {
    score: overrides.score ?? 0.25,
    components: overrides.components ?? {
      intent_miss: 0.1,
      rework_penalty: 0.0,
      verification_penalty: 0.1,
      modification_penalty: 0.05,
    },
    recommendation: overrides.recommendation ?? 'maintain',
    recommended_level: overrides.recommended_level,
    bundle_id: overrides.bundle_id ?? `bundle-${Math.random().toString(36).slice(2, 8)}`,
    handoff_type: overrides.handoff_type ?? 'planner->executor:task-assignment',
    fidelity_level: overrides.fidelity_level ?? 1,
    timestamp: overrides.timestamp ?? new Date().toISOString(),
  };
}

describe('JSONL persistence', () => {
  let tempDir: string;
  let filePath: string;

  beforeEach(async () => {
    tempDir = await mkdtemp(join(tmpdir(), 'dacp-retro-'));
    filePath = join(tempDir, 'drift-scores.jsonl');
  });

  afterEach(async () => {
    await rm(tempDir, { recursive: true, force: true });
  });

  it('appendDriftScore writes a single JSON line to file', async () => {
    const record = makeDriftScoreRecord({ score: 0.42 });
    await appendDriftScore(record, filePath);

    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(1);

    const parsed = JSON.parse(lines[0]);
    expect(parsed.score).toBe(0.42);
  });

  it('appendDriftScore appends to existing file without overwriting', async () => {
    const record1 = makeDriftScoreRecord({ score: 0.1, bundle_id: 'first' });
    const record2 = makeDriftScoreRecord({ score: 0.2, bundle_id: 'second' });

    await appendDriftScore(record1, filePath);
    await appendDriftScore(record2, filePath);

    const content = await readFile(filePath, 'utf-8');
    const lines = content.trim().split('\n');
    expect(lines).toHaveLength(2);
    expect(JSON.parse(lines[0]).bundle_id).toBe('first');
    expect(JSON.parse(lines[1]).bundle_id).toBe('second');
  });

  it('readDriftHistory reads all records from JSONL file', async () => {
    const record1 = makeDriftScoreRecord({ score: 0.1 });
    const record2 = makeDriftScoreRecord({ score: 0.5 });
    const record3 = makeDriftScoreRecord({ score: 0.9 });

    await appendDriftScore(record1, filePath);
    await appendDriftScore(record2, filePath);
    await appendDriftScore(record3, filePath);

    const history = await readDriftHistory(filePath);
    expect(history).toHaveLength(3);
    expect(history[0].score).toBe(0.1);
    expect(history[1].score).toBe(0.5);
    expect(history[2].score).toBe(0.9);
  });

  it('readDriftHistory returns empty array when file does not exist', async () => {
    const nonExistentPath = join(tempDir, 'no-such-file.jsonl');
    const history = await readDriftHistory(nonExistentPath);
    expect(history).toEqual([]);
  });

  it('readDriftHistory handles empty file gracefully', async () => {
    // Create an empty file
    const { writeFile } = await import('fs/promises');
    await writeFile(filePath, '', 'utf-8');

    const history = await readDriftHistory(filePath);
    expect(history).toEqual([]);
  });

  it('preserves all DriftScoreRecord fields after round-trip', async () => {
    const record = makeDriftScoreRecord({
      score: 0.73,
      components: {
        intent_miss: 0.32,
        rework_penalty: 0.3,
        verification_penalty: 0.0,
        modification_penalty: 0.05,
      },
      recommendation: 'promote',
      recommended_level: 2,
      bundle_id: 'test-bundle-roundtrip',
      handoff_type: 'verifier->planner:gap-report',
      fidelity_level: 1,
      timestamp: '2026-02-27T10:00:00.000Z',
    });

    await appendDriftScore(record, filePath);
    const history = await readDriftHistory(filePath);

    expect(history).toHaveLength(1);
    const restored = history[0];
    expect(restored.score).toBe(0.73);
    expect(restored.components.intent_miss).toBe(0.32);
    expect(restored.components.rework_penalty).toBe(0.3);
    expect(restored.components.verification_penalty).toBe(0.0);
    expect(restored.components.modification_penalty).toBe(0.05);
    expect(restored.recommendation).toBe('promote');
    expect(restored.recommended_level).toBe(2);
    expect(restored.bundle_id).toBe('test-bundle-roundtrip');
    expect(restored.handoff_type).toBe('verifier->planner:gap-report');
    expect(restored.fidelity_level).toBe(1);
    expect(restored.timestamp).toBe('2026-02-27T10:00:00.000Z');
  });
});
