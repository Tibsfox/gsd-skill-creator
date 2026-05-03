/**
 * Phase 824 / C09 T5 — Micro-meeting modal tests.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createMicroMeetingModal } from '../components/micro-meeting-modal.js';
import type { InFlightDecision } from '../types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    startMeeting: vi.fn().mockResolvedValue({
      id: 'M-002', project_id: 'proj-1', started_at: new Date().toISOString(),
      committed_at: null, status: 'in_session', kb_snapshot: 'snap-1', briefing_at_start: null,
    }),
    requestBriefingRefresh: vi.fn().mockRejectedValue(new Error('stub')),
    on: { statusUpdate: vi.fn().mockResolvedValue(() => {}) },
  },
}));

function makeBlockedDecision(overrides: Partial<InFlightDecision> = {}): InFlightDecision {
  return {
    id: 'dec-blocked-001',
    bundle_id: 'B-001',
    project_id: 'proj-1',
    title: 'Clear or escalate the CAPCOM gate',
    state: 'blocked',
    block_reason: 'Safety audit returned 2 findings during Wave N gate.',
    block_findings: ['F-2026-0502-0089', 'F-2026-0502-0090'],
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('Micro-meeting modal', () => {
  beforeEach(async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    (intelligenceIpc.startMeeting as ReturnType<typeof vi.fn>).mockClear();
  });

  it('opens and renders decision title + block reason', () => {
    const decision = makeBlockedDecision();
    const comp = createMicroMeetingModal(decision);
    const div = document.createElement('div');
    comp.mount(div);
    comp.open();

    const dialog = div.querySelector('dialog');
    expect(dialog).not.toBeNull();
    expect(dialog?.textContent).toContain('Clear or escalate the CAPCOM gate');
    expect(dialog?.textContent).toContain('Safety audit returned 2 findings');
    comp.unmount();
  });

  it('pre-populates finding IDs in modal body', () => {
    const decision = makeBlockedDecision();
    const comp = createMicroMeetingModal(decision);
    const div = document.createElement('div');
    comp.mount(div);
    comp.open();

    const dialog = div.querySelector('dialog');
    expect(dialog?.textContent).toContain('F-2026-0502-0089');
    expect(dialog?.textContent).toContain('F-2026-0502-0090');
    comp.unmount();
  });

  it('Clear action emits console request with action: clear', async () => {
    const onRequest = vi.fn();
    const decision = makeBlockedDecision();
    const comp = createMicroMeetingModal(decision, onRequest);
    const div = document.createElement('div');
    comp.mount(div);
    comp.open();

    const clearRadio = div.querySelector('input[value="clear"]') as HTMLInputElement;
    clearRadio.checked = true;
    clearRadio.dispatchEvent(new Event('change', { bubbles: true }));

    const sendBtn = div.querySelector('.modal-send-btn') as HTMLButtonElement;
    sendBtn.click();
    await new Promise(r => setTimeout(r, 20));

    expect(onRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'intelligence.address_blocked_decision',
        decision_id: 'dec-blocked-001',
        action: 'clear',
      }),
    );
    comp.unmount();
  });

  it('Escalate action calls startMeeting IPC', async () => {
    const { intelligenceIpc } = await import('../../../../src/intelligence/ipc.js');
    const onRequest = vi.fn();
    const decision = makeBlockedDecision();
    const comp = createMicroMeetingModal(decision, onRequest);
    const div = document.createElement('div');
    comp.mount(div);
    comp.open();

    const escalateRadio = div.querySelector('input[value="escalate"]') as HTMLInputElement;
    escalateRadio.checked = true;
    escalateRadio.dispatchEvent(new Event('change', { bubbles: true }));

    const sendBtn = div.querySelector('.modal-send-btn') as HTMLButtonElement;
    sendBtn.click();
    await new Promise(r => setTimeout(r, 30));

    expect(intelligenceIpc.startMeeting).toHaveBeenCalledWith('proj-1', expect.any(String));
    comp.unmount();
  });

  it('Dismiss with rationale includes rationale in request', async () => {
    const onRequest = vi.fn();
    const decision = makeBlockedDecision();
    const comp = createMicroMeetingModal(decision, onRequest);
    const div = document.createElement('div');
    comp.mount(div);
    comp.open();

    const dismissRadio = div.querySelector('input[value="dismiss"]') as HTMLInputElement;
    dismissRadio.checked = true;
    dismissRadio.dispatchEvent(new Event('change', { bubbles: true }));

    await new Promise(r => setTimeout(r, 10)); // wait for re-render

    const rationaleInput = div.querySelector('.dismiss-rationale-input') as HTMLTextAreaElement | HTMLInputElement;
    rationaleInput.value = 'Not critical for this sprint';
    rationaleInput.dispatchEvent(new Event('input', { bubbles: true }));

    const sendBtn = div.querySelector('.modal-send-btn') as HTMLButtonElement;
    sendBtn.click();
    await new Promise(r => setTimeout(r, 20));

    expect(onRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'dismiss',
        rationale: 'Not critical for this sprint',
      }),
    );
    comp.unmount();
  });

  it('Cancel button closes modal without emitting request', async () => {
    const onRequest = vi.fn();
    const decision = makeBlockedDecision();
    const comp = createMicroMeetingModal(decision, onRequest);
    const div = document.createElement('div');
    comp.mount(div);
    comp.open();

    const cancelBtn = div.querySelector('.modal-cancel-btn') as HTMLButtonElement;
    cancelBtn.click();
    await new Promise(r => setTimeout(r, 20));

    expect(onRequest).not.toHaveBeenCalled();
    // Dialog should be closed
    const dialog = div.querySelector('dialog');
    expect(dialog?.hasAttribute('open')).toBe(false);
    comp.unmount();
  });

  it('Escape key closes modal', async () => {
    const decision = makeBlockedDecision();
    const comp = createMicroMeetingModal(decision);
    const div = document.createElement('div');
    comp.mount(div);
    comp.open();

    const dialog = div.querySelector('dialog') as HTMLDialogElement;
    expect(dialog.hasAttribute('open')).toBe(true);

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await new Promise(r => setTimeout(r, 10));

    expect(dialog.hasAttribute('open')).toBe(false);
    comp.unmount();
  });
});
