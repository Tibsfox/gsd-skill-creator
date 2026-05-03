/**
 * Phase 824 / C07 — IPC client shape tests (T6).
 *
 * Verifies that every method on `intelligenceIpc` calls `invoke` with the
 * expected Tauri command name and that event subscriptions register correct
 * event names.
 *
 * Mocks `window.__TAURI__` to intercept invoke/listen calls.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// ─── Mock setup ────────────────────────────────────────────────────────────────

const mockInvoke = vi.fn();
const mockListen = vi.fn().mockResolvedValue(() => { /* unlisten noop */ });

function installTauriMock() {
  (globalThis as Record<string, unknown>).__TAURI__ = {
    core: { invoke: mockInvoke },
    event: { listen: mockListen },
  };
}

function removeTauriMock() {
  delete (globalThis as Record<string, unknown>).__TAURI__;
}

// We need to re-import ipc after setting up the mock because the module
// checks window.__TAURI__ at call time (not at import time).
import { intelligenceIpc } from '../ipc.js';

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('intelligenceIpc — command names', () => {
  beforeEach(() => {
    installTauriMock();
    mockInvoke.mockClear();
    mockListen.mockClear();
    mockInvoke.mockResolvedValue(null);
  });

  afterEach(() => {
    removeTauriMock();
  });

  it('listProjects calls intelligence_list_projects with sort', async () => {
    await intelligenceIpc.listProjects('recent').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_list_projects', { sort: 'recent' });
  });

  it('listProjects without sort passes null', async () => {
    await intelligenceIpc.listProjects().catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_list_projects', { sort: null });
  });

  it('getProject calls intelligence_get_project', async () => {
    await intelligenceIpc.getProject('gsd-skill-creator').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_get_project', { projectId: 'gsd-skill-creator' });
  });

  it('registerProject calls intelligence_register_project', async () => {
    const input = { name: 'Test', path: '/tmp/test', kind: 'code' as const, priority: 'high' as const };
    await intelligenceIpc.registerProject(input).catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_register_project', { project: input });
  });

  it('getBriefing calls intelligence_get_briefing', async () => {
    await intelligenceIpc.getBriefing('proj-1').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_get_briefing', { projectId: 'proj-1' });
  });

  it('requestBriefingRefresh calls intelligence_request_briefing_refresh', async () => {
    await intelligenceIpc.requestBriefingRefresh('proj-1', 'dev', 'Some text').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_request_briefing_refresh', {
      projectId: 'proj-1',
      branch: 'dev',
      conversationText: 'Some text',
    });
  });

  it('requestBriefingRefresh omitted args become null', async () => {
    await intelligenceIpc.requestBriefingRefresh('proj-1').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_request_briefing_refresh', {
      projectId: 'proj-1',
      branch: null,
      conversationText: null,
    });
  });

  it('requestSnapshotDiff calls intelligence_request_snapshot_diff', async () => {
    await intelligenceIpc.requestSnapshotDiff('proj-1', 'main').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_request_snapshot_diff', {
      projectId: 'proj-1',
      branch: 'main',
    });
  });

  it('listFindings calls intelligence_list_findings', async () => {
    await intelligenceIpc.listFindings('proj-1').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_list_findings', { projectId: 'proj-1' });
  });

  it('dismissFinding calls intelligence_dismiss_finding', async () => {
    await intelligenceIpc.dismissFinding('F-001' as import('../types.js').FindingId, 'reason').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_dismiss_finding', {
      findingId: 'F-001',
      rationale: 'reason',
    });
  });

  it('startMeeting calls intelligence_start_meeting', async () => {
    await intelligenceIpc.startMeeting('proj-1').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_start_meeting', { projectId: 'proj-1' });
  });

  it('parkMeeting calls intelligence_park_meeting', async () => {
    await intelligenceIpc.parkMeeting('M-001' as import('../types.js').MeetingId).catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_park_meeting', { meetingId: 'M-001' });
  });

  it('resumeMeeting calls intelligence_resume_meeting', async () => {
    await intelligenceIpc.resumeMeeting('M-001' as import('../types.js').MeetingId).catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_resume_meeting', { meetingId: 'M-001' });
  });

  it('getMeetingRecord calls intelligence_get_meeting_record', async () => {
    await intelligenceIpc.getMeetingRecord('M-001' as import('../types.js').MeetingId).catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_get_meeting_record', { meetingId: 'M-001' });
  });

  it('addDecision calls intelligence_add_decision', async () => {
    const draft = { kind: 'vision_mission' as const, ai_draft: null, source_findings: [] };
    await intelligenceIpc.addDecision('M-001' as import('../types.js').MeetingId, draft).catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_add_decision', {
      meetingId: 'M-001',
      draft,
    });
  });

  it('editDecision calls intelligence_edit_decision', async () => {
    await intelligenceIpc.editDecision('dec-001', ['mod1', 'mod2']).catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_edit_decision', {
      decisionId: 'dec-001',
      modifications: ['mod1', 'mod2'],
    });
  });

  it('withdrawDecision calls intelligence_withdraw_decision', async () => {
    await intelligenceIpc.withdrawDecision('dec-001').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_withdraw_decision', { decisionId: 'dec-001' });
  });

  it('sendNow calls intelligence_send_now', async () => {
    await intelligenceIpc.sendNow('dec-001').catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_send_now', { decisionId: 'dec-001' });
  });

  it('previewBundle calls intelligence_preview_bundle', async () => {
    await intelligenceIpc.previewBundle('M-001' as import('../types.js').MeetingId).catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_preview_bundle', { meetingId: 'M-001' });
  });

  it('commitBundle calls intelligence_commit_bundle', async () => {
    await intelligenceIpc.commitBundle('M-001' as import('../types.js').MeetingId).catch(() => null);
    expect(mockInvoke).toHaveBeenCalledWith('intelligence_commit_bundle', { meetingId: 'M-001' });
  });
});

