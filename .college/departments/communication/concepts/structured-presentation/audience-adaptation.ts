import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const audienceAdaptation: RosettaConcept = {
  id: 'comm-audience-adaptation', name: 'Audience Adaptation', domain: 'communication',
  description: 'Every presentation decision -- vocabulary, examples, level of detail, tone, humor -- should be calibrated to the specific audience. Audience analysis asks: What do they already know? What do they care about? What are they expecting? Adapting to audience is what distinguishes communication from broadcasting.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-presentation-structure', description: 'Audience needs should drive structural choices in presentations' }],
  complexPlanePosition: { real: 0.6, imaginary: 0.5, magnitude: Math.sqrt(0.36 + 0.25), angle: Math.atan2(0.5, 0.6) },
};
