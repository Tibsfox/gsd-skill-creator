/**
 * HB-01 — flag-off byte-identical invariant.
 *
 * With `cs25-26-sweep.tool-attention.enabled === false` every public surface
 * returns a stable, frozen disabled-result sentinel byte-identical to the
 * pre-v1.49.575 behavior (no schema pruning, no ISO ranking, no budget
 * monitoring side-effects). This test pins the JSON-canonical shape of every
 * disabled-result so any future change is intentional and reviewed.
 */

import { describe, it, expect } from 'vitest';
import { withFlag } from './_fixtures.js';
import {
  computeIsoScore,
  applyStateGate,
  lazyLoadSchemas,
  checkBudget,
  runToolAttentionPipeline,
  DEFAULT_GATE_CONFIG,
  isToolAttentionEnabled,
} from '../index.js';
import type { CompactToolEntry, IsoScoreOutput, GateOutput } from '../types.js';

const ANY_INTENT = [0.1, 0.2, 0.3];
const ANY_COMPACT: CompactToolEntry[] = [
  { name: 't1', shortDescription: 'd1', compactTokens: 5, fullSchemaTokens: 50 },
];
const ANY_FAKE_GATE: GateOutput = { selected: ['t1'], effectiveTopK: 1, pinnedSurvivors: [] };
const ANY_FAKE_ISO: IsoScoreOutput = {
  ranked: [{ name: 't1', score: 1, pinned: false }],
  intentEmbedding: [0],
};

describe('HB-01 flag-off byte-identical invariant', () => {
  it('isToolAttentionEnabled returns false with flag off and with missing config', () => {
    const env = withFlag(false);
    try {
      expect(isToolAttentionEnabled(env.configPath)).toBe(false);
    } finally { env.cleanup(); }
    expect(isToolAttentionEnabled('/tmp/never-exists/cfg.json')).toBe(false);
  });

  it('all primitives produce stable disabled-result sentinels with flag off', () => {
    const env = withFlag(false);
    try {
      expect(computeIsoScore([], ANY_INTENT, 'planning', env.configPath))
        .toEqual({ ranked: [], intentEmbedding: [], disabled: true });

      expect(applyStateGate(ANY_FAKE_ISO, 'planning', DEFAULT_GATE_CONFIG, env.configPath))
        .toEqual({ selected: [], effectiveTopK: 0, pinnedSurvivors: [], disabled: true });

      expect(lazyLoadSchemas(ANY_COMPACT, ANY_FAKE_GATE, () => ({ x: 1 }), env.configPath))
        .toEqual({ compactPool: [], fullSchemas: [], totalTokens: 0, disabled: true });

      expect(checkBudget({ occupancyTokens: 999, contextWindowTokens: 1000 }, env.configPath))
        .toEqual({
          occupancyTokens: 0, contextWindowTokens: 0, occupancyRatio: 0,
          fractureAlert: false, fractureThreshold: 0, disabled: true,
        });
    } finally { env.cleanup(); }
  });

  it('JSON-canonical disabled-result shapes match v1.49.575 fixture strings', () => {
    const env = withFlag(false);
    try {
      expect(JSON.stringify(computeIsoScore([], ANY_INTENT, 'planning', env.configPath)))
        .toBe('{"ranked":[],"intentEmbedding":[],"disabled":true}');

      expect(JSON.stringify(applyStateGate(ANY_FAKE_ISO, 'planning', DEFAULT_GATE_CONFIG, env.configPath)))
        .toBe('{"selected":[],"effectiveTopK":0,"pinnedSurvivors":[],"disabled":true}');

      expect(JSON.stringify(lazyLoadSchemas(ANY_COMPACT, ANY_FAKE_GATE, () => ({ x: 1 }), env.configPath)))
        .toBe('{"compactPool":[],"fullSchemas":[],"totalTokens":0,"disabled":true}');

      expect(JSON.stringify(checkBudget({ occupancyTokens: 999, contextWindowTokens: 1000 }, env.configPath)))
        .toBe('{"occupancyTokens":0,"contextWindowTokens":0,"occupancyRatio":0,"fractureAlert":false,"fractureThreshold":0,"disabled":true}');
    } finally { env.cleanup(); }
  });

  it('pipeline-level composer reports disabled=true when flag off', () => {
    const env = withFlag(false);
    try {
      const out = runToolAttentionPipeline({
        sidecars: [],
        compactCorpus: ANY_COMPACT,
        intentEmbedding: ANY_INTENT,
        phase: 'planning',
        resolveFullSchema: () => ({ x: 1 }),
        settingsPath: env.configPath,
      });
      expect(out.disabled).toBe(true);
      expect((out.iso as { disabled?: boolean }).disabled).toBe(true);
      expect((out.gate as { disabled?: boolean }).disabled).toBe(true);
      expect((out.load as { disabled?: boolean }).disabled).toBe(true);
      expect((out.budget as { disabled?: boolean }).disabled).toBe(true);
    } finally { env.cleanup(); }
  });

  it('repeated calls yield identical disabled-results (no per-call drift)', () => {
    const env = withFlag(false);
    try {
      const a = computeIsoScore([], ANY_INTENT, 'planning', env.configPath);
      const b = computeIsoScore([], ANY_INTENT, 'planning', env.configPath);
      expect(JSON.stringify(a)).toBe(JSON.stringify(b));
      const c = applyStateGate(ANY_FAKE_ISO, 'planning', DEFAULT_GATE_CONFIG, env.configPath);
      const d = applyStateGate(ANY_FAKE_ISO, 'planning', DEFAULT_GATE_CONFIG, env.configPath);
      expect(JSON.stringify(c)).toBe(JSON.stringify(d));
    } finally { env.cleanup(); }
  });

  it('malformed config file falls back to disabled', () => {
    // Write a malformed JSON file and assert disabled.
    const env = withFlag(false);
    try {
      // Overwrite with garbage.
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const fs = require('node:fs') as typeof import('node:fs');
      fs.writeFileSync(env.configPath, 'not-json{');
      expect(isToolAttentionEnabled(env.configPath)).toBe(false);
    } finally { env.cleanup(); }
  });
});
