import { describe, it, expect } from 'vitest';
import {
  toSVG,
  toPalette,
  toLayoutSpec,
  translateDesign,
} from './translation-design.js';
import type { ExtractedParameters } from './types.js';

const mandalaParams: ExtractedParameters = {
  color: {
    palette: [
      { name: 'warm stone', hex: '#C4A882', role: 'primary' },
      { name: 'ochre', hex: '#CC7722', role: 'accent' },
      { name: 'tarp white', hex: '#F2EDE4', role: 'background' },
      { name: 'magenta', hex: '#FF1493', role: 'night-light' },
      { name: 'cyan', hex: '#00CED1', role: 'night-light' },
      { name: 'gray', hex: '#808080', role: 'shadow' },
    ],
    temperature: 'warm',
    contrast: 0.5,
    saturation: 0.4,
    relationships: 'complementary',
  },
  geometry: {
    primaryShape: 'cairn',
    arrangement: 'spiral',
    symmetry: 'approximate',
    proportions: { elementCount: 80, heightDecay: 0.85, densityGradient: 0.7 },
    constants: { goldenAngle: 2.399963 },
  },
  material: {
    surfaces: [{ name: 'river stone', reflectivity: 0.15, roughness: 0.85 }],
    lightInteraction: 'absorb',
    blendModes: ['multiply'],
  },
  feel: { energy: 0.3, intimacy: 0.75, order: 0.45, handmade: 0.9, ceremony: 0.7 },
  custom: {},
};

describe('toSVG', () => {
  it('produces valid SVG with xml declaration', () => {
    const svg = toSVG(mandalaParams);
    expect(svg).toContain('<?xml');
    expect(svg).toContain('<svg');
    expect(svg).toContain('</svg>');
  });

  it('contains positioned circle elements', () => {
    const svg = toSVG(mandalaParams);
    expect(svg).toContain('<circle');
    // Should have many circles for 80 elements
    const circleCount = (svg.match(/<circle/g) || []).length;
    expect(circleCount).toBe(80);
  });

  it('includes palette colors', () => {
    const svg = toSVG(mandalaParams);
    expect(svg).toContain('#C4A882');
    expect(svg).toContain('#CC7722');
  });

  it('includes color definitions in defs', () => {
    const svg = toSVG(mandalaParams);
    expect(svg).toContain('<defs>');
    expect(svg).toContain('linearGradient');
  });

  it('has viewBox attribute', () => {
    const svg = toSVG(mandalaParams);
    expect(svg).toContain('viewBox');
  });

  it('includes attribution comment', () => {
    const svg = toSVG(mandalaParams);
    expect(svg).toContain('abstract representation');
  });
});

describe('toPalette', () => {
  it('exports valid JSON palette', () => {
    const json = toPalette(mandalaParams, 'json');
    const parsed = JSON.parse(json);
    expect(parsed.colors).toHaveLength(6);
    expect(parsed.colors[0].name).toBe('warm stone');
    expect(parsed.colors[0].hex).toBe('#C4A882');
    expect(parsed.temperature).toBe('warm');
  });

  it('exports CSS custom properties', () => {
    const css = toPalette(mandalaParams, 'css');
    expect(css).toContain(':root {');
    expect(css).toContain('--color-primary: #C4A882');
    expect(css).toContain('--color-background: #F2EDE4');
    expect(css).toContain('extracted from');
  });

  it('exports Tailwind config', () => {
    const tw = toPalette(mandalaParams, 'tailwind');
    expect(tw).toContain('module.exports');
    expect(tw).toContain("'primary': '#C4A882'");
    expect(tw).toContain('colors:');
  });

  it('all formats include all palette entries', () => {
    for (const format of ['json', 'css', 'tailwind'] as const) {
      const output = toPalette(mandalaParams, format);
      expect(output).toContain('#C4A882');
      expect(output).toContain('#CC7722');
      expect(output).toContain('#F2EDE4');
    }
  });
});

describe('toLayoutSpec', () => {
  it('produces markdown with arrangement details', () => {
    const spec = toLayoutSpec(mandalaParams);
    expect(spec).toContain('# Layout Specification');
    expect(spec).toContain('spiral');
    expect(spec).toContain('approximate');
    expect(spec).toContain('cairn');
  });

  it('includes golden angle in constants table', () => {
    const spec = toLayoutSpec(mandalaParams);
    expect(spec).toContain('goldenAngle');
    expect(spec).toContain('2.399963');
  });

  it('includes proportions table', () => {
    const spec = toLayoutSpec(mandalaParams);
    expect(spec).toContain('elementCount');
    expect(spec).toContain('heightDecay');
  });

  it('includes responsive breakpoints', () => {
    const spec = toLayoutSpec(mandalaParams);
    expect(spec).toContain('Responsive');
    expect(spec).toContain('480');
    expect(spec).toContain('768');
  });

  it('includes feel mapping table', () => {
    const spec = toLayoutSpec(mandalaParams);
    expect(spec).toContain('Feel Mapping');
    expect(spec).toContain('Order');
    expect(spec).toContain('Handmade');
  });
});

describe('translateDesign', () => {
  it('routes to svg', () => {
    expect(translateDesign(mandalaParams, 'svg')).toContain('<svg');
  });

  it('routes to json palette', () => {
    const result = translateDesign(mandalaParams, 'json');
    expect(() => JSON.parse(result)).not.toThrow();
  });

  it('routes to css palette', () => {
    expect(translateDesign(mandalaParams, 'css')).toContain(':root');
  });

  it('routes to tailwind palette', () => {
    expect(translateDesign(mandalaParams, 'tailwind')).toContain('module.exports');
  });

  it('routes to layout spec', () => {
    expect(translateDesign(mandalaParams, 'layout')).toContain('# Layout');
  });
});
