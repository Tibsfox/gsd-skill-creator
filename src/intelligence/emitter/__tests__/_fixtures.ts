/**
 * Test fixtures + mock EmitterKB for C10 tests.
 *
 * Phase 825 / C10.
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
  SnapshotId,
  SuggestedMove,
} from '../../types.js';
import type { EmitterKB } from '../compose.js';
import type { BundleId } from '../../types.js';

export interface FixtureBundle {
  project: Project;
  meeting: Meeting;
  decisions: Decision[];
  findings: Finding[];
  briefing: Briefing | null;
  bundle?: Bundle | null;
}

export function makeProject(override: Partial<Project> = {}): Project {
  return {
    id: 'gsd-skill-creator',
    name: 'GSD Skill Creator',
    path: '/repo',
    branch: 'dev',
    kind: 'code',
    priority: 'high',
    last_activity_at: '2026-05-03T00:00:00Z',
    last_snapshot_id: 'v1.49+local',
    ...override,
  };
}

export function makeMeeting(override: Partial<Meeting> = {}): Meeting {
  return {
    id: 'M-20260503-test01' as MeetingId,
    project_id: 'gsd-skill-creator',
    started_at: '2026-05-03T00:00:00Z',
    committed_at: null,
    status: 'in_session',
    kb_snapshot: 'v1.49+local',
    briefing_at_start: 'B-fixture01' as Briefing['id'],
    ...override,
  };
}

export function makeBriefing(override: Partial<Briefing> = {}): Briefing {
  return {
    id: 'B-fixture01' as Briefing['id'],
    project_id: 'gsd-skill-creator',
    snapshot_id: 'v1.49+local',
    generated_at: '2026-05-03T00:00:00Z',
    body:
      "Wave 2 calibration is probably 80% complete; coupling spike between DACP and chipset suggests architectural drift. It's unclear whether the rosetta-core modules will hit the same pattern.",
    confidence: 'medium',
    source_findings: [
      'F-2026-0501-0023' as Finding['id'],
      'F-2026-0501-0024' as Finding['id'],
    ],
    suggested_moves: [
      makeSuggestedMove({ rank: 1 }),
      makeSuggestedMove({
        rank: 2,
        title: 'Pick up orphan vision draft',
        kind: 'vision',
        rationale: 'Cheap context-switch; clears a stale draft.',
      }),
    ],
    ...override,
  };
}

export function makeSuggestedMove(
  override: Partial<SuggestedMove> = {},
): SuggestedMove {
  return {
    rank: 1,
    title: 'Investigate DACP/chipset coupling',
    kind: 'research',
    rationale:
      'Probable root cause of held CAPCOM gate; 2.3× baseline coupling indicates architectural drift, not a localized bug.',
    expected_unblocks: 'Wave 2 calibration; CAPCOM gate informed clear',
    source_findings: [
      'F-2026-0501-0023' as Finding['id'],
      'F-2026-0501-0024' as Finding['id'],
    ],
    ...override,
  };
}

export function makeFinding(override: Partial<Finding> = {}): Finding {
  return {
    id: 'F-2026-0501-0023' as Finding['id'],
    project_id: 'gsd-skill-creator',
    kind: 'coupling_spike',
    severity: 'high',
    confidence: 0.85,
    title: 'DACP imports chipset configuration directly',
    rationale:
      'src/dacp/runtime.ts imports chipset config keys at 2.3× the project baseline; likely indicates calibration drift.',
    source_path: 'src/dacp/runtime.ts',
    produced_by: 'analyzer',
    produced_at: '2026-05-01T00:00:00Z',
    snapshot_id: 'v1.49+local',
    status: 'open',
    ...override,
  };
}

export function makeDecision(override: Partial<Decision> = {}): Decision {
  return {
    id: 'dec-fixture-01',
    meeting_id: 'M-20260503-test01' as MeetingId,
    kind: 'research_mission',
    state: 'pending',
    ai_draft: {
      title: 'Investigate DACP/chipset coupling spike',
      body: 'A 2.3× coupling baseline between DACP and chipset module suggests architectural drift. Investigate to determine whether this warrants a refactor or whether the spike is an artifact of recent legitimate work.',
    },
    developer_modifications: [],
    source_findings: ['F-2026-0501-0023' as Finding['id']],
    source_move_rank: 1,
    approved_at: '2026-05-03T00:01:00Z',
    emitted_at: null,
    emission_path: null,
    ...override,
  };
}

// ─── Mock KB ──────────────────────────────────────────────────────────────────

export interface MockEmitterKBState {
  projects: Map<ProjectId, Project>;
  meetings: Map<MeetingId, Meeting>;
  decisions: Map<DecisionId, Decision>;
  briefings: Map<string, Briefing>;
  findings: Map<string, Finding>;
  bundles: Map<MeetingId, Bundle>;
  /** Captured side effects for assertions. */
  markEmittedCalls: Array<{
    decisionId: DecisionId;
    paths: { vision_doc_path: string; meta_path: string; bundle_id: BundleId | null };
  }>;
  missionLinkCalls: Array<{ decisionId: DecisionId; kind: string; ref: string }>;
}

