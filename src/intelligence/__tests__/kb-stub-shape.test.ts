import { describe, it, expect } from 'vitest';
import { IntelligenceKBStub } from '../kb/stub.js';
import type { Decision, FindingId, MeetingId, ProjectId, SnapshotId } from '../types.js';

const PID: ProjectId = 'gsd-skill-creator';
const MID: MeetingId = 'M-2026-05-02-0001';
const SID: SnapshotId = 'v1.49.597+local';
const FID: FindingId = 'F-deadcode01';

describe('intelligence/kb/stub — every method rejects with deferred-implementation marker', () => {
  const stub = new IntelligenceKBStub();
  const expectStubReject = async (p: Promise<unknown>) => {
    await expect(p).rejects.toThrow(/IntelligenceKB stub/);
  };

  it('listProjects', () => expectStubReject(stub.listProjects()));
  it('listProjects with sort', () => expectStubReject(stub.listProjects({ sort: 'recent' })));
  it('getProject', () => expectStubReject(stub.getProject(PID)));
  it('getCurrentBriefing', () => expectStubReject(stub.getCurrentBriefing(PID)));
  it('listOpenFindings', () => expectStubReject(stub.listOpenFindings(PID)));
  it('listInFlightWork', () => expectStubReject(stub.listInFlightWork(PID)));
  it('listMeetings', () => expectStubReject(stub.listMeetings(PID)));
  it('startMeeting', () => expectStubReject(stub.startMeeting(PID, SID)));

  it('addDecision', () => {
    const d: Omit<Decision, 'id' | 'meeting_id'> = {
      kind: 'vision_mission',
      state: 'pending',
      ai_draft: null,
      developer_modifications: [],
      source_findings: [],
      approved_at: null,
      emitted_at: null,
      emission_path: null,
    };
    return expectStubReject(stub.addDecision(MID, d));
  });

  it('promoteToSendNow', () => expectStubReject(stub.promoteToSendNow('dec-001')));
  it('commitBundle', () => expectStubReject(stub.commitBundle(MID)));
  it('parkMeeting', () => expectStubReject(stub.parkMeeting(MID)));
  it('dismissFinding', () => expectStubReject(stub.dismissFinding(FID, 'reason')));
});
