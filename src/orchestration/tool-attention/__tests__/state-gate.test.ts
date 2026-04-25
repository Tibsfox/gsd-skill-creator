import { describe, it, expect } from 'vitest';
import { withFlag } from './_fixtures.js';
import { applyStateGate, DEFAULT_GATE_CONFIG } from '../state-gate.js';
import type { IsoScoreOutput } from '../types.js';

function fakeIso(names: string[], pinnedNames: string[] = []): IsoScoreOutput {
  return {
    ranked: names.map((n, i) => ({
      name: n,
      score: 1.0 - i * 0.01,
      pinned: pinnedNames.includes(n),
    })),
    intentEmbedding: [0],
  };
}

describe('HB-01 state-gate — phase-conditional top-k', () => {
  it('is byte-identically disabled with flag off', () => {
    const env = withFlag(false);
    try {
      const out = applyStateGate(fakeIso(['a']), 'planning', DEFAULT_GATE_CONFIG, env.configPath);
      expect(out).toEqual({ selected: [], effectiveTopK: 0, pinnedSurvivors: [], disabled: true });
    } finally { env.cleanup(); }
  });

  it('selects different top-k under different phases', () => {
    const env = withFlag(true);
    try {
      const iso = fakeIso(Array.from({ length: 30 }, (_, i) => `t${i}`));
      const planning = applyStateGate(iso, 'planning', DEFAULT_GATE_CONFIG, env.configPath);
      const executing = applyStateGate(iso, 'executing', DEFAULT_GATE_CONFIG, env.configPath);
      if ('disabled' in planning || 'disabled' in executing) throw new Error('expected enabled');
      expect(planning.effectiveTopK).toBe(12);
      expect(executing.effectiveTopK).toBe(8);
      expect(planning.selected.length).toBeGreaterThan(executing.selected.length);
    } finally { env.cleanup(); }
  });

  it('respects maxTopK ceiling', () => {
    const env = withFlag(true);
    try {
      const iso = fakeIso(Array.from({ length: 100 }, (_, i) => `t${i}`));
      const out = applyStateGate(iso, 'planning', { defaultTopK: 5, maxTopK: 3 }, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.effectiveTopK).toBe(3);
      expect(out.selected.length).toBe(3);
    } finally { env.cleanup(); }
  });

  it('phase-pinned tools survive even at low rank', () => {
    const env = withFlag(true);
    try {
      const iso = fakeIso(['top', 'mid', 'low'], ['low']);
      const out = applyStateGate(iso, 'planning', { defaultTopK: 1, maxTopK: 24 }, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      // Pin must survive even when topK=1.
      expect(out.pinnedSurvivors).toEqual(['low']);
      expect(out.selected).toContain('low');
    } finally { env.cleanup(); }
  });

  it('falls back to defaultTopK when phase has no override', () => {
    const env = withFlag(true);
    try {
      const iso = fakeIso(Array.from({ length: 20 }, (_, i) => `t${i}`));
      const out = applyStateGate(iso, 'unknown', { defaultTopK: 5, maxTopK: 50 }, env.configPath);
      if ('disabled' in out) throw new Error('expected enabled');
      expect(out.effectiveTopK).toBe(5);
    } finally { env.cleanup(); }
  });

  it('returns disabled when ISO output is disabled', () => {
    const env = withFlag(true);
    try {
      const isoDisabled = { ranked: [] as never[], intentEmbedding: [] as never[], disabled: true } as const;
      const out = applyStateGate(isoDisabled, 'planning', DEFAULT_GATE_CONFIG, env.configPath);
      expect('disabled' in out && out.disabled).toBe(true);
    } finally { env.cleanup(); }
  });
});