describe('intelligenceIpc — event subscriptions', () => {
  beforeEach(() => {
    installTauriMock();
    mockListen.mockClear();
    mockListen.mockResolvedValue(() => { /* unlisten */ });
  });

  afterEach(() => {
    removeTauriMock();
  });

  it('on.statusUpdate registers intelligence:status_update', async () => {
    await intelligenceIpc.on.statusUpdate(() => { /* noop */ });
    expect(mockListen).toHaveBeenCalledWith('intelligence:status_update', expect.any(Function));
  });

  it('on.briefingReady registers intelligence:briefing_ready', async () => {
    await intelligenceIpc.on.briefingReady(() => { /* noop */ });
    expect(mockListen).toHaveBeenCalledWith('intelligence:briefing_ready', expect.any(Function));
  });

  it('on.findingsUpdated registers intelligence:findings_updated', async () => {
    await intelligenceIpc.on.findingsUpdated(() => { /* noop */ });
    expect(mockListen).toHaveBeenCalledWith('intelligence:findings_updated', expect.any(Function));
  });

  it('on.meetingRecordUpdated registers intelligence:meeting_record_updated', async () => {
    await intelligenceIpc.on.meetingRecordUpdated(() => { /* noop */ });
    expect(mockListen).toHaveBeenCalledWith('intelligence:meeting_record_updated', expect.any(Function));
  });

  it('on.bundleCompleted registers intelligence:bundle_completed', async () => {
    await intelligenceIpc.on.bundleCompleted(() => { /* noop */ });
    expect(mockListen).toHaveBeenCalledWith('intelligence:bundle_completed', expect.any(Function));
  });
});

describe('intelligenceIpc — no-Tauri fallback', () => {
  it('listProjects rejects with server-not-connected when Tauri absent', async () => {
    // No __TAURI__ installed
    removeTauriMock();
    await expect(intelligenceIpc.listProjects()).rejects.toThrow('not connected');
  });

  it('event subscriptions return noop unlisten when Tauri absent', async () => {
    removeTauriMock();
    const unlisten = await intelligenceIpc.on.statusUpdate(() => { /* noop */ });
    // Should not throw; returns a callable.
    expect(typeof unlisten).toBe('function');
  });
});

describe('intelligenceIpc — S13 no auth tokens', () => {
  beforeEach(() => {
    installTauriMock();
    mockInvoke.mockClear();
    mockInvoke.mockResolvedValue({});
  });

  afterEach(() => {
    removeTauriMock();
  });

  it('requestBriefingRefresh payload contains no Bearer token', async () => {
    await intelligenceIpc.requestBriefingRefresh('proj', 'dev', 'some text').catch(() => null);
    expect(mockInvoke).toHaveBeenCalled();
    const calls = mockInvoke.mock.calls;
    // Find the briefing_refresh call.
    const call = calls.find(c => c[0] === 'intelligence_request_briefing_refresh');
    expect(call).toBeDefined();
    const json = JSON.stringify(call?.[1] ?? {});
    expect(json).not.toMatch(/Bearer\s+/);
    expect(json).not.toMatch(/sk-[a-zA-Z0-9]{10,}/);
    expect(json).not.toMatch(/ghp_[a-zA-Z0-9]{10,}/);
    expect(json).not.toMatch(/ANTHROPIC_API_KEY/);
  });
});
