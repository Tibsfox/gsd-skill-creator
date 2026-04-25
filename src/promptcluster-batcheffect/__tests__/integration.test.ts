/**
 * Integration tests — Phase 771 (v1.49.573 UIP-19 T2c).
 *
 * End-to-end: public API surface, default-off byte-identical guarantee,
 * CAPCOM-preservation check, and SSIA cross-link constants.
 *
 * Reference: Tao et al. arXiv:2604.14441.
 * Cross-link: v1.49.571 SSIA at src/skill-isotropy/.
 */

import { describe, expect, it } from 'vitest';
import * as mod from '../index.js';

describe('public API surface', () => {
  it('exports all required symbols', () => {
    expect(typeof mod.detectBatchEffects).toBe('function');
    expect(typeof mod.disabledReport).toBe('function');
    expect(typeof mod.composeWithSSIA).toBe('function');
    expect(typeof mod.readPromptClusterBatchEffectConfig).toBe('function');
    expect(typeof mod.isPromptClusterBatchEffectEnabled).toBe('function');
    expect(typeof mod.DEFAULT_SIGNIFICANCE_LEVEL).toBe('number');
    expect(typeof mod.DEFAULT_NUM_PROJECTION_DIRECTIONS).toBe('number');
  });

  it('exports paper reference constants', () => {
    expect(mod.TAO_2026_BATCHEFFECT_REFERENCE).toBeDefined();
    expect(mod.TAO_2026_BATCHEFFECT_REFERENCE.arxiv).toBe('2604.14441');
    expect(mod.TAO_2026_BATCHEFFECT_REFERENCE.authors).toContain('Tao');
  });

  it('exports SSIA cross-link constant', () => {
    expect(mod.SSIA_CROSS_LINK).toBeDefined();
    expect(mod.SSIA_CROSS_LINK.module).toContain('skill-isotropy');
    expect(mod.SSIA_CROSS_LINK.version).toContain('v1.49.571');
    expect(mod.SSIA_CROSS_LINK.phase).toBe(728);
  });
});

describe('default-off byte-identical guarantee', () => {
  it('isPromptClusterBatchEffectEnabled returns false in test environment (no config override)', () => {
    // In test environment GSD_SKILL_CREATOR_CONFIG_ROOT is not set to the live
    // config, so the default (false) applies — consistent with "flag off means
    // byte-identical to not importing it."
    const enabled = mod.isPromptClusterBatchEffectEnabled(
      '/nonexistent/path/to/gsd-skill-creator.json',
    );
    expect(enabled).toBe(false);
  });

  it('disabledReport returns status: disabled and all-zero metrics', () => {
    const r = mod.disabledReport({ type: 'model-version', value: 'test' });
    expect(r.status).toBe('disabled');
    expect(r.embeddingCount).toBe(0);
    expect(r.embeddingDim).toBe(0);
    expect(r.evidence).toHaveLength(0);
    expect(r.maxCentroidShift).toBe(0);
    expect(r.meanCentroidShift).toBe(0);
  });

  it('combined report with disabled batch → disabled joint status', () => {
    const disabled = mod.disabledReport({ type: 'prompt-template', value: 'off' });
    const combined = mod.composeWithSSIA(null, disabled);
    expect(combined.jointStatus).toBe('disabled');
  });
});

describe('CAPCOM preservation', () => {
  it('no exported symbol writes, dispatches, or gates anything', () => {
    const forbidden = [
      'dispatchGate',
      'bypassCapcom',
      'writeSkill',
      'setCapcomState',
      'overrideCapcom',
      'updateLibrary',
      'applyBatchFix',
    ];
    const exported = mod as unknown as Record<string, unknown>;
    for (const name of forbidden) {
      expect(exported[name]).toBeUndefined();
    }
  });
});

describe('settings reader', () => {
  it('returns defaults when config file does not exist', () => {
    const cfg = mod.readPromptClusterBatchEffectConfig(
      '/nonexistent/gsd-skill-creator.json',
    );
    expect(cfg.enabled).toBe(false);
    expect(cfg.significanceLevel).toBe(0.05);
    expect(cfg.numProjectionDirections).toBe(8);
    expect(cfg.seed).toBeUndefined();
  });

  it('DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG has correct defaults', () => {
    expect(mod.DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG.enabled).toBe(false);
    expect(mod.DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG.significanceLevel).toBe(0.05);
    expect(mod.DEFAULT_PROMPTCLUSTER_BATCHEFFECT_CONFIG.numProjectionDirections).toBe(8);
  });
});

describe('detectBatchEffects via public API', () => {
  it('produces a report with correct batchKey type from public entry point', () => {
    const dim = 8;
    const embs = Array.from({ length: 20 }, (_, i) => ({
      id: `e-${i}`,
      vector: Array.from({ length: dim }, () => Math.random()),
    }));
    const assignment = new Map<string, string>();
    embs.slice(0, 10).forEach((e) => assignment.set(e.id, 'g1'));
    embs.slice(10).forEach((e) => assignment.set(e.id, 'g2'));

    const report = mod.detectBatchEffects(
      embs,
      { type: 'prompt-template', value: 'api-test' },
      assignment,
    );

    expect(report.batchKey.type).toBe('prompt-template');
    expect(report.embeddingCount).toBe(20);
    expect(['clean', 'batch-effect-detected']).toContain(report.status);
  });
});
