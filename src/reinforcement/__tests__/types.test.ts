/**
 * MA-6: type-layer tests — taxonomy, helpers, and the `r()` scalar extractor.
 */

import { describe, it, expect } from 'vitest';
import {
  REINFORCEMENT_CHANNELS,
  clampMagnitude,
  directionFromMagnitude,
  isReinforcementChannel,
  r,
  type ReinforcementChannel,
  type ReinforcementEvent,
} from '../../types/reinforcement.js';

describe('REINFORCEMENT_CHANNELS', () => {
  it('enumerates exactly the five canonical channels', () => {
    expect(REINFORCEMENT_CHANNELS).toEqual([
      'explicit_correction',
      'outcome_observed',
      'branch_resolved',
      'surprise_triggered',
      'quintessence_updated',
    ]);
  });
});

describe('isReinforcementChannel', () => {
  it('accepts each canonical channel', () => {
    for (const c of REINFORCEMENT_CHANNELS) {
      expect(isReinforcementChannel(c)).toBe(true);
    }
  });
  it('rejects non-canonical strings', () => {
    expect(isReinforcementChannel('test-pass')).toBe(false);
    expect(isReinforcementChannel('undo')).toBe(false);
  });
  it('rejects non-string values', () => {
    expect(isReinforcementChannel(1)).toBe(false);
    expect(isReinforcementChannel(null)).toBe(false);
    expect(isReinforcementChannel(undefined)).toBe(false);
  });
});

describe('clampMagnitude', () => {
  it('clamps to [-1, 1]', () => {
    expect(clampMagnitude(2)).toBe(1);
    expect(clampMagnitude(-2)).toBe(-1);
    expect(clampMagnitude(0.5)).toBe(0.5);
    expect(clampMagnitude(-0.5)).toBe(-0.5);
    expect(clampMagnitude(0)).toBe(0);
  });
  it('coerces non-finite to 0', () => {
    expect(clampMagnitude(NaN)).toBe(0);
    expect(clampMagnitude(Infinity)).toBe(0);
    expect(clampMagnitude(-Infinity)).toBe(0);
  });
});

describe('directionFromMagnitude', () => {
  it('maps by sign', () => {
    expect(directionFromMagnitude(0.5)).toBe('positive');
    expect(directionFromMagnitude(-0.5)).toBe('negative');
    expect(directionFromMagnitude(0)).toBe('neutral');
    expect(directionFromMagnitude(1)).toBe('positive');
    expect(directionFromMagnitude(-1)).toBe('negative');
  });
});

describe('r()', () => {
  it('returns the magnitude directly (Barto 1983 Eq. 2 scalar)', () => {
    const event: ReinforcementEvent = {
      id: 'x',
      ts: 0,
      channel: 'outcome_observed',
      value: { magnitude: 0.75, direction: 'positive' },
      actor: 'test',
      metadata: { outcomeKind: 'test-pass' },
    };
    expect(r(event)).toBe(0.75);
  });
  it('preserves sign', () => {
    const event: ReinforcementEvent = {
      id: 'x',
      ts: 0,
      channel: 'explicit_correction',
      value: { magnitude: -1, direction: 'negative' },
      actor: 'test',
      metadata: {},
    };
    expect(r(event)).toBe(-1);
  });
});

describe('channel discriminator type narrowing (compile-time)', () => {
  it('narrows metadata per channel', () => {
    const e: ReinforcementEvent = {
      id: 'x',
      ts: 0,
      channel: 'branch_resolved',
      value: { magnitude: 1, direction: 'positive' },
      actor: 'test',
      metadata: { branchId: 'b1', resolution: 'committed' },
    };
    if (e.channel === 'branch_resolved') {
      // Type test: metadata narrowed to BranchResolvedMetadata
      expect(e.metadata.resolution).toBe('committed');
      expect(e.metadata.branchId).toBe('b1');
    }
  });
  it('exhaustive switch hits all five channels', () => {
    const seen = new Set<ReinforcementChannel>();
    for (const c of REINFORCEMENT_CHANNELS) {
      switch (c) {
        case 'explicit_correction':
        case 'outcome_observed':
        case 'branch_resolved':
        case 'surprise_triggered':
        case 'quintessence_updated':
          seen.add(c);
          break;
      }
    }
    expect(seen.size).toBe(5);
  });
});
