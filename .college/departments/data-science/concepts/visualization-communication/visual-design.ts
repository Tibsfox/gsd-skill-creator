import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const visualDesign: RosettaConcept = {
  id: 'data-visual-design',
  name: 'Visual Design Principles',
  domain: 'data-science',
  description: 'Pre-attentive attributes are visual properties processed before conscious attention: ' +
    'color hue, intensity, size, position, shape, orientation. ' +
    'Use pre-attentive attributes to direct viewer attention to the key insight. ' +
    'Color: use to encode categories (distinct hues) or magnitude (sequential palette). ' +
    'Always use colorblind-safe palettes (viridis, ColorBrewer) -- 8% of males are colorblind. ' +
    'Data-ink ratio (Tufte): maximize ink used to show data, minimize ink used for decoration. ' +
    'Gestalt principles: proximity, similarity, enclosure tell the brain what belongs together. ' +
    'Alignment and whitespace create professional, readable charts. ' +
    'Label axes with units. Title should state the conclusion, not just the variables.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'data-chart-types',
      description: 'Design principles apply after chart type is chosen -- enhance communication of the right chart',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-digital-media-creation',
      description: 'Data visualization is a form of digital media creation -- same design principles apply',
    },
  ],
  complexPlanePosition: {
    real: 0.6,
    imaginary: 0.45,
    magnitude: Math.sqrt(0.36 + 0.2025),
    angle: Math.atan2(0.45, 0.6),
  },
};
