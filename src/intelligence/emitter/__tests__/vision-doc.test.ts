/**
 * C10 / T3 — Vision-doc template + composer.
 */
import { describe, it, expect } from 'vitest';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { MissionEmitter } from '../compose.js';
import {
  buildPopulatedKB,
  makeFinding,
  makeMockKB,
  makeProject,
  makeMeeting,
  makeBriefing,
  makeDecision,
} from './_fixtures.js';

function makeEmitter(opts: { kb: ReturnType<typeof buildPopulatedKB>['kb'] }) {
  const stagingRoot = mkdtempSync(join(tmpdir(), 'c10-vd-'));
  return new MissionEmitter({
    kb: opts.kb,
    stagingRoot,
    now: () => new Date('2026-05-03T12:00:00Z'),
  });
}

describe('C10 / T3 — vision-doc composer', () => {
  it('contains the decision title verbatim', () => {
    const f = buildPopulatedKB();
    const emitter = makeEmitter({ kb: f.kb });
    const md = emitter.composeVisionDoc(
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
      'req_2026-05-03_1200_test',
    );
    expect(md).toContain('Investigate DACP/chipset coupling spike');
  });

  it('three source_findings → three bullet items in Source findings section', () => {
    const f = buildPopulatedKB();
    const emitter = makeEmitter({ kb: f.kb });
    const findings = [
      {
        id: 'F-001',
        kind: 'dead_code',
        severity: 'low',
        confidence: 0.9,
        rationale: 'Unused module',
        source_path: 'src/old.ts',
      },
      {
        id: 'F-002',
        kind: 'hot_spot',
        severity: 'high',
        confidence: 0.95,
        rationale: 'Hot spot in pipeline',
      },
      {
        id: 'F-003',
        kind: 'coupling_spike',
        severity: 'med',
        confidence: 0.7,
        rationale: 'Cross-module coupling',
      },
    ];
    const md = emitter.composeVisionDoc(
      {
        decision: f.decision,
        project: f.project,
        meeting: f.meeting,
        briefing: f.briefing,
        findings,
      },
      'req_2026-05-03_1200_test',
    );
    // Expect three bulleted items beginning with "- **F-..."
    const bulletMatches = md.match(/- \*\*F-/g) ?? [];
    expect(bulletMatches.length).toBe(3);
    expect(md).toContain('F-001');
    expect(md).toContain('F-002');
    expect(md).toContain('F-003');
  });

  it('empty developer_modifications → no Developer modifications block', () => {
    const f = buildPopulatedKB();
    const emitter = makeEmitter({ kb: f.kb });
    const md = emitter.composeVisionDoc(
      {
        decision: { ...f.decision, developer_modifications: [] },
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
      'req_2026-05-03_1200_test',
    );
    expect(md).not.toContain('Developer modifications');
  });

  it('non-empty developer_modifications → block rendered with each entry', () => {
    const f = buildPopulatedKB();
    const emitter = makeEmitter({ kb: f.kb });
    const md = emitter.composeVisionDoc(
      {
        decision: {
          ...f.decision,
          developer_modifications: [
            'tightened scope to single-file refactor',
            "added 'document the boundary' as a follow-on",
          ],
        },
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
      'req_2026-05-03_1200_test',
    );
    expect(md).toContain('Developer modifications');
    expect(md).toContain('tightened scope to single-file refactor');
    expect(md).toContain('document the boundary');
  });

  it('briefing absent → Provenance section omits AI rationale', () => {
    const f = buildPopulatedKB();
    const emitter = makeEmitter({ kb: f.kb });
    const md = emitter.composeVisionDoc(
      {
        decision: f.decision,
        project: f.project,
        meeting: f.meeting,
        briefing: null,
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
      'req_2026-05-03_1200_test',
    );
    expect(md).not.toContain('AI rationale at suggestion time');
  });

  it('briefing present + matching rank → renders ai rationale + confidence', () => {
    const f = buildPopulatedKB();
    const emitter = makeEmitter({ kb: f.kb });
    const md = emitter.composeVisionDoc(
      {
        decision: { ...f.decision, source_move_rank: 1 },
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
      'req_2026-05-03_1200_test',
    );
    expect(md).toContain('AI rationale at suggestion time');
    expect(md).toContain('rank #1');
    expect(md).toContain('confidence medium');
    expect(md).toContain('Probable root cause of held CAPCOM gate');
  });

  it('rendered markdown contains the meeting excerpt URL link', () => {
    const f = buildPopulatedKB();
    const emitter = makeEmitter({ kb: f.kb });
    const md = emitter.composeVisionDoc(
      {
        decision: f.decision,
        project: f.project,
        meeting: f.meeting,
        briefing: f.briefing,
        findings: [],
      },
      'req_2026-05-03_1200_test',
    );
    expect(md).toContain(`.planning/intelligence/meetings/${f.meeting.id}.md#decision-${f.decision.id}`);
  });

  it('header carries the request_id for forensic traceability', () => {
    const f = buildPopulatedKB();
    const emitter = makeEmitter({ kb: f.kb });
    const md = emitter.composeVisionDoc(
      {
        decision: f.decision,
        project: f.project,
        meeting: f.meeting,
        briefing: f.briefing,
        findings: [],
      },
      'req_2026-05-03_1200_unique-id',
    );
    expect(md).toContain('request_id: req_2026-05-03_1200_unique-id');
  });
});
