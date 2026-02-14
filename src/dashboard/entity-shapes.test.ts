/**
 * Tests for entity shape/color rendering system.
 *
 * Covers:
 * - All 6 entity types render distinct SVG shapes
 * - All 6 domain colors produce correct CSS variable references
 * - renderEntityShape produces self-contained inline SVG strings
 * - renderEntityShapeStyles produces valid CSS with entity and domain classes
 * - Size parameter (default 16, custom values)
 * - All 36 entity-domain combinations
 *
 * @module dashboard/entity-shapes.test
 */

import { describe, it, expect } from 'vitest';
import {
  renderEntityShape,
  renderEntityShapeStyles,
  ENTITY_SHAPES,
  DOMAIN_COLORS,
  type EntityType,
  type DomainType,
} from './entity-shapes.js';

// ---------------------------------------------------------------------------
// Constants validation
// ---------------------------------------------------------------------------

describe('ENTITY_SHAPES', () => {
  it('defines exactly 6 entity types', () => {
    const keys = Object.keys(ENTITY_SHAPES);
    expect(keys).toHaveLength(6);
    expect(keys).toContain('agent');
    expect(keys).toContain('skill');
    expect(keys).toContain('team');
    expect(keys).toContain('milestone');
    expect(keys).toContain('adapter');
    expect(keys).toContain('plan');
  });

  it('each shape has tag, viewBox, and path', () => {
    for (const [, config] of Object.entries(ENTITY_SHAPES)) {
      expect(config).toHaveProperty('tag');
      expect(config).toHaveProperty('viewBox');
      expect(config).toHaveProperty('path');
      expect(typeof config.tag).toBe('string');
      expect(typeof config.viewBox).toBe('string');
      expect(typeof config.path).toBe('string');
    }
  });

  it('agent shape uses circle element', () => {
    expect(ENTITY_SHAPES.agent.tag).toBe('circle');
    expect(ENTITY_SHAPES.agent.path).toContain('cx=');
    expect(ENTITY_SHAPES.agent.path).toContain('cy=');
    expect(ENTITY_SHAPES.agent.path).toContain('r=');
  });

  it('skill shape uses rect element', () => {
    expect(ENTITY_SHAPES.skill.tag).toBe('rect');
    expect(ENTITY_SHAPES.skill.path).toContain('width=');
    expect(ENTITY_SHAPES.skill.path).toContain('height=');
  });

  it('team shape uses polygon element (hexagon)', () => {
    expect(ENTITY_SHAPES.team.tag).toBe('polygon');
    expect(ENTITY_SHAPES.team.path).toContain('points=');
  });

  it('milestone shape uses polygon element (chevron)', () => {
    expect(ENTITY_SHAPES.milestone.tag).toBe('polygon');
    expect(ENTITY_SHAPES.milestone.path).toContain('points=');
  });

  it('adapter shape uses polygon element (diamond)', () => {
    expect(ENTITY_SHAPES.adapter.tag).toBe('polygon');
    expect(ENTITY_SHAPES.adapter.path).toContain('points=');
  });

  it('plan shape uses circle element (dot, smaller than agent)', () => {
    expect(ENTITY_SHAPES.plan.tag).toBe('circle');
    expect(ENTITY_SHAPES.plan.path).toContain('r=');
    // Plan dot should have a smaller radius than agent circle
    const agentR = parseInt(ENTITY_SHAPES.agent.path.match(/r="(\d+)"/)?.[1] ?? '0');
    const planR = parseInt(ENTITY_SHAPES.plan.path.match(/r="(\d+)"/)?.[1] ?? '0');
    expect(planR).toBeLessThan(agentR);
  });
});

