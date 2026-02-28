/**
 * Tests for entity legend component and panel header shape helper.
 *
 * Covers:
 * - renderEntityLegend produces collapsible <details> element
 * - Legend contains all 6 entity shapes with labels
 * - Legend contains all 6 domain color swatches with labels
 * - renderEntityLegendStyles produces CSS for legend layout
 * - renderPanelHeaderShape returns correct shapes for known panel types
 * - renderPanelHeaderShape returns empty string for unknown panel types
 *
 * @module dashboard/entity-legend.test
 */

import { describe, it, expect } from 'vitest';
import {
  renderEntityLegend,
  renderEntityLegendStyles,
  renderPanelHeaderShape,
} from './entity-legend.js';

// ---------------------------------------------------------------------------
// renderEntityLegend
// ---------------------------------------------------------------------------

describe('renderEntityLegend', () => {
  it('returns a non-empty HTML string', () => {
    const html = renderEntityLegend();
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(0);
  });

  it('wraps content in a <details> element', () => {
    const html = renderEntityLegend();
    expect(html).toContain('<details');
    expect(html).toContain('</details>');
  });

  it('has entity-legend class on details element', () => {
    const html = renderEntityLegend();
    expect(html).toContain('class="entity-legend"');
  });

  it('is open by default', () => {
    const html = renderEntityLegend();
    expect(html).toContain('<details class="entity-legend" open>');
  });

  it('has a summary toggle element', () => {
    const html = renderEntityLegend();
    expect(html).toContain('<summary');
    expect(html).toContain('</summary>');
    expect(html).toContain('entity-legend-toggle');
  });

  it('summary contains legend title text', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Shape');
    expect(html).toContain('Color');
    expect(html).toContain('Legend');
  });

  it('contains entity-legend-grid container', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-legend-grid');
  });

  it('has Entity Types section heading', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Entity Types');
  });

  it('has Domains section heading', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Domains');
  });

  // All 6 entity shapes present
  it('contains Agent entity shape', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-agent');
    expect(html).toContain('Agent');
  });

  it('contains Skill entity shape', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-skill');
    expect(html).toContain('Skill');
  });

  it('contains Team entity shape', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-team');
    expect(html).toContain('Team');
  });

  it('contains Milestone entity shape', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-milestone');
    expect(html).toContain('Milestone');
  });

  it('contains Adapter entity shape', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-adapter');
    expect(html).toContain('Adapter');
  });

  it('contains Plan entity shape', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-plan');
    expect(html).toContain('Plan');
  });

  // All 6 domain colors present
  it('contains Frontend domain color', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Frontend');
    expect(html).toContain('domain-swatch');
  });

  it('contains Backend domain color', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Backend');
  });

  it('contains Testing domain color', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Testing');
  });

  it('contains Infrastructure domain color', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Infrastructure');
  });

  it('contains Observation domain color', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Observation');
  });

  it('contains Silicon domain color', () => {
    const html = renderEntityLegend();
    expect(html).toContain('Silicon');
  });

  it('renders SVG shapes within the legend', () => {
    const html = renderEntityLegend();
    expect(html).toContain('<svg');
    expect(html).toContain('entity-shape');
  });

  it('has legend section containers', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-legend-section');
  });

  it('has legend item containers', () => {
    const html = renderEntityLegend();
    expect(html).toContain('entity-legend-item');
  });
});

// ---------------------------------------------------------------------------
// renderEntityLegendStyles
// ---------------------------------------------------------------------------

describe('renderEntityLegendStyles', () => {
  it('returns a non-empty CSS string', () => {
    const css = renderEntityLegendStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('defines .entity-legend class', () => {
    const css = renderEntityLegendStyles();
    expect(css).toContain('.entity-legend');
  });

  it('defines .entity-legend-grid class', () => {
    const css = renderEntityLegendStyles();
    expect(css).toContain('.entity-legend-grid');
  });

  it('defines .entity-legend-item class', () => {
    const css = renderEntityLegendStyles();
    expect(css).toContain('.entity-legend-item');
  });

  it('defines .entity-legend-toggle class', () => {
    const css = renderEntityLegendStyles();
    expect(css).toContain('.entity-legend-toggle');
  });

  it('defines .domain-swatch class', () => {
    const css = renderEntityLegendStyles();
    expect(css).toContain('.domain-swatch');
  });

  it('uses grid layout', () => {
    const css = renderEntityLegendStyles();
    expect(css).toContain('grid');
  });
});

// ---------------------------------------------------------------------------
// renderPanelHeaderShape
// ---------------------------------------------------------------------------

describe('renderPanelHeaderShape', () => {
  it('returns SVG for activity panel (observation dot)', () => {
    const svg = renderPanelHeaderShape('activity');
    expect(svg).toContain('<svg');
    expect(svg).toContain('entity-plan');
    expect(svg).toContain('domain-observation');
  });

  it('returns SVG for terminal panel (infrastructure diamond)', () => {
    const svg = renderPanelHeaderShape('terminal');
    expect(svg).toContain('<svg');
    expect(svg).toContain('entity-adapter');
    expect(svg).toContain('domain-infrastructure');
  });

  it('returns SVG for staging panel (backend rectangle)', () => {
    const svg = renderPanelHeaderShape('staging');
    expect(svg).toContain('<svg');
    expect(svg).toContain('entity-skill');
    expect(svg).toContain('domain-backend');
  });

  it('returns empty string for unknown panel type', () => {
    const svg = renderPanelHeaderShape('unknown');
    expect(svg).toBe('');
  });

  it('returns empty string for empty string panel type', () => {
    const svg = renderPanelHeaderShape('');
    expect(svg).toBe('');
  });

  it('uses size 14 for compact headers', () => {
    const svg = renderPanelHeaderShape('activity');
    expect(svg).toContain('width="14"');
    expect(svg).toContain('height="14"');
  });
});
