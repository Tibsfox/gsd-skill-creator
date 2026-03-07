import { describe, it, expect } from 'vitest';
import {
  translateToCanvas,
  translateToReact,
  translateToThreeJS,
  translateToCSS,
  translateCode,
} from './translation-code.js';
import type { ExtractedParameters } from './types.js';

const mandalaParams: ExtractedParameters = {
  color: {
    palette: [
      { name: 'warm stone', hex: '#C4A882', role: 'primary' },
      { name: 'ochre', hex: '#CC7722', role: 'accent' },
      { name: 'tarp white', hex: '#F2EDE4', role: 'background' },
      { name: 'magenta', hex: '#FF1493', role: 'night-light' },
      { name: 'cyan', hex: '#00CED1', role: 'night-light' },
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
    blendModes: ['multiply', 'screen'],
  },
  feel: { energy: 0.3, intimacy: 0.75, order: 0.45, handmade: 0.9, ceremony: 0.7 },
  custom: { acousticGeometry: true, conditionModes: ['daylight', 'night'] },
};

const gridParams: ExtractedParameters = {
  color: {
    palette: [
      { name: 'blue', hex: '#4682B4', role: 'primary' },
      { name: 'white', hex: '#FFFFFF', role: 'background' },
    ],
    temperature: 'cool',
    contrast: 0.6,
    saturation: 0.5,
    relationships: 'analogous',
  },
  geometry: {
    primaryShape: 'square',
    arrangement: 'grid',
    symmetry: 'symmetric',
    proportions: { elementCount: 25 },
    constants: {},
  },
  material: {
    surfaces: [{ name: 'tile', reflectivity: 0.5, roughness: 0.3 }],
    lightInteraction: 'reflect',
    blendModes: [],
  },
  feel: { energy: 0.1, intimacy: 0.3, order: 0.9, handmade: 0.1, ceremony: 0.2 },
  custom: {},
};

describe('translateToCanvas', () => {
  it('produces valid HTML with canvas element', () => {
    const html = translateToCanvas(mandalaParams);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<canvas');
    expect(html).toContain('</script>');
  });

  it('includes golden angle constant', () => {
    const html = translateToCanvas(mandalaParams);
    expect(html).toContain('2.399963');
  });

  it('includes palette colors', () => {
    const html = translateToCanvas(mandalaParams);
    expect(html).toContain('#C4A882');
    expect(html).toContain('#CC7722');
  });

  it('includes blend mode operations', () => {
    const html = translateToCanvas(mandalaParams);
    expect(html).toContain("globalCompositeOperation = 'multiply'");
  });

  it('includes animation for energy > 0.2', () => {
    const html = translateToCanvas(mandalaParams);
    expect(html).toContain('requestAnimationFrame');
  });

  it('no animation for low energy', () => {
    const html = translateToCanvas(gridParams);
    expect(html).not.toContain('requestAnimationFrame');
  });
});

describe('translateToReact', () => {
  it('produces JSX with default export', () => {
    const jsx = translateToReact(mandalaParams);
    expect(jsx).toContain('export default function');
    expect(jsx).toContain('useRef');
    expect(jsx).toContain('useEffect');
  });

  it('includes canvas ref', () => {
    const jsx = translateToReact(mandalaParams);
    expect(jsx).toContain('canvasRef');
  });
});

describe('translateToThreeJS', () => {
  it('produces HTML with Three.js CDN', () => {
    const html = translateToThreeJS(mandalaParams);
    expect(html).toContain('three.min.js');
    expect(html).toContain('THREE.Scene');
  });

  it('creates geometry from parameters', () => {
    const html = translateToThreeJS(mandalaParams);
    expect(html).toContain('SphereGeometry');
    expect(html).toContain('2.399963');
  });

  it('includes material properties', () => {
    const html = translateToThreeJS(mandalaParams);
    expect(html).toContain('roughness');
    expect(html).toContain('0.85');
  });
});

describe('translateToCSS', () => {
  it('produces HTML with CSS custom properties', () => {
    const html = translateToCSS(mandalaParams);
    expect(html).toContain('--color-');
    expect(html).toContain('#C4A882');
  });

  it('uses grid layout for grid arrangement', () => {
    const html = translateToCSS(gridParams);
    expect(html).toContain('grid');
  });

  it('includes blend mode', () => {
    const html = translateToCSS(mandalaParams);
    expect(html).toContain('mix-blend-mode: multiply');
  });

  it('adds animation for energy > 0.3', () => {
    const highEnergy = {
      ...mandalaParams,
      feel: { ...mandalaParams.feel, energy: 0.6 },
    };
    const html = translateToCSS(highEnergy);
    expect(html).toContain('@keyframes');
  });

  it('flags CSS limitations for spiral', () => {
    const html = translateToCSS(mandalaParams);
    expect(html).toContain('NOTE:');
  });
});

describe('translateCode', () => {
  it('routes to canvas', () => {
    const result = translateCode(mandalaParams, 'canvas');
    expect(result).toContain('<canvas');
  });

  it('routes to react', () => {
    const result = translateCode(mandalaParams, 'react');
    expect(result).toContain('export default');
  });

  it('routes to threejs', () => {
    const result = translateCode(mandalaParams, 'threejs');
    expect(result).toContain('THREE.Scene');
  });

  it('routes to css', () => {
    const result = translateCode(mandalaParams, 'css');
    expect(result).toContain('--color-');
  });

  it('returns null for non-code targets', () => {
    expect(translateCode(mandalaParams, 'design-spec')).toBeNull();
    expect(translateCode(mandalaParams, 'build-plan')).toBeNull();
  });
});
