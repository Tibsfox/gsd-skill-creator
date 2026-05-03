/**
 * Phase 826 / C13 — I2: Briefing generation round-trip
 *
 * Write briefing to KB → getCurrentBriefing returns it correctly.
 * Tests writeBriefing / getCurrentBriefing + suggested_moves serialization.
 *
 * Phase 826 / D-26-20.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';
import type { Briefing, SnapshotId } from '../../types.js';

describe('I2: briefing generation and retrieval', () => {
  it('writeBriefing → getCurrentBriefing round-trips all fields', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      // createTestKB sets up 'test-proj' with migrations applied — use the raw db
      // to insert snapshot dependency directly (mirrors what the analyzer does).
      const snapshotId: SnapshotId = 'S-briefing-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,10,500)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const briefingInput: Omit<Briefing, 'id'> = {
        project_id: 'test-proj',
        snapshot_id: snapshotId,
        generated_at: new Date().toISOString(),
        body: '## Root Cause Hypothesis\n\nHigh coupling in the data layer is causing slow iteration...\n\n## Uncertainty\n\nConfidence is medium; the git churn data only covers 30 days.',
        confidence: 'medium',
        source_findings: ['F-001' as `F-${string}`, 'F-002' as `F-${string}`],
        suggested_moves: [
          {
            rank: 1,
            title: 'Refactor data access layer',
            kind: 'vision',
            rationale: 'Addresses coupling spike',
            source_findings: ['F-001' as `F-${string}`],
          },
        ],
      };

      const briefing = await kb.writeBriefing(briefingInput);
      expect(briefing.id).toMatch(/^B-/);
      expect(briefing.body).toContain('Root Cause Hypothesis');
      expect(briefing.confidence).toBe('medium');
      expect(briefing.source_findings).toContain('F-001');
      expect(briefing.suggested_moves).toHaveLength(1);
      expect(briefing.suggested_moves[0]!.rank).toBe(1);

      // getCurrentBriefing returns the same briefing
      const current = await kb.getCurrentBriefing('test-proj');
      expect(current).not.toBeNull();
      expect(current?.id).toBe(briefing.id);
      expect(current?.confidence).toBe('medium');
      expect(current?.suggested_moves[0]?.title).toBe('Refactor data access layer');
    } finally {
      kbHandle.cleanup();
    }
  });

  it('getCurrentBriefing returns null when no briefings exist', async () => {
    const kbHandle = createTestKB('no-briefing-proj');
    try {
      const kb = await kbHandle.createKBStore();

      await kb.registerProject({
        id: 'no-briefing-proj',
        name: 'No Briefing',
        path: kbHandle.projectDir,
        branch: 'main',
        kind: 'code',
        priority: 'low',
        last_activity_at: new Date().toISOString(),
      });

      const current = await kb.getCurrentBriefing('no-briefing-proj');
      expect(current).toBeNull();
    } finally {
      kbHandle.cleanup();
    }
  });

  it('writeBriefing serializes suggested_moves array correctly', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId: SnapshotId = 'S-moves-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,5,200)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const moves = [
        { rank: 1, title: 'Move A', kind: 'vision' as const, rationale: 'R1', source_findings: [] },
        { rank: 2, title: 'Move B', kind: 'research' as const, rationale: 'R2', source_findings: [] },
        { rank: 3, title: 'Move C', kind: 'analyze' as const, rationale: 'R3', source_findings: [] },
      ];

      const briefing = await kb.writeBriefing({
        project_id: 'test-proj',
        snapshot_id: snapshotId,
        generated_at: new Date().toISOString(),
        body: 'Body text. Hypothesis: A. Uncertainty: B.',
        confidence: 'high',
        source_findings: [],
        suggested_moves: moves,
      });

      const retrieved = await kb.getCurrentBriefing('test-proj');
      expect(retrieved?.suggested_moves).toHaveLength(3);
      expect(retrieved?.suggested_moves[1]?.kind).toBe('research');
      expect(retrieved?.suggested_moves[2]?.title).toBe('Move C');
    } finally {
      kbHandle.cleanup();
    }
  });
});
