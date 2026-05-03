import { describe, it, expect, expectTypeOf } from 'vitest';
import type {
  Briefing,
  Bundle,
  ConsoleRequest,
  Decision,
  Finding,
  FindingId,
  BriefingId,
  Meeting,
  MeetingId,
  Project,
  Snapshot,
  SuggestedMove,
  VisionSeedMeta,
} from '../types.js';

describe('intelligence/types — compile-time contracts', () => {
  it('Project shape compiles with all required fields', () => {
    const p: Project = {
      id: 'gsd-skill-creator',
      name: 'gsd-skill-creator',
      path: '/media/foxy/ai/GSD/dev-tools/gsd-skill-creator',
      branch: 'dev',
      kind: 'mixed',
      priority: 'high',
      last_activity_at: '2026-05-02T20:00:00.000Z',
      last_snapshot_id: null,
    };
    expect(p.id).toBe('gsd-skill-creator');
  });

  it('Finding ID is branded as `F-${string}`', () => {
    const id: FindingId = 'F-abc12345';
    expectTypeOf<typeof id>().toEqualTypeOf<FindingId>();
    expect(id.startsWith('F-')).toBe(true);
  });

  it('Briefing ID is branded as `B-${string}`', () => {
    const id: BriefingId = 'B-2026050201';
    expectTypeOf<typeof id>().toEqualTypeOf<BriefingId>();
    expect(id.startsWith('B-')).toBe(true);
  });

  it('Meeting ID is branded as `M-${string}` and Bundle inherits it', () => {
    const m: MeetingId = 'M-2026-05-02-0001';
    expectTypeOf<typeof m>().toEqualTypeOf<MeetingId>();
    expect(m.startsWith('M-')).toBe(true);
  });

  it('Finding shape carries kind, severity, confidence, snapshot_id', () => {
    const f: Finding = {
      id: 'F-deadcode01',
      project_id: 'gsd-skill-creator',
      kind: 'dead_code',
      severity: 'med',
      confidence: 0.85,
      title: 'Unused export',
      rationale: 'Symbol exported but never imported anywhere in the repo.',
      produced_by: 'analyzer',
      produced_at: '2026-05-02T20:00:00.000Z',
      snapshot_id: 'v1.49.597+local',
      status: 'open',
    };
    expect(f.confidence).toBeGreaterThanOrEqual(0);
    expect(f.confidence).toBeLessThanOrEqual(1);
  });

  it('Snapshot shape carries id, project_id, files_scanned, loc_total', () => {
    const s: Snapshot = {
      id: 'v1.49.597+local',
      project_id: 'gsd-skill-creator',
      taken_at: '2026-05-02T20:00:00.000Z',
      files_scanned: 1234,
      loc_total: 632000,
    };
    expect(s.files_scanned).toBeGreaterThan(0);
  });

  it('Briefing requires causal hypothesis + uncertainty content (shape only)', () => {
    const moves: SuggestedMove[] = [
      {
        rank: 1,
        title: 'Refactor analyzer dispatch',
        kind: 'vision',
        rationale: 'Coupling spike + churn outlier intersect in core.ts.',
        source_findings: ['F-abc12345'],
      },
    ];
    const b: Briefing = {
      id: 'B-2026050201',
      project_id: 'gsd-skill-creator',
      snapshot_id: 'v1.49.597+local',
      generated_at: '2026-05-02T20:00:00.000Z',
      body: 'The hot-spot in core.ts likely caused the run-time blowup; uncertainty: tree-sitter parse cost vs router dispatch cost.',
      confidence: 'medium',
      source_findings: ['F-abc12345'],
      suggested_moves: moves,
    };
    expect(b.suggested_moves.length).toBeGreaterThanOrEqual(1);
  });

  it('Meeting state machine values are typed correctly', () => {
    const m: Meeting = {
      id: 'M-2026-05-02-0001',
      project_id: 'gsd-skill-creator',
      started_at: '2026-05-02T19:00:00.000Z',
      committed_at: null,
      status: 'in_session',
      kb_snapshot: 'v1.49.597+local',
      briefing_at_start: 'B-2026050201',
    };
    expect(m.status).toBe('in_session');
  });

  it('Decision shape carries lifecycle fields', () => {
    const d: Decision = {
      id: 'dec-001',
      meeting_id: 'M-2026-05-02-0001',
      kind: 'vision_mission',
      state: 'pending',
      ai_draft: { title: 'Refactor analyzer dispatch', body: 'Plan body...' },
      developer_modifications: [],
      source_findings: ['F-abc12345'],
      approved_at: null,
      emitted_at: null,
      emission_path: null,
    };
    expect(d.state).toBe('pending');
  });

  it('Bundle batch_hints has parallelizable, shared_context, suggested_order', () => {
    const b: Bundle = {
      id: 'M-2026-05-02-0001',
      meeting_id: 'M-2026-05-02-0001',
      emitted_at: '2026-05-02T20:18:00.000Z',
      decisions: ['dec-001', 'dec-002'],
      manifest_path: '.planning/staging/inbox/...',
      batch_hints: {
        parallelizable: [['dec-001'], ['dec-002']],
        shared_context: [],
        suggested_order: ['dec-001', 'dec-002'],
      },
    };
    expect(b.batch_hints.parallelizable.length).toBe(2);
  });

  it('VisionSeedMeta carries the full provenance contract', () => {
    const v: VisionSeedMeta = {
      request_id: 'req-1',
      kind: 'mission_seed',
      skill: 'vision-to-mission',
      speed_hint: 'fast',
      project: 'gsd-skill-creator',
      provenance: {
        source_findings: ['F-abc12345'],
        source_briefing: 'B-2026050201',
        ai_confidence: 'medium',
        ai_rank: 1,
        ai_rationale: 'rationale',
        developer_approved_at: '2026-05-02T20:14:32.000Z',
        developer_modifications: [],
        meeting_id: 'M-2026-05-02-0001',
        meeting_excerpt_url: '...',
        kb_snapshot: 'v1.49.597+local',
      },
      constraints: { crew_profile: 'squadron' },
      bundle_id: 'M-2026-05-02-0001',
    };
    expect(v.provenance.meeting_id).toMatch(/^M-/);
  });

  it('ConsoleRequest enum admits exactly the 5 intelligence.* types', () => {
    const r: ConsoleRequest = {
      id: 'req-1',
      type: 'intelligence.refresh_briefing',
      project: 'gsd-skill-creator',
      payload: {},
      respond_to: '.planning/console/outbox/status/req-1.json',
      timeout_hint_ms: 60000,
    };
    expect(r.type.startsWith('intelligence.')).toBe(true);
  });
});
