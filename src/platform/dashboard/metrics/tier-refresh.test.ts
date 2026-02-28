import { describe, it, expect } from 'vitest';
import {
  generateSectionRefreshScript,
  wrapSectionWithRefresh,
} from './tier-refresh.js';
import { SampleTier, type SampleRateConfig } from './types.js';
import { DEFAULT_TIER_CONFIG, DEFAULT_SECTION_TIERS } from './sample-rate.js';

// ============================================================================
// generateSectionRefreshScript
// ============================================================================

describe('generateSectionRefreshScript', () => {
  it('returns a <script> string with setInterval for a hot section', () => {
    const result = generateSectionRefreshScript('session-pulse');
    expect(result).toContain('<script>');
    expect(result).toContain('</script>');
    expect(result).toContain('setInterval');
    expect(result).toContain('1500');
  });

  it('targets element with id gsd-section-{sectionId}', () => {
    const result = generateSectionRefreshScript('session-pulse');
    expect(result).toContain('gsd-section-session-pulse');
  });

  it('uses fetch() to request a section-specific endpoint', () => {
    const result = generateSectionRefreshScript('commit-feed');
    expect(result).toContain('fetch(');
    expect(result).toContain('/api/metrics/commit-feed');
  });

  it('replaces innerHTML of the target element with fetched content', () => {
    const result = generateSectionRefreshScript('session-pulse');
    expect(result).toContain('innerHTML');
  });

  it('returns empty string for a cold section (intervalMs = 0)', () => {
    const result = generateSectionRefreshScript('historical-trends');
    expect(result).toBe('');
  });

  it('includes error handling with try/catch around fetch', () => {
    const result = generateSectionRefreshScript('session-pulse');
    expect(result).toContain('try');
    expect(result).toContain('catch');
  });

  it('accepts optional apiBasePath parameter for fetch URL prefix', () => {
    const result = generateSectionRefreshScript('session-pulse', undefined, '/custom/api/');
    expect(result).toContain('/custom/api/session-pulse');
    expect(result).not.toContain('/api/metrics/');
  });

  it('defaults apiBasePath to /api/metrics/', () => {
    const result = generateSectionRefreshScript('session-pulse');
    expect(result).toContain('/api/metrics/session-pulse');
  });
});

// ============================================================================
// wrapSectionWithRefresh
// ============================================================================

describe('wrapSectionWithRefresh', () => {
  it('returns HTML with a div wrapper around content', () => {
    const result = wrapSectionWithRefresh('session-pulse', '<p>Hello</p>');
    expect(result).toContain('<div id="gsd-section-session-pulse"');
    expect(result).toContain('<p>Hello</p>');
    expect(result).toContain('</div>');
  });

  it('appends refresh script after wrapper div for hot sections', () => {
    const result = wrapSectionWithRefresh('session-pulse', '<p>Hot</p>');
    expect(result).toContain('</div>');
    expect(result).toContain('<script>');
    // Script should come after the closing div
    const divEnd = result.indexOf('</div>');
    const scriptStart = result.indexOf('<script>');
    expect(scriptStart).toBeGreaterThan(divEnd);
  });

  it('appends refresh script for warm sections', () => {
    const result = wrapSectionWithRefresh('phase-velocity', '<p>Warm</p>');
    expect(result).toContain('<script>');
    expect(result).toContain('setInterval');
  });

  it('does NOT append refresh script for cold sections', () => {
    const result = wrapSectionWithRefresh('historical-trends', '<p>Cold</p>');
    expect(result).toContain('<div id="gsd-section-historical-trends"');
    expect(result).not.toContain('<script>');
  });

  it('includes data-tier attribute on wrapper div', () => {
    const result = wrapSectionWithRefresh('session-pulse', '<p>test</p>');
    expect(result).toContain('data-tier="hot"');
  });

  it('includes data-interval attribute with interval in ms', () => {
    const result = wrapSectionWithRefresh('session-pulse', '<p>test</p>');
    expect(result).toContain('data-interval="1500"');
  });
});

// ============================================================================
// Edge Cases
// ============================================================================

describe('tier-refresh edge cases', () => {
  it('unknown section ID returns wrapper with no refresh script', () => {
    const result = wrapSectionWithRefresh('nonexistent-section', '<p>unknown</p>');
    expect(result).toContain('<div id="gsd-section-nonexistent-section"');
    expect(result).not.toContain('<script>');
  });

  it('custom SampleRateConfig can override default intervals', () => {
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
    const result = generateSectionRefreshScript('custom-section', custom);
    expect(result).toContain('999');
    expect(result).toContain('<script>');
  });

  it('multiple sections can be wrapped independently without ID collisions', () => {
    const a = wrapSectionWithRefresh('session-pulse', '<p>A</p>');
    const b = wrapSectionWithRefresh('commit-feed', '<p>B</p>');
    expect(a).toContain('gsd-section-session-pulse');
    expect(a).not.toContain('gsd-section-commit-feed');
    expect(b).toContain('gsd-section-commit-feed');
    expect(b).not.toContain('gsd-section-session-pulse');
  });
});
