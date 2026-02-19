import { describe, it, expect } from 'vitest';
import {
  renderMirrorWidget,
  renderMirrorWidgetStyles,
  type MirrorStats,
} from './aminet-widget.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeStats(overrides: Partial<MirrorStats> = {}): MirrorStats {
  return {
    totalIndexed: overrides.totalIndexed ?? 0,
    mirrored: overrides.mirrored ?? 0,
    scanPending: overrides.scanPending ?? 0,
    clean: overrides.clean ?? 0,
    infected: overrides.infected ?? 0,
    installed: overrides.installed ?? 0,
    quarantined: overrides.quarantined ?? 0,
  };
}

// ---------------------------------------------------------------------------
// MirrorStats interface shape
// ---------------------------------------------------------------------------

describe('MirrorStats interface', () => {
  it('accepts all required numeric fields', () => {
    const stats: MirrorStats = {
      totalIndexed: 84000,
      mirrored: 500,
      scanPending: 10,
      clean: 200,
      infected: 3,
      installed: 50,
      quarantined: 1,
    };
    expect(stats.totalIndexed).toBe(84000);
    expect(stats.mirrored).toBe(500);
    expect(stats.scanPending).toBe(10);
    expect(stats.clean).toBe(200);
    expect(stats.infected).toBe(3);
    expect(stats.installed).toBe(50);
    expect(stats.quarantined).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// renderMirrorWidget
// ---------------------------------------------------------------------------

describe('renderMirrorWidget', () => {
  it('renders "0 packages indexed" when all stats are zero', () => {
    const html = renderMirrorWidget(makeStats());
    expect(html).toContain('0 packages indexed');
  });

  it('renders localized count for totalIndexed (84,000)', () => {
    const html = renderMirrorWidget(makeStats({ totalIndexed: 84000, mirrored: 500 }));
    expect(html).toContain('84,000 packages indexed');
  });

  it('contains "Installed" row with count 50', () => {
    const html = renderMirrorWidget(makeStats({ installed: 50 }));
    expect(html).toContain('Installed');
    expect(html).toContain('50');
  });

  it('contains row styled with red signal color for infected', () => {
    const html = renderMirrorWidget(makeStats({ infected: 3 }));
    expect(html).toContain('var(--signal-error)');
  });

  it('contains "Clean" row with green color', () => {
    const html = renderMirrorWidget(makeStats({ clean: 200 }));
    expect(html).toContain('Clean');
    expect(html).toContain('#3fb950');
  });

  it('contains "Pending" row with warning color', () => {
    const html = renderMirrorWidget(makeStats({ scanPending: 10 }));
    expect(html).toContain('Pending');
    expect(html).toContain('var(--signal-warning)');
  });

  it('output is a valid HTML string with div.mirror-widget', () => {
    const html = renderMirrorWidget(makeStats());
    expect(html).toContain('<div');
    expect(html).toContain('mirror-widget');
  });

  it('output contains an h3 with "Aminet Mirror" text', () => {
    const html = renderMirrorWidget(makeStats());
    expect(html).toContain('<h3');
    expect(html).toContain('Aminet Mirror');
  });

  it('segments with count 0 are NOT rendered', () => {
    const html = renderMirrorWidget(makeStats({ installed: 5, infected: 0, clean: 0 }));
    // Only Installed should appear, not Clean or Infected
    expect(html).toContain('Installed');
    expect(html).not.toContain('Infected');
    expect(html).not.toContain('>Clean<');
  });

  it('output contains a table element with class "mirror-stats"', () => {
    const html = renderMirrorWidget(makeStats({ mirrored: 10 }));
    expect(html).toContain('<table');
    expect(html).toContain('mirror-stats');
  });
});

// ---------------------------------------------------------------------------
// renderMirrorWidgetStyles
// ---------------------------------------------------------------------------

describe('renderMirrorWidgetStyles', () => {
  it('returns a CSS string', () => {
    const css = renderMirrorWidgetStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('contains .mirror-widget class', () => {
    const css = renderMirrorWidgetStyles();
    expect(css).toContain('.mirror-widget');
  });

  it('contains .mirror-stats class', () => {
    const css = renderMirrorWidgetStyles();
    expect(css).toContain('.mirror-stats');
  });
});
