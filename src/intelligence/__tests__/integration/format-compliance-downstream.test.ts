/**
 * Phase 826 / C13 — I9: vision_mission seed validates as VisionSeedMeta
 *                    I10: research_mission seed has correct constraint fields
 *
 * Format compliance tests — equivalent to S4+S5 safety tests but at the
 * integration level: exercises the MissionEmitter compose path end-to-end.
 *
 * Phase 826 / D-26-27, D-26-28.
 */

import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { createTestKB } from '../_harness/kb-factory.js';
import type { VisionSeedMeta } from '../../types.js';

describe('I9: vision_mission seed format compliance', () => {
  it('MissionEmitter.emitSendNow produces a meta.json that parses as VisionSeedMeta', async () => {
    const kbHandle = createTestKB();
    try {
      const { MissionEmitter } = await import('../../emitter/emit.js');
      const { mkdtempSync } = await import('node:fs');
      const { join } = await import('node:path');
      const { tmpdir } = await import('node:os');

      const stagingRoot = mkdtempSync(join(tmpdir(), 'gsd-i9-'));
      const { rmSync } = await import('node:fs');

      const snapshotId = 'S-i9-001';
      const meetingId = 'M-20260502-i9' as `M-${string}`;
      const decisionId = 'D-i9-001';

      const project = {
        id: 'test-proj', name: 'Test', path: '/tmp/test',
        branch: 'dev', kind: 'code' as const, priority: 'high' as const,
        last_activity_at: new Date().toISOString(), last_snapshot_id: null,
      };
      const meeting = {
        id: meetingId, project_id: 'test-proj',
        started_at: new Date().toISOString(), committed_at: null,
        status: 'in_session' as const, kb_snapshot: snapshotId,
        briefing_at_start: null,
      };
      const decision = {
        id: decisionId, meeting_id: meetingId, kind: 'vision_mission' as const,
        state: 'pending' as const,
        ai_draft: { title: 'Refactor auth', body: 'Vision body' },
        developer_modifications: [],
        source_findings: ['F-001' as `F-${string}`],
        source_move_rank: 1,
        approved_at: new Date().toISOString(),
        emitted_at: null, emission_path: null,
      };

      const emitter = new MissionEmitter({
        kb: {
          async getProject() { return project; },
          async getMeeting() { return meeting; },
          async getDecision() { return decision; },
          async getCurrentBriefing() { return null; },
          async getBriefing() { return null; },
          async getBundleForMeeting() { return null; },
          async getFindingsByIds() { return []; },
          async listDecisionsForMeeting() { return [decision]; },
          async markEmitted() {},
          async addMissionLink() {},
        },
        stagingRoot,
      });

      const result = await emitter.emitSendNow(decisionId);
      expect(existsSync(result.meta_path)).toBe(true);

      const meta = JSON.parse(readFileSync(result.meta_path, 'utf8')) as VisionSeedMeta;
      expect(meta.kind).toBe('mission_seed');
      expect(meta.skill).toBe('vision-to-mission');
      expect(meta.project).toBe('test-proj');
      expect(meta.provenance.meeting_id).toBe(meetingId);
      expect(meta.provenance.kb_snapshot).toBe(snapshotId);

      rmSync(stagingRoot, { recursive: true, force: true });
    } finally {
      kbHandle.cleanup();
    }
  });
});

describe('I10: research_mission seed format compliance', () => {
  it('research_mission seed has skill = research-mission-generator and constraints.max_research_searches', async () => {
    const kbHandle = createTestKB();
    try {
      const { MissionEmitter } = await import('../../emitter/emit.js');
      const { mkdtempSync, rmSync } = await import('node:fs');
      const { join } = await import('node:path');
      const { tmpdir } = await import('node:os');

      const stagingRoot = mkdtempSync(join(tmpdir(), 'gsd-i10-'));
      const snapshotId = 'S-i10-001';
      const meetingId = 'M-20260502-i10' as `M-${string}`;
      const decisionId = 'D-i10-001';

      const project = {
        id: 'test-proj', name: 'Test', path: '/tmp/test',
        branch: 'dev', kind: 'code' as const, priority: 'high' as const,
        last_activity_at: new Date().toISOString(), last_snapshot_id: null,
      };
      const meeting = {
        id: meetingId, project_id: 'test-proj',
        started_at: new Date().toISOString(), committed_at: null,
        status: 'in_session' as const, kb_snapshot: snapshotId,
        briefing_at_start: null,
      };
      const decision = {
        id: decisionId, meeting_id: meetingId, kind: 'research_mission' as const,
        state: 'pending' as const,
        ai_draft: { title: 'Research caching', body: 'Research body' },
        developer_modifications: [],
        source_findings: [],
        source_move_rank: 2,
        approved_at: new Date().toISOString(),
        emitted_at: null, emission_path: null,
      };

      const emitter = new MissionEmitter({
        kb: {
          async getProject() { return project; },
          async getMeeting() { return meeting; },
          async getDecision() { return decision; },
          async getCurrentBriefing() { return null; },
          async getBriefing() { return null; },
          async getBundleForMeeting() { return null; },
          async getFindingsByIds() { return []; },
          async listDecisionsForMeeting() { return [decision]; },
          async markEmitted() {},
          async addMissionLink() {},
        },
        stagingRoot,
      });

      const result = await emitter.emitSendNow(decisionId);
      const meta = JSON.parse(readFileSync(result.meta_path, 'utf8')) as VisionSeedMeta;
      expect(meta.skill).toBe('research-mission-generator');
      expect(meta.kind).toBe('mission_seed');
      // research_mission seeds should have max_research_searches constraint
      expect(typeof meta.constraints.max_research_searches).toBe('number');
      expect(meta.constraints.max_research_searches).toBeGreaterThan(0);

      rmSync(stagingRoot, { recursive: true, force: true });
    } finally {
      kbHandle.cleanup();
    }
  });
});
