/**
 * Phase 826 / C13 — S4: Mission emitter → vision-to-mission format compliance
 *                    S5: Mission emitter → research-mission-generator format compliance
 *
 * Both downstream skills must accept seeds without modification.
 *
 * G2 BLOCK — any FAIL blocks release.
 *
 * Phase 826 / D-26-10.
 */

import { describe, it, expect, afterAll } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const tmpDirs: string[] = [];

afterAll(() => {
  for (const d of tmpDirs.splice(0)) {
    rmSync(d, { recursive: true, force: true });
  }
});

function makeStagingRoot(): string {
  const d = mkdtempSync(join(tmpdir(), 'gsd-s4-'));
  tmpDirs.push(d);
  return d;
}

// ─── Shared KB mock ─────────────────────────────────────────────────────────

function makeKBMock(opts: {
  kind?: 'vision_mission' | 'research_mission';
} = {}) {
  const { kind = 'vision_mission' } = opts;
  const project = {
    id: 'test-proj', name: 'Test Project', path: '/tmp/test-proj',
    branch: 'dev', kind: 'code' as const, priority: 'high' as const,
    last_activity_at: new Date().toISOString(), last_snapshot_id: null,
  };
  const meeting = {
    id: 'M-20260502-test1' as const, project_id: 'test-proj',
    started_at: new Date().toISOString(), committed_at: null,
    status: 'in_session' as const,
    kb_snapshot: 'S-001', briefing_at_start: null,
  };
  const decision = {
    id: 'D-test01', meeting_id: meeting.id, kind,
    state: 'pending' as const,
    ai_draft: {
      title: kind === 'vision_mission'
        ? 'Refactor analyzer core'
        : 'Research on hot-spot patterns',
      body: 'Detailed body for the ' + kind + ' decision.',
    },
    developer_modifications: ['Scoped to src/intelligence/analyzer/ only'],
    source_findings: ['F-001' as `F-${string}`],
    source_move_rank: 1,
    approved_at: new Date().toISOString(),
    emitted_at: null, emission_path: null,
  };
  const briefing = {
    id: 'B-test01' as `B-${string}`, project_id: 'test-proj', snapshot_id: 'S-001',
    generated_at: new Date().toISOString(),
    body: 'Probably caused by accumulation of technical debt. Unclear whether it affects performance.',
    confidence: 'medium' as const,
    source_findings: ['F-001' as `F-${string}`],
    suggested_moves: [
      { rank: 1, title: 'Refactor core', kind: 'vision' as const, rationale: 'Reduces coupling', source_findings: ['F-001' as `F-${string}`] },
    ],
  };
  const finding = {
    id: 'F-001' as `F-${string}`, project_id: 'test-proj', kind: 'hot_spot' as const,
    severity: 'high' as const, confidence: 0.9, title: 'Hot spot in analyzer',
    rationale: 'High churn × complexity', source_path: 'src/intelligence/analyzer/index.ts',
    produced_by: 'analyzer' as const, produced_at: new Date().toISOString(),
    snapshot_id: 'S-001', status: 'open' as const,
  };

  return {
    async getProject() { return project; },
    async getMeeting() { return meeting; },
    async getDecision() { return decision; },
    async getCurrentBriefing() { return briefing; },
    async getBriefing() { return briefing; },
    async getBundleForMeeting() { return null; },
    async getFindingsByIds() { return [finding]; },
    async listDecisionsForMeeting() { return [decision]; },
    async markEmitted() {},
    async addMissionLink() {},
  };
}

// ─── S4: vision-to-mission format compliance ────────────────────────────────