describe('DOMAIN_COLORS', () => {
  it('defines exactly 6 domain colors', () => {
    const keys = Object.keys(DOMAIN_COLORS);
    expect(keys).toHaveLength(6);
    expect(keys).toContain('frontend');
    expect(keys).toContain('backend');
    expect(keys).toContain('testing');
    expect(keys).toContain('infrastructure');
    expect(keys).toContain('observation');
    expect(keys).toContain('silicon');
  });

  it('each color references a CSS custom property', () => {
    for (const [name, value] of Object.entries(DOMAIN_COLORS)) {
      expect(value).toContain('var(--domain-');
      expect(value).toContain(name);
    }
  });

  it('frontend maps to --domain-frontend', () => {
    expect(DOMAIN_COLORS.frontend).toBe('var(--domain-frontend)');
  });

  it('backend maps to --domain-backend', () => {
    expect(DOMAIN_COLORS.backend).toBe('var(--domain-backend)');
  });

  it('testing maps to --domain-testing', () => {
    expect(DOMAIN_COLORS.testing).toBe('var(--domain-testing)');
  });

  it('infrastructure maps to --domain-infrastructure', () => {
    expect(DOMAIN_COLORS.infrastructure).toBe('var(--domain-infrastructure)');
  });

  it('observation maps to --domain-observation', () => {
    expect(DOMAIN_COLORS.observation).toBe('var(--domain-observation)');
  });

  it('silicon maps to --domain-silicon', () => {
    expect(DOMAIN_COLORS.silicon).toBe('var(--domain-silicon)');
  });
});

// ---------------------------------------------------------------------------
// renderEntityShape
// ---------------------------------------------------------------------------

