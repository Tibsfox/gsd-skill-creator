import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const digitalMediaCreation: RosettaConcept = {
  id: 'diglit-digital-media-creation',
  name: 'Digital Media Creation',
  domain: 'digital-literacy',
  description: 'Creating presentations, graphics, video, and multimedia content effectively. ' +
    'Presentations: one idea per slide, visuals over bullets, sans-serif fonts for screens (16pt minimum). ' +
    'The "death by PowerPoint" failure mode: too much text, audience reads instead of listening. ' +
    'Image editing basics: cropping, resizing, color correction, appropriate file format ' +
    '(JPEG for photos, PNG for graphics with transparency, SVG for scalable icons). ' +
    'Video: capture, cut, sequence, add captions (accessibility required for public content). ' +
    'Accessibility: alt text for images, captions for audio, sufficient color contrast, ' +
    'keyboard navigation for interactive content. ' +
    'Audience analysis: who will see this, where will it be displayed, what do they need to understand?',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-visual-design',
      description: 'The same visual design principles apply to media creation as to data visualization',
    },
    {
      type: 'analogy',
      targetId: 'writ-drafting-discovery',
      description: 'Digital media creation follows the same iterative drafting and revision cycle as writing',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.4,
    magnitude: Math.sqrt(0.4225 + 0.16),
    angle: Math.atan2(0.4, 0.65),
  },
};
