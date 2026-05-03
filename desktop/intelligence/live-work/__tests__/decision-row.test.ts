/**
 * Phase 824 / C09 T4 — Decision row + timeline indicator tests.
 */

import { describe, it, expect, vi } from 'vitest';
import { createDecisionRow } from '../components/decision-row.js';
import type { InFlightDecision, DecisionUIState } from '../types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    startMeeting: vi.fn().mockRejectedValue(new Error('stub')),
    on: { statusUpdate: vi.fn().mockResolvedValue(() => {}) },
  },
}));

function makeDecision(state: DecisionUIState, overrides: Partial<InFlightDecision> = {}): InFlightDecision {
  return {
    id: 'dec-001',
    bundle_id: 'B-001',
    project_id: 'proj-1',
    title: 'Investigate DACP coupling spike',
    state,
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

describe('Decision row — pill rendering', () => {
  const states: DecisionUIState[] = ['queued', 'picked_up', 'expanding', 'wave_0', 'wave_1', 'wave_2', 'wave_n', 'blocked', 'complete', 'failed'];

  for (const state of states) {
    it(`renders correct pill for state: ${state}`, () => {
      const comp = createDecisionRow(makeDecision(state), vi.fn());
      const div = document.createElement('div');
      comp.mount(div);
      const pill = div.querySelector('.pill');
      expect(pill).not.toBeNull();
      expect(pill?.className).toMatch(/pill-/);
      comp.unmount();
    });
  }
});

describe('Decision row — action buttons', () => {
  it('shows "Address ↗" only for blocked state', () => {
    const blockedComp = createDecisionRow(makeDecision('blocked', { block_reason: 'Gate failed', block_findings: [] }), vi.fn());
    const div = document.createElement('div');
    blockedComp.mount(div);
    expect(div.querySelector('.address-btn')).not.toBeNull();
    blockedComp.unmount();

    // Non-blocked state should NOT have address button
    const progressComp = createDecisionRow(makeDecision('wave_1'), vi.fn());
    const div2 = document.createElement('div');
    progressComp.mount(div2);
    expect(div2.querySelector('.address-btn')).toBeNull();
    progressComp.unmount();
  });

  it('"Open result ↗" only shown for complete with result_path', () => {
    const completeWithPath = createDecisionRow(
      makeDecision('complete', { result_path: '/path/to/result.md' }),
      vi.fn(),
    );
    const div = document.createElement('div');
    completeWithPath.mount(div);
    expect(div.querySelector('.open-result-btn')).not.toBeNull();
    completeWithPath.unmount();

    // Complete without result_path — no button
    const completeNoPath = createDecisionRow(makeDecision('complete'), vi.fn());
    const div2 = document.createElement('div');
    completeNoPath.mount(div2);
    expect(div2.querySelector('.open-result-btn')).toBeNull();
    completeNoPath.unmount();
  });

  it('"View ↗" button visible for wave_*, blocked, complete states', () => {
    for (const state of ['wave_0', 'wave_1', 'wave_2', 'wave_n', 'blocked', 'complete'] as DecisionUIState[]) {
      const comp = createDecisionRow(makeDecision(state), vi.fn());
      const div = document.createElement('div');
      comp.mount(div);
      expect(div.querySelector('.view-btn')).not.toBeNull();
      comp.unmount();
    }
  });

  it('"Address ↗" button calls onAddress callback', () => {
    const onAddress = vi.fn();
    const comp = createDecisionRow(
      makeDecision('blocked', { block_reason: 'Test block', block_findings: ['F-001'] }),
      onAddress,
    );
    const div = document.createElement('div');
    comp.mount(div);
    (div.querySelector('.address-btn') as HTMLButtonElement).click();
    expect(onAddress).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'dec-001', state: 'blocked' }),
    );
    comp.unmount();
  });
});

describe('Timeline indicator', () => {
  it('renders 4 stages total', () => {
    const comp = createDecisionRow(makeDecision('wave_1'), vi.fn());
    const div = document.createElement('div');
    comp.mount(div);
    const stages = div.querySelectorAll('.timeline-stage');
    expect(stages.length).toBe(4);
    comp.unmount();
  });

  it('wave_1 fills 2 stages', () => {
    const comp = createDecisionRow(makeDecision('wave_1'), vi.fn());
    const div = document.createElement('div');
    comp.mount(div);
    const filled = div.querySelectorAll('.timeline-stage.filled');
    expect(filled.length).toBe(2);
    comp.unmount();
  });

  it('wave_0 fills 1 stage', () => {
    const comp = createDecisionRow(makeDecision('wave_0'), vi.fn());
    const div = document.createElement('div');
    comp.mount(div);
    const filled = div.querySelectorAll('.timeline-stage.filled');
    expect(filled.length).toBe(1);
    comp.unmount();
  });

  it('complete fills all 4 stages', () => {
    const comp = createDecisionRow(makeDecision('complete'), vi.fn());
    const div = document.createElement('div');
    comp.mount(div);
    const filled = div.querySelectorAll('.timeline-stage.filled');
    expect(filled.length).toBe(4);
    comp.unmount();
  });

  it('queued fills 0 stages', () => {
    const comp = createDecisionRow(makeDecision('queued'), vi.fn());
    const div = document.createElement('div');
    comp.mount(div);
    const filled = div.querySelectorAll('.timeline-stage.filled');
    expect(filled.length).toBe(0);
    comp.unmount();
  });
});

describe('Decision row — live update', () => {
  it('status update triggers row re-render within 100ms', async () => {
    const comp = createDecisionRow(makeDecision('wave_0'), vi.fn());
    const div = document.createElement('div');
    comp.mount(div);

    const before = div.querySelector('.pill')?.textContent;

    const start = performance.now();
    comp.update({ state: 'blocked', block_reason: 'Gate check failed' });
    const elapsed = performance.now() - start;

    expect(elapsed).toBeLessThan(100);
    const after = div.querySelector('.pill')?.textContent;
    expect(after).not.toBe(before);
    expect(after).toContain('blocked');
    comp.unmount();
  });
});
