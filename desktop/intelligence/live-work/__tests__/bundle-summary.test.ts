/**
 * Phase 824 / C09 T3 — Bundle summary card tests.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createBundleSummaryCard } from '../components/bundle-summary-card.js';
import type { InFlightBundle } from '../types.js';

vi.mock('../../../../src/intelligence/ipc.js', () => ({
  intelligenceIpc: {
    listProjects: vi.fn().mockResolvedValue([]),
    on: { statusUpdate: vi.fn().mockResolvedValue(() => {}) },
  },
}));

function makeBundle(overrides: Partial<InFlightBundle> = {}): InFlightBundle {
  return {
    id: 'B-001',
    project_id: 'proj-1',
    committed_at: new Date(Date.now() - 23 * 60 * 1000).toISOString(),
    decisions: [
      { id: 'd-1', bundle_id: 'B-001', project_id: 'proj-1', title: 'Snapshot diff', state: 'complete', updated_at: new Date().toISOString() },
      { id: 'd-2', bundle_id: 'B-001', project_id: 'proj-1', title: 'DACP coupling', state: 'wave_1', updated_at: new Date().toISOString() },
      { id: 'd-3', bundle_id: 'B-001', project_id: 'proj-1', title: 'Silicon perf', state: 'wave_0', updated_at: new Date().toISOString() },
      { id: 'd-4', bundle_id: 'B-001', project_id: 'proj-1', title: 'CAPCOM gate', state: 'blocked', block_reason: 'Safety audit failed', updated_at: new Date().toISOString() },
    ],
    ...overrides,
  };
}

describe('Bundle summary card', () => {
  it('renders bundle id in header', () => {
    const bundle = makeBundle();
    const comp = createBundleSummaryCard(bundle, 'proj-1');
    const div = document.createElement('div');
    comp.mount(div);
    expect(div.querySelector('.bundle-id')?.textContent).toContain('B-001');
    comp.unmount();
  });

  it('shows aggregate counts: 1 complete, 2 in progress, 1 blocked', () => {
    const bundle = makeBundle();
    const comp = createBundleSummaryCard(bundle, 'proj-1');
    const div = document.createElement('div');
    comp.mount(div);
    const aggregate = div.querySelector('.bundle-aggregate')?.textContent ?? '';
    expect(aggregate).toContain('1');   // complete count
    expect(aggregate).toContain('2');   // in progress count
    expect(aggregate).toContain('1');   // blocked count
    comp.unmount();
  });

  it('progress bar reflects 1/4 = 25% complete', () => {
    const bundle = makeBundle();
    const comp = createBundleSummaryCard(bundle, 'proj-1');
    const div = document.createElement('div');
    comp.mount(div);
    const bar = div.querySelector('.progress-bar-fill') as HTMLElement;
    expect(bar).not.toBeNull();
    // Width should be approximately 25%
    const width = parseInt(bar.style.width);
    expect(width).toBe(25);
    comp.unmount();
  });

  it('localStorage persists notify preference', () => {
    localStorage.clear();
    const bundle = makeBundle();
    const comp = createBundleSummaryCard(bundle, 'proj-1');
    const div = document.createElement('div');
    comp.mount(div);

    const checkbox = div.querySelector('.notify-checkbox') as HTMLInputElement;
    expect(checkbox).not.toBeNull();
    // Default: unchecked (no pref stored)
    expect(checkbox.checked).toBe(false);

    // In jsdom, click() toggles checked but doesn't always fire change event —
    // dispatch it explicitly to simulate real browser behaviour.
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    comp.unmount();

    // Remount — checkbox should remember checked state
    const comp2 = createBundleSummaryCard(bundle, 'proj-1');
    const div2 = document.createElement('div');
    comp2.mount(div2);
    const checkbox2 = div2.querySelector('.notify-checkbox') as HTMLInputElement;
    expect(checkbox2.checked).toBe(true);
    comp2.unmount();
    localStorage.clear();
  });

  it('notify checkbox calls Notification API when decision transitions to blocked', async () => {
    localStorage.setItem('notify-proj-1', 'true');

    const mockNotify = vi.fn();
    // Mock Notification constructor
    const OrigNotification = (globalThis as Record<string, unknown>).Notification;
    (globalThis as Record<string, unknown>).Notification = mockNotify;

    const bundle = makeBundle({
      decisions: [
        { id: 'd-1', bundle_id: 'B-001', project_id: 'proj-1', title: 'Test decision', state: 'wave_1', updated_at: new Date().toISOString() },
      ],
    });
    const comp = createBundleSummaryCard(bundle, 'proj-1');
    const div = document.createElement('div');
    comp.mount(div);

    // Simulate a decision transitioning to blocked via update
    comp.updateDecision('d-1', { state: 'blocked', block_reason: 'Gate failed' });
    await new Promise(r => setTimeout(r, 20));

    expect(mockNotify).toHaveBeenCalledOnce();
    comp.unmount();
    (globalThis as Record<string, unknown>).Notification = OrigNotification;
    localStorage.clear();
  });

  it('all decisions complete → bundle-complete CSS class applied', () => {
    const bundle = makeBundle({
      decisions: [
        { id: 'd-1', bundle_id: 'B-001', project_id: 'proj-1', title: 'D1', state: 'complete', updated_at: new Date().toISOString() },
        { id: 'd-2', bundle_id: 'B-001', project_id: 'proj-1', title: 'D2', state: 'complete', updated_at: new Date().toISOString() },
      ],
    });
    const comp = createBundleSummaryCard(bundle, 'proj-1');
    const div = document.createElement('div');
    comp.mount(div);
    expect(div.querySelector('.bundle-summary-card.bundle-complete')).not.toBeNull();
    comp.unmount();
  });
});
