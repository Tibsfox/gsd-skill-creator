/**
 * Phase 826 / C13 — P7: Meeting commit + bundle emission speed
 *
 * startMeeting → addDecision × 10 → commitBundle completes in <1000ms.
 * Advisory.
 *
 * Phase 826 / D-26-45.
 */

import { describe, it, expect } from 'vitest';
import { createTestKB } from '../_harness/kb-factory.js';

describe('P7/meeting: start → 10 decisions → commitBundle under 1000ms (PERF — WARN ONLY)', () => {
  it('meeting commit flow with 10 decisions completes in <1000ms', async () => {
    const kbHandle = createTestKB();
    try {
      const kb = await kbHandle.createKBStore();

      const snapshotId = 'S-p7-001';
      kbHandle.db.prepare(
        "INSERT OR IGNORE INTO snapshots (id, project_id, taken_at, git_sha, files_scanned, loc_total) VALUES (?,?,?,NULL,100,10000)"
      ).run(snapshotId, 'test-proj', new Date().toISOString());

      const start = performance.now();

      const meeting = await kb.startMeeting('test-proj', snapshotId);
      for (let i = 0; i < 10; i++) {
        await kb.addDecision(meeting.id, {
          state: 'pending',
          kind: i % 2 === 0 ? 'vision_mission' : 'research_mission',
          ai_draft: { title: `Decision ${i}`, body: `Body for decision ${i}` },
          developer_modifications: [],
          source_findings: [],
          emitted_at: null,
          emission_path: null,
          approved_at: new Date().toISOString(),
        });
      }
      const bundle = await kb.commitBundle(meeting.id);

      const elapsed = performance.now() - start;

      if (elapsed > 1000) {
        console.warn(`P7 PERF WARN: meeting commit × 10 decisions took ${elapsed.toFixed(0)}ms (target: <1000ms)`);
      }
      expect(elapsed).toBeLessThan(10000); // Hard limit
      expect(bundle.decisions).toHaveLength(10);
    } finally {
      kbHandle.cleanup();
    }
  });
});