describe('renderEntityShape', () => {
  it('returns an SVG string', () => {
    const svg = renderEntityShape('agent', 'frontend');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('includes entity-shape class', () => {
    const svg = renderEntityShape('agent', 'frontend');
    expect(svg).toContain('class="entity-shape');
  });

  it('includes entity type class', () => {
    const svg = renderEntityShape('agent', 'frontend');
    expect(svg).toContain('entity-agent');
  });

  it('includes domain class', () => {
    const svg = renderEntityShape('agent', 'frontend');
    expect(svg).toContain('domain-frontend');
  });

  it('uses default size of 16', () => {
    const svg = renderEntityShape('agent', 'frontend');
    expect(svg).toContain('width="16"');
    expect(svg).toContain('height="16"');
  });

  it('respects custom size parameter', () => {
    const svg = renderEntityShape('agent', 'frontend', 24);
    expect(svg).toContain('width="24"');
    expect(svg).toContain('height="24"');
  });

  it('uses 24x24 viewBox', () => {
    const svg = renderEntityShape('agent', 'frontend');
    expect(svg).toContain('viewBox="0 0 24 24"');
  });

  it('fills shape with domain color CSS variable', () => {
    const svg = renderEntityShape('agent', 'frontend');
    expect(svg).toContain('fill="var(--domain-frontend)"');
  });

  // Test all entity types produce correct SVG elements
  it('renders agent as circle', () => {
    const svg = renderEntityShape('agent', 'frontend');
    expect(svg).toContain('<circle');
  });

  it('renders skill as rect', () => {
    const svg = renderEntityShape('skill', 'backend');
    expect(svg).toContain('<rect');
  });

  it('renders team as polygon (hexagon)', () => {
    const svg = renderEntityShape('team', 'testing');
    expect(svg).toContain('<polygon');
    expect(svg).toContain('points="12,2 22,7 22,17 12,22 2,17 2,7"');
  });

  it('renders milestone as polygon (chevron)', () => {
    const svg = renderEntityShape('milestone', 'infrastructure');
    expect(svg).toContain('<polygon');
    expect(svg).toContain('points="2,4 16,4 22,12 16,20 2,20 8,12"');
  });

  it('renders adapter as polygon (diamond)', () => {
    const svg = renderEntityShape('adapter', 'silicon');
    expect(svg).toContain('<polygon');
    expect(svg).toContain('points="12,2 22,12 12,22 2,12"');
  });

  it('renders plan as small circle (dot)', () => {
    const svg = renderEntityShape('plan', 'observation');
    expect(svg).toContain('<circle');
    expect(svg).toContain('r="5"');
  });

  // All 36 entity-domain combinations
  describe('all entity-domain combinations', () => {
    const entities: EntityType[] = ['agent', 'skill', 'team', 'milestone', 'adapter', 'plan'];
    const domains: DomainType[] = ['frontend', 'backend', 'testing', 'infrastructure', 'observation', 'silicon'];

    for (const entity of entities) {
      for (const domain of domains) {
        it(`renders ${entity}/${domain} without error`, () => {
          const svg = renderEntityShape(entity, domain);
          expect(svg).toContain('<svg');
          expect(svg).toContain(`entity-${entity}`);
          expect(svg).toContain(`domain-${domain}`);
          expect(svg).toContain(`fill="var(--domain-${domain})"`);
          expect(svg).toContain('</svg>');
        });
      }
    }
  });

  it('renders plan with custom size 12', () => {
    const svg = renderEntityShape('plan', 'observation', 12);
    expect(svg).toContain('width="12"');
    expect(svg).toContain('height="12"');
    expect(svg).toContain('fill="var(--domain-observation)"');
  });

  it('produces self-contained SVG (no external references)', () => {
    const svg = renderEntityShape('team', 'testing');
    expect(svg).not.toContain('xlink:href');
    expect(svg).not.toContain('url(');
    expect(svg).not.toContain('<use');
  });
});

// ---------------------------------------------------------------------------
// renderEntityShapeStyles
// ---------------------------------------------------------------------------

describe('renderEntityShapeStyles', () => {
  it('returns a non-empty CSS string', () => {
    const css = renderEntityShapeStyles();
    expect(typeof css).toBe('string');
    expect(css.length).toBeGreaterThan(0);
  });

  it('defines all 6 domain color CSS custom properties', () => {
    const css = renderEntityShapeStyles();
    expect(css).toContain('--domain-frontend');
    expect(css).toContain('--domain-backend');
    expect(css).toContain('--domain-testing');
    expect(css).toContain('--domain-infrastructure');
    expect(css).toContain('--domain-observation');
    expect(css).toContain('--domain-silicon');
  });

  it('includes hex fallback values for domain colors', () => {
    const css = renderEntityShapeStyles();
    expect(css).toContain('#58a6ff');
    expect(css).toContain('#3fb950');
    expect(css).toContain('#d29922');
    expect(css).toContain('#bc8cff');
    expect(css).toContain('#39d2c0');
    expect(css).toContain('#f778ba');
  });

  it('defines .entity-shape base class', () => {
    const css = renderEntityShapeStyles();
    expect(css).toContain('.entity-shape');
    expect(css).toContain('display: inline-block');
    expect(css).toContain('vertical-align: middle');
  });

  it('defines entity type classes', () => {
    const css = renderEntityShapeStyles();
    expect(css).toContain('.entity-agent');
    expect(css).toContain('.entity-skill');
    expect(css).toContain('.entity-team');
    expect(css).toContain('.entity-milestone');
    expect(css).toContain('.entity-adapter');
    expect(css).toContain('.entity-plan');
  });

  it('defines domain fill classes', () => {
    const css = renderEntityShapeStyles();
    expect(css).toContain('.domain-frontend');
    expect(css).toContain('.domain-backend');
    expect(css).toContain('.domain-testing');
    expect(css).toContain('.domain-infrastructure');
    expect(css).toContain('.domain-observation');
    expect(css).toContain('.domain-silicon');
  });

  it('domain fill classes reference CSS custom properties', () => {
    const css = renderEntityShapeStyles();
    expect(css).toContain('fill: var(--domain-frontend)');
    expect(css).toContain('fill: var(--domain-backend)');
    expect(css).toContain('fill: var(--domain-testing)');
    expect(css).toContain('fill: var(--domain-infrastructure)');
    expect(css).toContain('fill: var(--domain-observation)');
    expect(css).toContain('fill: var(--domain-silicon)');
  });
});