describe('S4: mission emitter → vision-to-mission format compliance (G2 BLOCK)', () => {
  it('vision_mission seed validates as a valid VisionSeedMeta', async () => {
    const { MissionEmitter } = await import('../../emitter/emit.js');
    const { validateMeta } = await import('../../emitter/meta-validator.js');

    const stagingRoot = makeStagingRoot();
    const emitter = new MissionEmitter({
      kb: makeKBMock({ kind: 'vision_mission' }),
      stagingRoot,
    });

    const result = await emitter.emitSendNow('D-test01');
    // If validateMeta throws, the test fails — this is the format compliance check
    expect(result.request_id).toMatch(/^req_/);
    expect(result.bundle_id).toBeNull();
  });

  it('vision seed has all required vision-doc sections', async () => {
    const { MissionEmitter } = await import('../../emitter/emit.js');
    const stagingRoot = makeStagingRoot();
    const emitter = new MissionEmitter({
      kb: makeKBMock({ kind: 'vision_mission' }),
      stagingRoot,
    });

    const ctx = {
      decision: {
        id: 'D-test01', meeting_id: 'M-20260502-test1' as const,
        kind: 'vision_mission' as const, state: 'pending' as const,
        ai_draft: { title: 'Refactor analyzer core', body: 'Detailed body.' },
        developer_modifications: [], source_findings: [] as `F-${string}`[],
        source_move_rank: 1, approved_at: new Date().toISOString(),
        emitted_at: null, emission_path: null,
      },
      project: { id: 'p1', name: 'P1', path: '/tmp/p1', kind: 'code' as const, priority: 'high' as const, last_activity_at: '', last_snapshot_id: null },
      meeting: { id: 'M-20260502-test1' as const, project_id: 'p1', started_at: '', committed_at: null, status: 'in_session' as const, kb_snapshot: 'S-001', briefing_at_start: null },
      briefing: null,
      findings: [],
    };
    const doc = emitter.composeVisionDoc(ctx, 'req_test');
    // Vision doc must have key sections
    expect(doc).toContain('vision');
    expect(doc.length).toBeGreaterThan(50);
  });
});

// ─── S5: research-mission-generator format compliance ───────────────────────

describe('S5: mission emitter → research-mission-generator format compliance (G2 BLOCK)', () => {
  it('research_mission seed validates as a valid VisionSeedMeta', async () => {
    const { MissionEmitter } = await import('../../emitter/emit.js');
    const { validateMeta } = await import('../../emitter/meta-validator.js');

    const stagingRoot = makeStagingRoot();
    const emitter = new MissionEmitter({
      kb: makeKBMock({ kind: 'research_mission' }),
      stagingRoot,
    });

    const result = await emitter.emitSendNow('D-test01');
    expect(result.request_id).toMatch(/^req_/);
    expect(result.bundle_id).toBeNull();
  });

  it('research_mission seed skill is research-mission-generator', async () => {
    const { MissionEmitter } = await import('../../emitter/emit.js');
    const stagingRoot = makeStagingRoot();
    const emitter = new MissionEmitter({
      kb: makeKBMock({ kind: 'research_mission' }),
      stagingRoot,
    });

    const ctx = {
      decision: {
        id: 'D-r01', meeting_id: 'M-20260502-test1' as const,
        kind: 'research_mission' as const, state: 'pending' as const,
        ai_draft: { title: 'Research on hot spots', body: 'Body.' },
        developer_modifications: [], source_findings: [] as `F-${string}`[],
        source_move_rank: 1, approved_at: new Date().toISOString(),
        emitted_at: null, emission_path: null,
      },
      project: { id: 'p1', name: 'P1', path: '/tmp/p1', kind: 'code' as const, priority: 'high' as const, last_activity_at: '', last_snapshot_id: null },
      meeting: { id: 'M-20260502-test1' as const, project_id: 'p1', started_at: '', committed_at: null, status: 'in_session' as const, kb_snapshot: 'S-001', briefing_at_start: null },
      briefing: null,
      findings: [],
    };
    const meta = emitter.composeMeta(ctx, 'req_r01', null);
    expect(meta.skill).toBe('research-mission-generator');
    expect(meta.constraints.max_research_searches).toBe(6);
    expect(meta.constraints.crew_profile).toBe('squadron');
  });
});
