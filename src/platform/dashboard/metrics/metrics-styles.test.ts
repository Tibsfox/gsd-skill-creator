import { describe, it, expect } from 'vitest';
import { renderMetricsStyles } from './metrics-styles.js';

describe('renderMetricsStyles', () => {
  const css = renderMetricsStyles();

  // ---------------------------------------------------------------------------
  // Container
  // ---------------------------------------------------------------------------

  it('returns a non-empty CSS string', () => {
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains metrics-dashboard container', () => {
    expect(css).toContain('.metrics-dashboard');
  });

  // ---------------------------------------------------------------------------
  // Pulse section classes
  // ---------------------------------------------------------------------------

  it('contains pulse section classes', () => {
    expect(css).toContain('.pulse-section');
    expect(css).toContain('.pulse-card');
  });

  it('contains session card classes', () => {
    expect(css).toContain('.session-card');
    expect(css).toContain('.session-id');
    expect(css).toContain('.session-model');
    expect(css).toContain('.session-start');
    expect(css).toContain('.session-duration');
  });

  it('contains commit feed classes', () => {
    expect(css).toContain('.commit-feed');
    expect(css).toContain('.commit-row');
    expect(css).toContain('.commit-hash');
    expect(css).toContain('.commit-scope');
    expect(css).toContain('.commit-subject');
    expect(css).toContain('.commit-time');
    expect(css).toContain('.diff-add');
    expect(css).toContain('.diff-del');
  });

  it('contains heartbeat classes with color variant', () => {
    expect(css).toContain('.heartbeat');
    expect(css).toContain('.heartbeat-dot');
    expect(css).toContain('.heartbeat-label');
    expect(css).toContain('.heartbeat-gray');
  });

  it('contains message counter classes', () => {
    expect(css).toContain('.message-counter');
    expect(css).toContain('.counter-user');
    expect(css).toContain('.counter-assistant');
    expect(css).toContain('.counter-tools');
    expect(css).toContain('.counter-total');
  });

  // ---------------------------------------------------------------------------
  // Velocity section classes
  // ---------------------------------------------------------------------------

  it('contains velocity section classes', () => {
    expect(css).toContain('.velocity-section');
    expect(css).toContain('.velocity-progress-card');
  });

  it('contains progress bar classes', () => {
    expect(css).toContain('.progress-bar');
    expect(css).toContain('.progress-fill');
  });

  it('contains velocity timeline classes', () => {
    expect(css).toContain('.velocity-timeline');
    expect(css).toContain('.velocity-timeline-row');
    expect(css).toContain('.velocity-timeline-bar');
  });

  it('contains velocity stats table classes', () => {
    expect(css).toContain('.velocity-stats-table');
    expect(css).toContain('.phase-num');
  });

  it('contains velocity TDD rhythm classes', () => {
    expect(css).toContain('.velocity-tdd-rhythm');
    expect(css).toContain('.velocity-tdd-phase');
    expect(css).toContain('.velocity-tdd-overall');
  });

  // ---------------------------------------------------------------------------
  // Quality section classes
  // ---------------------------------------------------------------------------

  it('contains quality section with max-height containment', () => {
    expect(css).toContain('.quality-section');
    expect(css).toMatch(/\.quality-section\s*\{[^}]*max-height/);
    expect(css).toMatch(/\.quality-section\s*\{[^}]*overflow-y:\s*auto/);
  });

  it('contains quality card classes', () => {
    expect(css).toContain('.quality-card');
    expect(css).toContain('.quality-card.empty');
  });

  it('contains accuracy row and scope color classes', () => {
    expect(css).toContain('.accuracy-row');
    expect(css).toContain('.accuracy-indicator');
    expect(css).toContain('.accuracy-phase');
    expect(css).toContain('.accuracy-plans');
    expect(css).toContain('.accuracy-label');
    expect(css).toContain('.scope-on-track');
    expect(css).toContain('.scope-expanded');
    expect(css).toContain('.scope-contracted');
    expect(css).toContain('.scope-shifted');
  });

  it('contains emergent ratio classes', () => {
    expect(css).toContain('.emergent-row');
    expect(css).toContain('.emergent-bar');
    expect(css).toContain('.emergent-fill');
    expect(css).toContain('.emergent-average');
  });

  it('contains deviation summary classes', () => {
    expect(css).toContain('.deviation-summary');
    expect(css).toContain('.deviation-phase');
    expect(css).toContain('.deviation-none');
  });

  it('contains accuracy trend and trend bar color classes', () => {
    expect(css).toContain('.accuracy-trend');
    expect(css).toContain('.trend-chart');
    expect(css).toContain('.trend-bar');
    expect(css).toContain('.trend-bar-green');
    expect(css).toContain('.trend-bar-yellow');
    expect(css).toContain('.trend-bar-blue');
    expect(css).toContain('.trend-bar-red');
    expect(css).toContain('.trend-average');
  });

  // ---------------------------------------------------------------------------
  // History section classes
  // ---------------------------------------------------------------------------

  it('contains history section with max-height containment', () => {
    expect(css).toContain('.history-section');
    expect(css).toMatch(/\.history-section\s*\{[^}]*max-height/);
    expect(css).toMatch(/\.history-section\s*\{[^}]*overflow-y:\s*auto/);
  });

  it('contains milestone table classes', () => {
    expect(css).toContain('.milestone-table');
    expect(css).toContain('.milestone-name');
  });

  it('contains commit bar classes', () => {
    expect(css).toContain('.commit-bar');
    expect(css).toContain('.commit-bar-segment');
    expect(css).toContain('.commit-legend');
    expect(css).toContain('.legend-item');
    expect(css).toContain('.legend-swatch');
  });

  it('contains velocity chart classes', () => {
    expect(css).toContain('.velocity-chart');
    expect(css).toContain('.velocity-bar-group');
    expect(css).toContain('.velocity-bar');
  });

  it('contains file hotspot classes', () => {
    expect(css).toContain('.hotspot-list');
    expect(css).toContain('.hotspot-item');
    expect(css).toContain('.hotspot-path');
    expect(css).toContain('.hotspot-count');
    expect(css).toContain('.hotspot-recency');
  });

  // ---------------------------------------------------------------------------
  // Uses CSS custom properties
  // ---------------------------------------------------------------------------

  it('uses CSS custom properties for theming', () => {
    expect(css).toContain('var(--surface');
    expect(css).toContain('var(--border');
    expect(css).toContain('var(--accent');
    expect(css).toContain('var(--text-muted');
    expect(css).toContain('var(--font-mono');
    expect(css).toContain('var(--radius-lg');
    expect(css).toContain('var(--space-md');
  });
});
