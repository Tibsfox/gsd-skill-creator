/**
 * Experience Compression Spectrum tests — Phase 713 (v1.49.570).
 *
 * Validates analyzeTransition (promote/demote/hold across the 3-level spectrum),
 * estimateRatio, buildTransitionEvent, analyzeSpectrum (with diagonalHealth
 * entropy metric), isLevelPromotion/isLevelDemotion helpers.
 *
 * Covers: CONV-16, CONV-17.
 */

import { describe, it, expect } from 'vitest';
import {
  analyzeTransition,
  estimateRatio,
  buildTransitionEvent,
  analyzeSpectrum,
  getDefaultTransitionThresholds,
  isLevelPromotion,
  isLevelDemotion,
  SHEN_RATIO_RANGES,
  DEFAULT_THRESHOLDS,
  LEVEL_RANK,
} from '../index.js';
import type { CompressedItem, TransitionInputs } from '../index.js';

function buildInputs(item: CompressedItem): TransitionInputs {
  return { item, ...DEFAULT_THRESHOLDS };
}

function buildItem(overrides: Partial<CompressedItem> = {}): CompressedItem {
  return {
    id: 'item-1',
    level: 'episodic',
    ratio: 10,
    usageCount: 0,
    staleDays: 0,
    tags: [],
    ...overrides,
  };
}

describe('compression-spectrum: constants', () => {
  it('SHEN_RATIO_RANGES matches published ranges', () => {
    expect(SHEN_RATIO_RANGES.episodic.min).toBe(5);
    expect(SHEN_RATIO_RANGES.episodic.max).toBe(20);
    expect(SHEN_RATIO_RANGES.procedural.min).toBe(50);
    expect(SHEN_RATIO_RANGES.procedural.max).toBe(500);
    expect(SHEN_RATIO_RANGES.declarative.min).toBe(1000);
  });

  it('LEVEL_RANK orders episodic < procedural < declarative', () => {
    expect(LEVEL_RANK.episodic).toBeLessThan(LEVEL_RANK.procedural);
    expect(LEVEL_RANK.procedural).toBeLessThan(LEVEL_RANK.declarative);
  });

  it('DEFAULT_THRESHOLDS match Shen-aligned values', () => {
    expect(DEFAULT_THRESHOLDS.promoteToProceduralThreshold).toBe(3);
    expect(DEFAULT_THRESHOLDS.promoteToDeclarativeThreshold).toBe(20);
    expect(DEFAULT_THRESHOLDS.demoteFromDeclarativeStaleDays).toBe(90);
    expect(DEFAULT_THRESHOLDS.demoteFromProceduralStaleDays).toBe(30);
  });
});

describe('compression-spectrum: estimateRatio', () => {
  it('returns geometric mean of Shen ratio range', () => {
    // episodic: sqrt(5*20) = 10
    expect(estimateRatio('episodic')).toBeCloseTo(10);
    // procedural: sqrt(50*500) = sqrt(25000) ~= 158.1
    expect(estimateRatio('procedural')).toBeCloseTo(Math.sqrt(25000), 1);
    // declarative: sqrt(1000*100000) = sqrt(1e8) = 10000
    expect(estimateRatio('declarative')).toBeCloseTo(10000);
  });
});

describe('compression-spectrum: analyzeTransition promotions', () => {
  it('promotes episodic → procedural when usageCount >= 3', () => {
    const d = analyzeTransition(buildInputs(buildItem({ level: 'episodic', usageCount: 3 })));
    expect(d.shouldTransition).toBe(true);
    expect(d.to).toBe('procedural');
    expect(d.direction).toBe('promote');
  });

  it('does not promote episodic when usageCount below threshold', () => {
    const d = analyzeTransition(buildInputs(buildItem({ level: 'episodic', usageCount: 2 })));
    expect(d.shouldTransition).toBe(false);
    expect(d.direction).toBe('hold');
  });

  it('promotes procedural → declarative when usageCount >= 20', () => {
    const d = analyzeTransition(buildInputs(buildItem({ level: 'procedural', usageCount: 25 })));
    expect(d.shouldTransition).toBe(true);
    expect(d.to).toBe('declarative');
    expect(d.direction).toBe('promote');
  });
});

describe('compression-spectrum: analyzeTransition demotions', () => {
  it('demotes declarative → procedural when staleDays >= 90', () => {
    const d = analyzeTransition(buildInputs(buildItem({ level: 'declarative', staleDays: 91 })));
    expect(d.shouldTransition).toBe(true);
    expect(d.to).toBe('procedural');
    expect(d.direction).toBe('demote');
  });

  it('demotes procedural → episodic when staleDays >= 30', () => {
    const d = analyzeTransition(buildInputs(buildItem({ level: 'procedural', staleDays: 30 })));
    expect(d.shouldTransition).toBe(true);
    expect(d.to).toBe('episodic');
    expect(d.direction).toBe('demote');
  });

  it('demotion takes precedence over promotion when both fire', () => {
    // Procedural item with high usage AND high stale-days — demote wins
    const d = analyzeTransition(buildInputs(buildItem({
      level: 'procedural',
      usageCount: 100,
      staleDays: 60,
    })));
    expect(d.direction).toBe('demote');
    expect(d.to).toBe('episodic');
  });

  it('episodic level cannot demote further (no level below)', () => {
    const d = analyzeTransition(buildInputs(buildItem({ level: 'episodic', staleDays: 999 })));
    expect(d.shouldTransition).toBe(false);
    expect(d.direction).toBe('hold');
  });
});

