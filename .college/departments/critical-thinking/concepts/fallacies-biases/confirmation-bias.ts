import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const confirmationBias: RosettaConcept = {
  id: 'crit-confirmation-bias', name: 'Confirmation Bias', domain: 'critical-thinking',
  description: 'Confirmation bias is the tendency to seek, favor, and remember information that confirms existing beliefs while discounting contradicting evidence. It operates unconsciously and affects everyone. Strategies to counter it: actively seek disconfirming evidence, consider the opposing view seriously, and subject one\'s own beliefs to the same scrutiny applied to others\' claims.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-metacognitive-monitoring', description: 'Metacognition is needed to notice when confirmation bias is affecting one\'s own reasoning' }],
  complexPlanePosition: { real: 0.5, imaginary: 0.65, magnitude: Math.sqrt(0.25 + 0.4225), angle: Math.atan2(0.65, 0.5) },
};
