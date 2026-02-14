import { describe, it, expect } from 'vitest';
import {
  renderActivityFeed,
  renderActivityFeedStyles,
} from './activity-feed.js';
import type { FeedEntry } from './activity-feed.js';

// ---------------------------------------------------------------------------
// Helper: create a minimal FeedEntry
// ---------------------------------------------------------------------------

function makeEntry(overrides?: Partial<FeedEntry>): FeedEntry {
  return {
    entityType: 'agent',
    domain: 'frontend',
    identifier: 'F-1',
    description: 'Frontend Agent started',
    occurredAt: '2026-02-14T10:00:00Z',
    ...overrides,
  };
}

// ===========================================================================
// renderActivityFeed
// ===========================================================================

describe('renderActivityFeed', () => {
  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe('empty state', () => {
    it('returns container with .activity-feed class', () => {
      const html = renderActivityFeed([]);
      expect(html).toContain('class="activity-feed"');
    });

    it('shows "No activity" message with .af-empty class', () => {
      const html = renderActivityFeed([]);
      expect(html).toContain('af-empty');
      expect(html).toContain('No activity');
    });

    it('renders no .af-entry elements', () => {
      const html = renderActivityFeed([]);
      expect(html).not.toContain('af-entry');
    });
  });

  // -------------------------------------------------------------------------
  // Entry rendering
  // -------------------------------------------------------------------------

  describe('entry rendering', () => {
    it('renders each entry as .af-entry div', () => {
      const entries = [makeEntry(), makeEntry({ identifier: 'B-1' })];
      const html = renderActivityFeed(entries);
      const matches = html.match(/af-entry/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBeGreaterThanOrEqual(2);
    });

    it('entry contains .af-shape element as first child', () => {
      const html = renderActivityFeed([makeEntry()]);
      // af-shape should appear before af-identifier within af-entry
      const entryStart = html.indexOf('af-entry');
      const shapeIdx = html.indexOf('af-shape', entryStart);
      const identIdx = html.indexOf('af-identifier', entryStart);
      expect(shapeIdx).toBeGreaterThan(-1);
      expect(shapeIdx).toBeLessThan(identIdx);
    });

    it('shape element has data-entity-type attribute matching entityType', () => {
      const html = renderActivityFeed([makeEntry({ entityType: 'skill' })]);
      expect(html).toContain('data-entity-type="skill"');
    });

    it('shape element has data-domain attribute for CSS coloring', () => {
      const html = renderActivityFeed([makeEntry({ domain: 'backend' })]);
      expect(html).toContain('data-domain="backend"');
    });

    it('entry contains .af-identifier span with identifier text', () => {
      const html = renderActivityFeed([makeEntry({ identifier: 'T-1:rcp' })]);
      expect(html).toContain('af-identifier');
      expect(html).toContain('T-1:rcp');
    });

    it('entry contains .af-description span with description text', () => {
      const html = renderActivityFeed([makeEntry({ description: 'Recipe Skill activated' })]);
      expect(html).toContain('af-description');
      expect(html).toContain('Recipe Skill activated');
    });

    it('does NOT render any timestamp in entry HTML', () => {
      const html = renderActivityFeed([makeEntry({ occurredAt: '2026-02-14T10:00:00Z' })]);
      expect(html).not.toContain('2026-02-14');
      expect(html).not.toContain('10:00');
      expect(html).not.toContain('<time');
      expect(html).not.toContain('ago');
    });
  });

  // -------------------------------------------------------------------------
  // Shape rendering (6 entity shapes as Unicode indicators)
  // -------------------------------------------------------------------------

  describe('shape rendering', () => {
    it('agent shape: filled circle character', () => {
      const html = renderActivityFeed([makeEntry({ entityType: 'agent' })]);
      expect(html).toContain('\u25CF'); // ●
    });

    it('skill shape: filled square character', () => {
      const html = renderActivityFeed([makeEntry({ entityType: 'skill' })]);
      expect(html).toContain('\u25A0'); // ■
    });

    it('team shape: hexagon indicator', () => {
      const html = renderActivityFeed([makeEntry({ entityType: 'team' })]);
      // Accept either ⬢ (\u2B22) or ⬡ (\u2B21)
      const hasHex = html.includes('\u2B22') || html.includes('\u2B21');
      expect(hasHex).toBe(true);
    });

    it('phase shape: chevron indicator', () => {
      const html = renderActivityFeed([makeEntry({ entityType: 'phase' })]);
      expect(html).toContain('\u276F'); // ❯
    });

    it('adapter shape: diamond indicator', () => {
      const html = renderActivityFeed([makeEntry({ entityType: 'adapter' })]);
      expect(html).toContain('\u25C6'); // ◆
    });

    it('plan shape: small dot indicator', () => {
      const html = renderActivityFeed([makeEntry({ entityType: 'plan' })]);
      expect(html).toContain('\u2022'); // •
    });

    it('each shape picks up domain color via CSS class .af-domain-{domain}', () => {
      const html = renderActivityFeed([makeEntry({ domain: 'testing' })]);
      expect(html).toContain('af-domain-testing');
    });
  });

  // -------------------------------------------------------------------------
  // 8-entry limit (REQ-AF-02)
  // -------------------------------------------------------------------------

  describe('8-entry limit', () => {
    it('with 10 entries, only 8 rendered', () => {
      const entries = Array.from({ length: 10 }, (_, i) =>
        makeEntry({ identifier: `E-${i}`, occurredAt: `2026-02-14T${String(i).padStart(2, '0')}:00:00Z` }),
      );
      const html = renderActivityFeed(entries);
      const matches = html.match(/af-entry/g);
      expect(matches).not.toBeNull();
      expect(matches!.length).toBe(8);
    });

    it('newest entries shown (sorted by occurredAt descending)', () => {
      const entries = Array.from({ length: 10 }, (_, i) =>
        makeEntry({ identifier: `E-${i}`, occurredAt: `2026-02-14T${String(i).padStart(2, '0')}:00:00Z` }),
      );
      const html = renderActivityFeed(entries);
      // E-9 (newest) should be present, E-0 and E-1 (oldest) should not
      expect(html).toContain('E-9');
      expect(html).toContain('E-8');
      expect(html).not.toContain('>E-0<');
      expect(html).not.toContain('>E-1<');
    });

    it('most recent entry appears first in DOM', () => {
      const entries = [
        makeEntry({ identifier: 'OLD', occurredAt: '2026-02-14T01:00:00Z' }),
        makeEntry({ identifier: 'NEW', occurredAt: '2026-02-14T09:00:00Z' }),
      ];
      const html = renderActivityFeed(entries);
      const oldIdx = html.indexOf('OLD');
      const newIdx = html.indexOf('NEW');
      expect(newIdx).toBeLessThan(oldIdx);
    });
  });

  // -------------------------------------------------------------------------
  // Sorting
  // -------------------------------------------------------------------------

  describe('sorting', () => {
    it('entries with later occurredAt appear before earlier ones', () => {
      const entries = [
        makeEntry({ identifier: 'FIRST', occurredAt: '2026-02-14T06:00:00Z' }),
        makeEntry({ identifier: 'SECOND', occurredAt: '2026-02-14T12:00:00Z' }),
      ];
      const html = renderActivityFeed(entries);
      const firstIdx = html.indexOf('FIRST');
      const secondIdx = html.indexOf('SECOND');
      expect(secondIdx).toBeLessThan(firstIdx);
    });

    it('already-sorted input preserved correctly', () => {
      const entries = [
        makeEntry({ identifier: 'NEWEST', occurredAt: '2026-02-14T12:00:00Z' }),
        makeEntry({ identifier: 'MIDDLE', occurredAt: '2026-02-14T08:00:00Z' }),
        makeEntry({ identifier: 'OLDEST', occurredAt: '2026-02-14T04:00:00Z' }),
      ];
      const html = renderActivityFeed(entries);
      const newestIdx = html.indexOf('NEWEST');
      const middleIdx = html.indexOf('MIDDLE');
      const oldestIdx = html.indexOf('OLDEST');
      expect(newestIdx).toBeLessThan(middleIdx);
      expect(middleIdx).toBeLessThan(oldestIdx);
    });
  });
});

// ===========================================================================
// renderActivityFeedStyles
// ===========================================================================

describe('renderActivityFeedStyles', () => {
  it('returns non-empty CSS string', () => {
    const css = renderActivityFeedStyles();
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains .activity-feed rule', () => {
    const css = renderActivityFeedStyles();
    expect(css).toContain('.activity-feed');
  });

  it('contains .af-entry with white-space: nowrap (REQ-AF-03)', () => {
    const css = renderActivityFeedStyles();
    expect(css).toContain('.af-entry');
    expect(css).toContain('white-space: nowrap');
  });

  it('contains .af-entry with overflow: hidden', () => {
    const css = renderActivityFeedStyles();
    expect(css).toContain('overflow: hidden');
  });

  it('contains .af-shape styling', () => {
    const css = renderActivityFeedStyles();
    expect(css).toContain('.af-shape');
  });

  it('contains domain color classes for all 6 domains', () => {
    const css = renderActivityFeedStyles();
    expect(css).toContain('.af-domain-frontend');
    expect(css).toContain('.af-domain-backend');
    expect(css).toContain('.af-domain-testing');
    expect(css).toContain('.af-domain-infrastructure');
    expect(css).toContain('.af-domain-observation');
    expect(css).toContain('.af-domain-silicon');
  });

  it('uses dashboard CSS custom properties', () => {
    const css = renderActivityFeedStyles();
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
  });

  it('contains .af-empty styling', () => {
    const css = renderActivityFeedStyles();
    expect(css).toContain('.af-empty');
  });

  it('does NOT contain any timestamp-related styles', () => {
    const css = renderActivityFeedStyles();
    expect(css).not.toContain('.af-time');
    expect(css).not.toContain('relative-time');
  });
});
