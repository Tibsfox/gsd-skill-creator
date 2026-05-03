/**
 * Test fixtures + mock MeetingRecordKB for C11 tests.
 */
import type {
  Briefing,
  Bundle,
  Decision,
  DecisionId,
  Finding,
  Meeting,
  MeetingId,
  Project,
  ProjectId,
  BriefingId,
  BundleId,
} from '../../types.js';
import type { MeetingRecordKB } from '../record.js';

export function makeProject(o: Partial<Project> = {}): Project {
  return {
    id: 'gsd-skill-creator',
    name: 'GSD Skill Creator',
    path: '/repo',
    branch: 'dev',
    kind: 'code',
    priority: 'high',
    last_activity_at: '2026-05-03T00:00:00Z',
    last_snapshot_id: 'v1.49+local',
    ...o,
  };
}

export function makeMeeting(o: Partial<Meeting> = {}): Meeting {
  return {
    id: 'M-20260503-rec01' as MeetingId,
    project_id: 'gsd-skill-creator',
    started_at: '2026-05-03T13:00:00Z',
    committed_at: '2026-05-03T13:30:00Z',
    status: 'committed',
    kb_snapshot: 'v1.49+local',
    briefing_at_start: 'B-rec01' as BriefingId,
    ...o,
  };
}

export function makeBriefing(o: Partial<Briefing> = {}): Briefing {
  return {
    id: 'B-rec01' as BriefingId,
    project_id: 'gsd-skill-creator',
    snapshot_id: 'v1.49+local',
    generated_at: '2026-05-03T13:00:00Z',
    body:
      'Wave 2 calibration is probably 80% complete; the held CAPCOM gate likely traces to a coupling spike between DACP and chipset (2.3× project baseline). It is unclear whether the rosetta-core modules will hit the same pattern.',
    confidence: 'medium',
    source_findings: [
      'F-2026-0501-0023' as Finding['id'],
      'F-2026-0501-0024' as Finding['id'],
    ],
    suggested_moves: [
      {
        rank: 1,
        title: 'Investigate DACP/chipset coupling',
        kind: 'research',
        rationale:
          'Probable root cause; 2.3× baseline coupling indicates architectural drift, not a localized bug.',
        expected_unblocks: 'CAPCOM gate informed clear',
        source_findings: ['F-2026-0501-0023' as Finding['id']],
      },
    ],
    ...o,
  };
}

export function makeFinding(o: Partial<Finding> = {}): Finding {
  return {
    id: 'F-2026-0501-0023' as Finding['id'],
    project_id: 'gsd-skill-creator',
    kind: 'coupling_spike',
    severity: 'high',
    confidence: 0.85,
    title: 'DACP imports chipset configuration directly',
    rationale: 'src/dacp/runtime.ts imports chipset config keys directly.',
    source_path: 'src/dacp/runtime.ts',
    produced_by: 'analyzer',
    produced_at: '2026-05-01T00:00:00Z',
    snapshot_id: 'v1.49+local',
    status: 'open',
    ...o,
  };
}

export function makeDecision(o: Partial<Decision> = {}): Decision {
  return {
    id: 'd-rec01',
    meeting_id: 'M-20260503-rec01' as MeetingId,
    kind: 'research_mission',
    state: 'bundled',
    ai_draft: {
      title: 'Investigate DACP/chipset coupling spike',
      body: 'Body.',
    },
    developer_modifications: [],
    source_findings: ['F-2026-0501-0023' as Finding['id']],
    source_move_rank: 1,
    approved_at: '2026-05-03T13:15:00Z',
    emitted_at: '2026-05-03T13:30:00Z',
    emission_path: '/repo/.planning/staging/inbox/req_test.md',
    ...o,
  };
}

export interface MockState {
  meetings: Map<MeetingId, Meeting>;
  projects: Map<ProjectId, Project>;
  briefings: Map<string, Briefing>;
  decisions: Map<DecisionId, Decision>;
  findings: Map<string, Finding>;
  bundles: Map<MeetingId, Bundle>;
  meetingLog: Map<MeetingId, Array<{ kind: string; body: string; recorded_at: string }>>;
  dismissedFindings: Map<MeetingId, Finding[]>;
}