export function makeMockKB(state: Partial<MockEmitterKBState> = {}): EmitterKB & {
  _state: MockEmitterKBState;
} {
  const s: MockEmitterKBState = {
    projects: state.projects ?? new Map(),
    meetings: state.meetings ?? new Map(),
    decisions: state.decisions ?? new Map(),
    briefings: state.briefings ?? new Map(),
    findings: state.findings ?? new Map(),
    bundles: state.bundles ?? new Map(),
    markEmittedCalls: [],
    missionLinkCalls: [],
  };
  return {
    _state: s,
    async getProject(id) {
      return s.projects.get(id) ?? null;
    },
    async getMeeting(meetingId) {
      return s.meetings.get(meetingId) ?? null;
    },
    async getDecision(decisionId) {
      return s.decisions.get(decisionId) ?? null;
    },
    async getBriefing(briefingId) {
      return s.briefings.get(briefingId) ?? null;
    },
    async getCurrentBriefing(projectId) {
      // Return most recent briefing for project (briefing.project_id === projectId).
      const briefings = [...s.briefings.values()].filter(
        (b) => b.project_id === projectId,
      );
      briefings.sort((a, b) =>
        b.generated_at.localeCompare(a.generated_at),
      );
      return briefings[0] ?? null;
    },
    async getBundleForMeeting(meetingId) {
      return s.bundles.get(meetingId) ?? null;
    },
    async getFindingsByIds(ids) {
      return ids.map((id) => s.findings.get(id)).filter((f): f is Finding => !!f);
    },
    async listDecisionsForMeeting(meetingId) {
      return [...s.decisions.values()].filter(
        (d) => d.meeting_id === meetingId,
      );
    },
    async markEmitted(decisionId, paths) {
      const d = s.decisions.get(decisionId);
      if (!d) throw new Error(`mock: decision ${decisionId} not found`);
      d.emitted_at = new Date().toISOString();
      d.emission_path = paths.vision_doc_path;
      s.markEmittedCalls.push({ decisionId, paths });
    },
    async addMissionLink(decisionId, kind, ref) {
      s.missionLinkCalls.push({ decisionId, kind, ref });
    },
  };
}

/** Build a populated mock KB ready for emit tests. */
export function buildPopulatedKB(): {
  kb: EmitterKB & { _state: MockEmitterKBState };
  project: Project;
  meeting: Meeting;
  decision: Decision;
  briefing: Briefing;
  finding: Finding;
} {
  const project = makeProject();
  const meeting = makeMeeting();
  const briefing = makeBriefing();
  const finding = makeFinding();
  const decision = makeDecision();
  const kb = makeMockKB({
    projects: new Map([[project.id, project]]),
    meetings: new Map([[meeting.id, meeting]]),
    decisions: new Map([[decision.id, decision]]),
    briefings: new Map([[briefing.id, briefing]]),
    findings: new Map([[finding.id, finding]]),
  });
  return { kb, project, meeting, decision, briefing, finding };
}
