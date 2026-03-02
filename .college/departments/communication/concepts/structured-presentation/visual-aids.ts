import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const visualAids: RosettaConcept = {
  id: 'comm-visual-aids', name: 'Visual Aids', domain: 'communication',
  description: 'Visual aids (slides, props, whiteboards, videos) support spoken presentations but should never replace them. Effective slides have minimal text, clear visuals, and consistent design. The dual coding principle suggests that words and images together are remembered better than either alone. Death by PowerPoint occurs when slides substitute for, rather than enhance, the speaker.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'comm-presentation-structure', description: 'Visuals should align with and reinforce the spoken structure, not distract from it' }],
  complexPlanePosition: { real: 0.7, imaginary: 0.3, magnitude: Math.sqrt(0.49 + 0.09), angle: Math.atan2(0.3, 0.7) },
};
