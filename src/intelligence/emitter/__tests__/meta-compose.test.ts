/**
 * C10 / T4 — meta.json composer + JSON-schema validation (D-25-14).
 */
import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MissionEmitter } from '../compose.js';
import { validateMeta, MetaValidationError } from '../meta-validator.js';
import type { BundleId } from '../../types.js';
import { buildPopulatedKB } from './_fixtures.js';

function makeEmitter() {
  const f = buildPopulatedKB();
  const stagingRoot = mkdtempSync(join(tmpdir(), 'c10-meta-'));
  return {
    f,
    emitter: new MissionEmitter({
      kb: f.kb,
      stagingRoot,
      now: () => new Date('2026-05-03T12:00:00Z'),
    }),
  };
}

describe('C10 / T4 — meta.json composer', () => {
  it('standard decision → meta passes schema validation', () => {
    const { f, emitter } = makeEmitter();
    const meta = emitter.composeMeta(
      {
        decision: f.decision,
        project: f.project,
        meeting: f.meeting,
        briefing: f.briefing,
        findings: [
          {
            id: f.finding.id,
            kind: f.finding.kind,
            severity: f.finding.severity,
            confidence: f.finding.confidence,
            rationale: f.finding.rationale,
            source_path: f.finding.source_path,
          },
        ],
      },
      'req_2026-05-03_1200_a1b2',
      f.meeting.id as unknown as BundleId,
    );
    expect(() => validateMeta(meta)).not.toThrow();
  });

  it('decision with bundle_id: null AND state sent_now → meta has bundle_id: null', () => {
    const { f, emitter } = makeEmitter();
    const meta = emitter.composeMeta(
      {
        decision: { ...f.decision, state: 'sent_now' },
        project: f.project,
        meeting: f.meeting,
        briefing: f.briefing,
        findings: [
          {
            id: f.finding.id,
            kind: f.finding.kind,
            severity: f.finding.severity,
            confidence: f.finding.confidence,
            rationale: f.finding.rationale,
          },
        ],
      },
      'req_2026-05-03_1200_a1b2',
      null,
    );
    expect(meta.bundle_id).toBeNull();
    expect(() => validateMeta(meta)).not.toThrow();
  });

  it('research_mission decision → skill is research-mission-generator', () => {
    const { f, emitter } = makeEmitter();
    const meta = emitter.composeMeta(
      {
        decision: { ...f.decision, kind: 'research_mission' },
        project: f.project,
        meeting: f.meeting,
        briefing: f.briefing,
        findings: [],
      },
      'req_2026-05-03_1200_a1b2',
      f.meeting.id as unknown as BundleId,
    );
    expect(meta.skill).toBe('research-mission-generator');
    expect(meta.constraints.output_format).toBe('three-file-pdf');
  });

  it('vision_mission decision → skill is vision-to-mission', () => {
    const { f, emitter } = makeEmitter();
    const meta = emitter.composeMeta(
      {
        decision: { ...f.decision, kind: 'vision_mission' },
        project: f.project,
        meeting: f.meeting,
        briefing: f.briefing,
        findings: [],
      },
      'req_2026-05-03_1200_a1b2',
      f.meeting.id as unknown as BundleId,
    );
    expect(meta.skill).toBe('vision-to-mission');
    expect(meta.constraints.output_format).toBe('markdown-package');
  });

  it('provenance includes source_findings, briefing id, ai_rank, ai_rationale', () => {
    const { f, emitter } = makeEmitter();
    const meta = emitter.composeMeta(
      {
        decision: { ...f.decision, source_move_rank: 1 },
        project: f.project,
        meeting: f.meeting,
        briefing: f.briefing,
        findings: [
          {
            id: 'F-2026-0501-0023',
            kind: 'coupling_spike',
            severity: 'high',
            confidence: 0.85,
            rationale: 'r1',
          },
        ],
      },
      'req_2026-05-03_1200_a1b2',
      f.meeting.id as unknown as BundleId,
    );
    expect(meta.provenance.source_findings).toEqual(['F-2026-0501-0023']);
    expect(meta.provenance.source_briefing).toBe(f.briefing.id);
    expect(meta.provenance.ai_rank).toBe(1);
    expect(meta.provenance.ai_rationale).toContain('Probable root cause');
  });

  it('schema validator catches malformed meta (missing required field)', () => {
    const malformed = {
      // missing required fields
      request_id: 'req_test',
      kind: 'wrong_kind',
    };
    expect(() => validateMeta(malformed)).toThrow(MetaValidationError);
  });

  it('schema validator catches invalid skill enum', () => {
    const malformed = {
      request_id: 'req_test',
      kind: 'mission_seed',
      skill: 'not-a-real-skill',
      speed_hint: 'fast',
      project: 'p',
      provenance: {
        source_findings: [],
        source_briefing: null,
        ai_confidence: null,
        ai_rank: null,
        ai_rationale: null,
        developer_approved_at: '2026-05-03T00:00:00Z',
        developer_modifications: [],
        meeting_id: 'M-test',
        meeting_excerpt_url: '',
        kb_snapshot: 'snap',
      },
      constraints: {},
      bundle_id: null,
    };
    expect(() => validateMeta(malformed)).toThrow(MetaValidationError);
  });

  it('branch field present when project has branch', () => {
    const { f, emitter } = makeEmitter();
    const meta = emitter.composeMeta(
      {
        decision: f.decision,
        project: { ...f.project, branch: 'feature-branch' },
        meeting: f.meeting,
        briefing: f.briefing,
        findings: [],
      },
      'req_2026-05-03_1200_a1b2',
      f.meeting.id as unknown as BundleId,
    );
    expect(meta.branch).toBe('feature-branch');
  });

  it('briefing absent → ai_confidence/ai_rank/ai_rationale all null', () => {
    const { f, emitter } = makeEmitter();
    const meta = emitter.composeMeta(
      {
        decision: f.decision,
        project: f.project,
        meeting: f.meeting,
        briefing: null,
        findings: [],
      },
      'req_2026-05-03_1200_a1b2',
      f.meeting.id as unknown as BundleId,
    );
    expect(meta.provenance.source_briefing).toBeNull();
    expect(meta.provenance.ai_confidence).toBeNull();
    expect(meta.provenance.ai_rationale).toBeNull();
  });
});
