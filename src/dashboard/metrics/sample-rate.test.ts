import { describe, it, expect } from 'vitest';
import {
  DEFAULT_TIER_CONFIG,
  DEFAULT_SECTION_TIERS,
  resolveSectionInterval,
  validateSampleRateConfig,
} from './sample-rate.js';
import { SampleTier, type SampleRateConfig } from './types.js';

// ============================================================================
// Default Tier Config
// ============================================================================

describe('DEFAULT_TIER_CONFIG', () => {
  it('hot tier intervalMs is between 1000-2000ms', () => {
    expect(DEFAULT_TIER_CONFIG.hot.intervalMs).toBeGreaterThanOrEqual(1000);
    expect(DEFAULT_TIER_CONFIG.hot.intervalMs).toBeLessThanOrEqual(2000);
  });

  it('warm tier intervalMs is between 5000-10000ms', () => {
    expect(DEFAULT_TIER_CONFIG.warm.intervalMs).toBeGreaterThanOrEqual(5000);
    expect(DEFAULT_TIER_CONFIG.warm.intervalMs).toBeLessThanOrEqual(10000);
  });

  it('cold tier intervalMs is 0 (on-change-only)', () => {
    expect(DEFAULT_TIER_CONFIG.cold.intervalMs).toBe(0);
  });

  it('all three tiers have non-empty descriptions', () => {
    expect(DEFAULT_TIER_CONFIG.hot.description).toBeTruthy();
    expect(DEFAULT_TIER_CONFIG.warm.description).toBeTruthy();
    expect(DEFAULT_TIER_CONFIG.cold.description).toBeTruthy();
  });
});

// ============================================================================
// Default Section Tier Mappings
// ============================================================================

describe('DEFAULT_SECTION_TIERS', () => {
  const findSection = (id: string) =>
    DEFAULT_SECTION_TIERS.find((s) => s.sectionId === id);

  it('contains hot sections: session-pulse, commit-feed, heartbeat, message-counter', () => {
    for (const id of ['session-pulse', 'commit-feed', 'heartbeat', 'message-counter']) {
      const section = findSection(id);
      expect(section, `missing section "${id}"`).toBeDefined();
      expect(section!.tier).toBe(SampleTier.hot);
    }
  });

  it('contains warm sections: phase-velocity, planning-quality', () => {
    for (const id of ['phase-velocity', 'planning-quality']) {
      const section = findSection(id);
      expect(section, `missing section "${id}"`).toBeDefined();
      expect(section!.tier).toBe(SampleTier.warm);
    }
  });

  it('contains cold section: historical-trends', () => {
    const section = findSection('historical-trends');
    expect(section).toBeDefined();
    expect(section!.tier).toBe(SampleTier.cold);
  });

  it('every section has a non-empty sources array', () => {
    for (const section of DEFAULT_SECTION_TIERS) {
      expect(section.sources.length, `section "${section.sectionId}" has empty sources`).toBeGreaterThan(0);
    }
  });
});

// ============================================================================
// resolveSectionInterval
// ============================================================================

describe('resolveSectionInterval', () => {
  it('returns correct TierInterval for a hot section', () => {
    const result = resolveSectionInterval('session-pulse');
    expect(result).not.toBeNull();
    expect(result!.tier).toBe(SampleTier.hot);
    expect(result!.intervalMs).toBe(DEFAULT_TIER_CONFIG.hot.intervalMs);
    expect(result!.sectionId).toBe('session-pulse');
    expect(result!.sources.length).toBeGreaterThan(0);
  });

  it('returns correct TierInterval for a warm section', () => {
    const result = resolveSectionInterval('phase-velocity');
    expect(result).not.toBeNull();
    expect(result!.tier).toBe(SampleTier.warm);
    expect(result!.intervalMs).toBe(DEFAULT_TIER_CONFIG.warm.intervalMs);
  });

  it('returns correct TierInterval for a cold section (intervalMs = 0)', () => {
    const result = resolveSectionInterval('historical-trends');
    expect(result).not.toBeNull();
    expect(result!.tier).toBe(SampleTier.cold);
    expect(result!.intervalMs).toBe(0);
  });

  it('returns null for unknown section ID', () => {
    const result = resolveSectionInterval('nonexistent-section');
    expect(result).toBeNull();
  });

  it('accepts optional custom SampleRateConfig override', () => {
    const custom: SampleRateConfig = {
      tiers: {
        [SampleTier.hot]: { tier: SampleTier.hot, intervalMs: 999, description: 'custom hot' },
        [SampleTier.warm]: { tier: SampleTier.warm, intervalMs: 4999, description: 'custom warm' },
        [SampleTier.cold]: { tier: SampleTier.cold, intervalMs: 0, description: 'custom cold' },
      },
      sections: [
        { sectionId: 'custom-section', tier: SampleTier.hot, sources: ['custom.json'] },
      ],
    };
    const result = resolveSectionInterval('custom-section', custom);
    expect(result).not.toBeNull();
    expect(result!.intervalMs).toBe(999);
    expect(result!.sources).toEqual(['custom.json']);
  });
});

// ============================================================================
// validateSampleRateConfig
// ============================================================================

describe('validateSampleRateConfig', () => {
  it('returns valid: true for DEFAULT config', () => {
    const config: SampleRateConfig = {
      tiers: DEFAULT_TIER_CONFIG,
      sections: DEFAULT_SECTION_TIERS,
    };
    const result = validateSampleRateConfig(config);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects hot interval < 500 (too fast)', () => {
    const config: SampleRateConfig = {
      tiers: {
        ...DEFAULT_TIER_CONFIG,
        [SampleTier.hot]: { tier: SampleTier.hot, intervalMs: 200, description: 'too fast' },
      },
      sections: [],
    };
    const result = validateSampleRateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects hot interval > 5000 (overlaps warm)', () => {
    const config: SampleRateConfig = {
      tiers: {
        ...DEFAULT_TIER_CONFIG,
        [SampleTier.hot]: { tier: SampleTier.hot, intervalMs: 6000, description: 'too slow' },
      },
      sections: [],
    };
    const result = validateSampleRateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects warm interval < 3000 (overlaps hot)', () => {
    const config: SampleRateConfig = {
      tiers: {
        ...DEFAULT_TIER_CONFIG,
        [SampleTier.warm]: { tier: SampleTier.warm, intervalMs: 2000, description: 'too fast' },
      },
      sections: [],
    };
    const result = validateSampleRateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects warm interval > 30000 (too slow)', () => {
    const config: SampleRateConfig = {
      tiers: {
        ...DEFAULT_TIER_CONFIG,
        [SampleTier.warm]: { tier: SampleTier.warm, intervalMs: 35000, description: 'too slow' },
      },
      sections: [],
    };
    const result = validateSampleRateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects section referencing unknown tier', () => {
    const config: SampleRateConfig = {
      tiers: {
        [SampleTier.hot]: DEFAULT_TIER_CONFIG.hot,
        [SampleTier.warm]: DEFAULT_TIER_CONFIG.warm,
        [SampleTier.cold]: DEFAULT_TIER_CONFIG.cold,
      },
      sections: [
        { sectionId: 'bad-section', tier: 'nonexistent' as SampleTier, sources: ['x'] },
      ],
    };
    const result = validateSampleRateConfig(config);
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
