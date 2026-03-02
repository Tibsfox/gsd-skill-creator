import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const managingPresentationAnxiety: RosettaConcept = {
  id: 'comm-managing-presentation-anxiety', name: 'Managing Presentation Anxiety', domain: 'communication',
  description: 'Public speaking anxiety is nearly universal and manageable. Strategies include reframing arousal as excitement, thorough preparation, practice (out loud, not just in your head), focusing on the audience rather than yourself, and accepting that some nervousness is normal and useful. Over time, exposure reduces anxiety. Preparation is the single most effective intervention.',
  panels: new Map(),
  relationships: [{ type: 'analogy', targetId: 'crit-growth-mindset-thinking', description: 'Treating presentation anxiety as manageable through practice reflects a growth mindset' }],
  complexPlanePosition: { real: 0.65, imaginary: 0.45, magnitude: Math.sqrt(0.4225 + 0.2025), angle: Math.atan2(0.45, 0.65) },
};
