/**
 * Intelligence KB stub.
 *
 * Reference implementation of the `IntelligenceKB` interface whose every method
 * rejects with a deferred-implementation marker. Track C UI components compile
 * against this surface in Phase 824 before the real C04 implementation lands
 * in Phase 823.
 */

import type {
  Briefing,
  Bundle,
  Decision,
  DecisionId,
  Finding,
  FindingId,
  IntelligenceKB,
  Meeting,
  MeetingId,
  Project,
  ProjectId,
  SnapshotId,
} from '../types.js';

const DEFERRED = 'IntelligenceKB stub: implementation lands in Phase 823 / C04';

export class IntelligenceKBStub implements IntelligenceKB {
  listProjects(_opts?: { sort?: 'recent' | 'priority' | 'findings' }): Promise<Project[]> {
    return Promise.reject(new Error(DEFERRED));
  }

  getProject(_id: ProjectId): Promise<Project | null> {
    return Promise.reject(new Error(DEFERRED));
  }

  getCurrentBriefing(_p: ProjectId): Promise<Briefing | null> {
    return Promise.reject(new Error(DEFERRED));
  }

  listOpenFindings(_p: ProjectId): Promise<Finding[]> {
    return Promise.reject(new Error(DEFERRED));
  }

  listInFlightWork(_p: ProjectId): Promise<{ bundles: Bundle[]; decisions: Decision[] }> {
    return Promise.reject(new Error(DEFERRED));
  }

  listMeetings(_p: ProjectId): Promise<Meeting[]> {
    return Promise.reject(new Error(DEFERRED));
  }

  startMeeting(_p: ProjectId, _snapshot: SnapshotId): Promise<Meeting> {
    return Promise.reject(new Error(DEFERRED));
  }

  addDecision(
    _meetingId: MeetingId,
    _d: Omit<Decision, 'id' | 'meeting_id'>,
  ): Promise<Decision> {
    return Promise.reject(new Error(DEFERRED));
  }

  promoteToSendNow(_decisionId: DecisionId): Promise<Decision> {
    return Promise.reject(new Error(DEFERRED));
  }

  commitBundle(_meetingId: MeetingId): Promise<Bundle> {
    return Promise.reject(new Error(DEFERRED));
  }

  parkMeeting(_meetingId: MeetingId): Promise<Meeting> {
    return Promise.reject(new Error(DEFERRED));
  }

  dismissFinding(_findingId: FindingId, _rationale?: string): Promise<Finding> {
    return Promise.reject(new Error(DEFERRED));
  }
}
