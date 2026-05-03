/**
 * Phase 824 / C09 T9 — Accessibility tests for live work UI.
 */

import { describe, it, expect, vi } from 'vitest';
import { createLiveWorkView } from '../components/live-work-view.js';
import { createMicroMeetingModal } from '../components/micro-meeting-modal.js';
import type { InFlightBundle, InFlightDecision } from '../types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    startMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    on: { statusUpdate: vi.fn().mockResolvedValue(() => {}) },
  },
}));

function makeBundle(): InFlightBundle {
  return {
    id: 'B-001',
    project_id: 'proj-1',
    committed_at: new Date(Date.now() - 60000).toISOString(),
    decisions: [
      {
        id: 'd-001', bundle_id: 'B-001', project_id: 'proj-1',
        title: 'Investigate coupling', state: 'blocked',
        block_reason: 'Gate failed', block_findings: ['F-001'],
        updated_at: new Date().toISOString(),
      },
    ],
  };
}

function makeBlockedDecision(): InFlightDecision {
  return {
    id: 'dec-001', bundle_id: 'B-001', project_id: 'proj-1',
    title: 'Clear CAPCOM gate', state: 'blocked',
    block_reason: 'Safety audit failed', block_findings: [],
    updated_at: new Date().toISOString(),
  };
}

describe('Live work accessibility', () => {
  it('notify checkbox has aria-label', () => {
    const comp = createLiveWorkView('proj-1', [makeBundle()]);
    const div = document.createElement('div');
    comp.mount(div);

    const checkbox = div.querySelector('.notify-checkbox');
    expect(checkbox?.getAttribute('aria-label')).toBeTruthy();
    comp.unmount();
  });

  it('progress bar has role=progressbar with aria-valuenow', () => {
    const comp = createLiveWorkView('proj-1', [makeBundle()]);
    const div = document.createElement('div');
    comp.mount(div);

    const bar = div.querySelector('[role="progressbar"]');
    expect(bar).not.toBeNull();
    expect(bar?.getAttribute('aria-valuenow')).toBeTruthy();
    comp.unmount();
  });

  it('address button has aria-label', () => {
    const comp = createLiveWorkView('proj-1', [makeBundle()]);
    const div = document.createElement('div');
    comp.mount(div);

    const addrBtn = div.querySelector('.address-btn');
    expect(addrBtn?.getAttribute('aria-label')).toBeTruthy();
    comp.unmount();
  });

  it('modal dialog has heading element', () => {
    const modal = createMicroMeetingModal(makeBlockedDecision());
    const div = document.createElement('div');
    modal.mount(div);
    modal.open();

    const heading = div.querySelector('dialog h3, dialog h2');
    expect(heading).not.toBeNull();
    modal.unmount();
  });

  it('timeline indicator has aria-label describing stage count', () => {
    const comp = createLiveWorkView('proj-1', [makeBundle()]);
    const div = document.createElement('div');
    comp.mount(div);

    const timeline = div.querySelector('.timeline-indicator');
    expect(timeline?.getAttribute('aria-label')).toBeTruthy();
    comp.unmount();
  });

  it('pill colors: blocked (#ff9e64) meets WCAG AA large text (≥3.0) against bg (#1a1b26)', () => {
    // --accent-orange: #ff9e64 on --bg-primary: #1a1b26
    function relativeLuminance(hex: string): number {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }
    function contrastRatio(fg: string, bg: string): number {
      const L1 = relativeLuminance(fg);
      const L2 = relativeLuminance(bg);
      const lighter = Math.max(L1, L2);
      const darker = Math.min(L1, L2);
      return (lighter + 0.05) / (darker + 0.05);
    }
    const ratio = contrastRatio('#ff9e64', '#1a1b26');
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });

  it('pill colors: complete (#9ece6a) meets WCAG AA large text (≥3.0) against bg (#1a1b26)', () => {
    function relativeLuminance(hex: string): number {
      const r = parseInt(hex.slice(1, 3), 16) / 255;
      const g = parseInt(hex.slice(3, 5), 16) / 255;
      const b = parseInt(hex.slice(5, 7), 16) / 255;
      const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
    }
    function contrastRatio(fg: string, bg: string): number {
      const L1 = relativeLuminance(fg);
      const L2 = relativeLuminance(bg);
      const lighter = Math.max(L1, L2);
      const darker = Math.min(L1, L2);
      return (lighter + 0.05) / (darker + 0.05);
    }
    const ratio = contrastRatio('#9ece6a', '#1a1b26');
    expect(ratio).toBeGreaterThanOrEqual(3.0);
  });
});