export function makeMockKB(seed: Partial<MockState> = {}): MeetingRecordKB & {
  _state: MockState;
} {
  const s: MockState = {
    meetings: seed.meetings ?? new Map(),
    projects: seed.projects ?? new Map(),
    briefings: seed.briefings ?? new Map(),
    decisions: seed.decisions ?? new Map(),
    findings: seed.findings ?? new Map(),
    bundles: seed.bundles ?? new Map(),
    meetingLog: seed.meetingLog ?? new Map(),
    dismissedFindings: seed.dismissedFindings ?? new Map(),
  };
  return {
    _state: s,
    async getMeeting(id) {
      return s.meetings.get(id) ?? null;
    },
    async getProject(id) {
      return s.projects.get(id) ?? null;
    },
    async getBriefing(id) {
      return s.briefings.get(id) ?? null;
    },
    async getCurrentBriefing(p) {
      const briefings = [...s.briefings.values()].filter(
        (b) => b.project_id === p,
      );
      briefings.sort((a, b) => b.generated_at.localeCompare(a.generated_at));
      return briefings[0] ?? null;
    },
    async listAllDecisionsForMeeting(id) {
      return [...s.decisions.values()].filter((d) => d.meeting_id === id);
    },
    async getBundleForMeeting(id) {
      return s.bundles.get(id) ?? null;
    },
    async getMeetingLog(id) {
      return s.meetingLog.get(id) ?? [];
    },
    async getDecision(id) {
      return s.decisions.get(id) ?? null;
    },
    async getFindingsDismissedInMeeting(id) {
      return s.dismissedFindings.get(id) ?? [];
    },
    async getFindingsByIds(ids) {
      return ids
        .map((id) => s.findings.get(id))
        .filter((f): f is Finding => !!f);
    },
  };
}

export function buildPopulatedKB(): {
  kb: MeetingRecordKB & { _state: MockState };
  meeting: Meeting;
  project: Project;
  briefing: Briefing;
  decisions: Decision[];
  finding: Finding;
} {
  const meeting = makeMeeting();
  const project = makeProject();
  const briefing = makeBriefing();
  const finding = makeFinding();
  const decisions = [
    makeDecision({ id: 'd1' }),
    makeDecision({
      id: 'd2',
      kind: 'vision_mission',
      ai_draft: {
        title: 'Pick up orphaned silicon-perf draft',
        body: 'Body.',
      },
      source_move_rank: 2,
    }),
    makeDecision({
      id: 'd3',
      kind: 'analysis_run',
      state: 'sent_now',
      ai_draft: { title: 'Snapshot diff since v1.49', body: 'Body.' },
      emitted_at: '2026-05-03T13:20:00Z',
      source_findings: [],
    }),
  ];
  const bundle: Bundle = {
    id: meeting.id as unknown as BundleId,
    meeting_id: meeting.id,
    emitted_at: '2026-05-03T13:30:00Z',
    decisions: ['d1', 'd2'],
    manifest_path: `.planning/staging/inbox/bundles/${meeting.id}.bundle.yaml`,
    batch_hints: { parallelizable: [['d1', 'd2']], shared_context: [], suggested_order: ['d1', 'd2'] },
  };
  const kb = makeMockKB({
    meetings: new Map([[meeting.id, meeting]]),
    projects: new Map([[project.id, project]]),
    briefings: new Map([[briefing.id, briefing]]),
    decisions: new Map(decisions.map((d) => [d.id, d])),
    findings: new Map([[finding.id, finding]]),
    bundles: new Map([[meeting.id, bundle]]),
    meetingLog: new Map([
      [
        meeting.id,
        [
          {
            kind: 'utterance',
            body: 'Coupling spike feels architectural, not local.',
            recorded_at: '2026-05-03T13:05:00Z',
          },
          {
            kind: 'note',
            body: 'Need to check whether chipset.ts has a shadow import path.',
            recorded_at: '2026-05-03T13:10:00Z',
          },
        ],
      ],
    ]),
  });
  return { kb, meeting, project, briefing, decisions, finding };
}
