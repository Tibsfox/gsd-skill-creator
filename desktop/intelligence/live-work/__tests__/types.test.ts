/**
 * Phase 824 / C09 T2 — DecisionUIState + pillFor mapping tests.
 */

import { describe, it, expect } from 'vitest';
import { pillFor } from '../types.js';
import type { DecisionUIState } from '../types.js';

const ALL_STATES: DecisionUIState[] = [
  'queued', 'picked_up', 'expanding', 'wave_0', 'wave_1',
  'wave_2', 'wave_n', 'blocked', 'complete', 'failed',
];

describe('pillFor', () => {
  it('returns a defined descriptor for every state', () => {
    for (const state of ALL_STATES) {
      const pill = pillFor(state);
      expect(pill.label).toBeTruthy();
      expect(pill.cssClass).toBeTruthy();
      expect(pill.sub_status_template).toBeDefined();
    }
  });

  it('queued → pill-queued, label "queued"', () => {
    const p = pillFor('queued');
    expect(p.cssClass).toBe('pill-queued');
    expect(p.label).toBe('queued');
  });

  it('all in-progress states → pill-progress', () => {
    const inProgress: DecisionUIState[] = ['picked_up', 'expanding', 'wave_0', 'wave_1', 'wave_2', 'wave_n'];
    for (const state of inProgress) {
      expect(pillFor(state).cssClass).toBe('pill-progress');
      expect(pillFor(state).label).toBe('in progress');
    }
  });

  it('blocked → pill-blocked, label "blocked"', () => {
    const p = pillFor('blocked');
    expect(p.cssClass).toBe('pill-blocked');
    expect(p.label).toBe('blocked');
    expect(p.sub_status_template).toContain('{block_reason}');
  });

  it('complete → pill-complete, label "complete"', () => {
    const p = pillFor('complete');
    expect(p.cssClass).toBe('pill-complete');
    expect(p.label).toBe('complete');
  });

  it('failed → pill-failed, label "failed"', () => {
    const p = pillFor('failed');
    expect(p.cssClass).toBe('pill-failed');
    expect(p.label).toBe('failed');
  });

  it('wave_1 template includes wave reference', () => {
    const p = pillFor('wave_1');
    expect(p.sub_status_template).toContain('Wave 1');
  });

  it('wave_n template includes Wave N reference', () => {
    const p = pillFor('wave_n');
    expect(p.sub_status_template).toContain('Wave N');
  });
});
