import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const innovationInvention: RosettaConcept = {
  id: 'tech-innovation-invention',
  name: 'Innovation & Invention',
  domain: 'technology',
  description:
    'Invention creates something new; innovation makes the new thing useful and adopted. ' +
    'TRIZ (Theory of Inventive Problem Solving) is a systematic methodology for innovation identifying 40 ' +
    'inventive principles and contradiction resolution strategies. ' +
    'Disruptive innovation (Clayton Christensen) initially underperforms established products but addresses overlooked markets ' +
    'before eventually displacing incumbents. ' +
    'Technology S-curves describe the typical trajectory of performance improvement over time.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'prob-lateral-thinking',
      description: 'TRIZ and other innovation methodologies apply structured lateral thinking to technical contradictions',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.75,
    magnitude: Math.sqrt(0.2025 + 0.5625),
    angle: Math.atan2(0.75, 0.45),
  },
};