describe('compression-spectrum: buildTransitionEvent', () => {
  it('produces a well-typed transition event', () => {
    const item = buildItem({ level: 'episodic', usageCount: 5 });
    const d = analyzeTransition(buildInputs(item));
    const ev = buildTransitionEvent(d, item, '2026-04-23T00:00:00.000Z');
    expect(ev.type).toBe('compression-spectrum.transition');
    expect(ev.timestamp).toBe('2026-04-23T00:00:00.000Z');
    expect(ev.itemId).toBe(item.id);
    expect(ev.from).toBe('episodic');
    expect(ev.to).toBe('procedural');
    expect(ev.ratioAfter).toBeGreaterThan(ev.ratioBefore);
  });

  it('throws when called with a hold decision (no transition)', () => {
    const item = buildItem();
    const d = analyzeTransition(buildInputs(item));
    expect(() => buildTransitionEvent(d, item)).toThrow();
  });
});

describe('compression-spectrum: analyzeSpectrum', () => {
  it('returns zero distribution for empty input', () => {
    const r = analyzeSpectrum([]);
    expect(r.totalItems).toBe(0);
    expect(r.byLevel.episodic).toBe(0);
    expect(r.diagonalHealth).toBe(0);
  });

  it('counts items by level and computes average ratio', () => {
    const items: CompressedItem[] = [
      buildItem({ id: '1', level: 'episodic', ratio: 10 }),
      buildItem({ id: '2', level: 'episodic', ratio: 20 }),
      buildItem({ id: '3', level: 'procedural', ratio: 100 }),
      buildItem({ id: '4', level: 'declarative', ratio: 5000 }),
    ];
    const r = analyzeSpectrum(items);
    expect(r.totalItems).toBe(4);
    expect(r.byLevel.episodic).toBe(2);
    expect(r.byLevel.procedural).toBe(1);
    expect(r.byLevel.declarative).toBe(1);
    expect(r.averageRatio.episodic).toBe(15);
    expect(r.averageRatio.procedural).toBe(100);
    expect(r.averageRatio.declarative).toBe(5000);
  });

  it('diagonalHealth is 1 for perfectly even distribution across 3 levels', () => {
    const items: CompressedItem[] = [
      buildItem({ id: '1', level: 'episodic' }),
      buildItem({ id: '2', level: 'procedural' }),
      buildItem({ id: '3', level: 'declarative' }),
    ];
    const r = analyzeSpectrum(items);
    expect(r.diagonalHealth).toBeCloseTo(1, 3);
  });

  it('diagonalHealth is 0 when all items at one level (Shen pathology case)', () => {
    const items: CompressedItem[] = [
      buildItem({ id: '1', level: 'episodic' }),
      buildItem({ id: '2', level: 'episodic' }),
      buildItem({ id: '3', level: 'episodic' }),
    ];
    const r = analyzeSpectrum(items);
    expect(r.diagonalHealth).toBe(0);
  });

  it('diagonalHealth is intermediate for skewed distributions', () => {
    const items: CompressedItem[] = [
      buildItem({ id: '1', level: 'episodic' }),
      buildItem({ id: '2', level: 'episodic' }),
      buildItem({ id: '3', level: 'procedural' }),
    ];
    const r = analyzeSpectrum(items);
    expect(r.diagonalHealth).toBeGreaterThan(0);
    expect(r.diagonalHealth).toBeLessThan(1);
  });

  it('passes through recentTransitions for audit trail', () => {
    const transitions = [{
      type: 'compression-spectrum.transition' as const,
      timestamp: '2026-04-23T00:00:00.000Z',
      itemId: 'x', from: 'episodic' as const, to: 'procedural' as const,
      rationale: 'test', ratioBefore: 10, ratioAfter: 150,
    }];
    const r = analyzeSpectrum([], transitions);
    expect(r.recentTransitions).toHaveLength(1);
    expect(r.recentTransitions[0].itemId).toBe('x');
  });
});

describe('compression-spectrum: helpers', () => {
  it('isLevelPromotion returns true only when moving toward higher rank', () => {
    expect(isLevelPromotion('episodic', 'procedural')).toBe(true);
    expect(isLevelPromotion('procedural', 'declarative')).toBe(true);
    expect(isLevelPromotion('episodic', 'declarative')).toBe(true);
    expect(isLevelPromotion('procedural', 'episodic')).toBe(false);
    expect(isLevelPromotion('episodic', 'episodic')).toBe(false);
  });

  it('isLevelDemotion returns true only when moving toward lower rank', () => {
    expect(isLevelDemotion('procedural', 'episodic')).toBe(true);
    expect(isLevelDemotion('declarative', 'episodic')).toBe(true);
    expect(isLevelDemotion('episodic', 'procedural')).toBe(false);
  });

  it('getDefaultTransitionThresholds returns the DEFAULT_THRESHOLDS object', () => {
    const t = getDefaultTransitionThresholds();
    expect(t.promoteToProceduralThreshold).toBe(DEFAULT_THRESHOLDS.promoteToProceduralThreshold);
    expect(t.demoteFromDeclarativeStaleDays).toBe(DEFAULT_THRESHOLDS.demoteFromDeclarativeStaleDays);
  });
});
