/**
 * HB-02 AgentDoG — `What` axis tests.
 */

import { describe, it, expect } from 'vitest';
import {
  BLAST_RADII,
  captureWhatAxis,
  clipAssetLabel,
  IMPACTED_ASSET_MAX_LEN,
} from '../what.js';

describe('AgentDoG — What axis', () => {
  it('enumerates the four blast-radius tiers exactly', () => {
    expect(new Set(BLAST_RADII)).toEqual(
      new Set(['session', 'project', 'cross-session', 'cross-project']),
    );
  });

  it('captures impacted asset label + blast radius verbatim', () => {
    const w = captureWhatAxis({
      impactedAsset: '.git',
      blastRadius: 'project',
    });
    expect(w.impactedAsset).toBe('.git');
    expect(w.blastRadius).toBe('project');
  });

  it('clips long asset labels to bound (privacy guard)', () => {
    const longLabel = 'A'.repeat(IMPACTED_ASSET_MAX_LEN + 50);
    const w = captureWhatAxis({ impactedAsset: longLabel, blastRadius: 'session' });
    expect(w.impactedAsset.length).toBe(IMPACTED_ASSET_MAX_LEN);
    expect(clipAssetLabel(longLabel).length).toBe(IMPACTED_ASSET_MAX_LEN);
  });

  it('falls back to "session" blast radius on unknown values', () => {
    const w = captureWhatAxis({ impactedAsset: 'x', blastRadius: 'galactic' });
    expect(w.blastRadius).toBe('session');
  });

  it('falls back to empty asset label + session radius on missing inputs', () => {
    const w = captureWhatAxis({});
    expect(w.impactedAsset).toBe('');
    expect(w.blastRadius).toBe('session');
  });

  it('captured axis is frozen (immutable)', () => {
    const w = captureWhatAxis({ impactedAsset: 'x', blastRadius: 'session' });
    expect(Object.isFrozen(w)).toBe(true);
  });
});
