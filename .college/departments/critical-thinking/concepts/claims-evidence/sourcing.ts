import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const sourcing: RosettaConcept = {
  id: 'crit-sourcing', name: 'Sourcing', domain: 'critical-thinking',
  description: 'Sourcing asks: who made this claim, when, why, and for what audience? Even reputable sources have biases and blind spots. Lateral reading (checking what other sources say about this source) is more effective than deep reading of a single source for source evaluation. The SIFT method (Stop, Investigate, Find better coverage, Trace claims) provides a practical sourcing framework.',
  panels: new Map(),
  relationships: [{ type: 'dependency', targetId: 'crit-evidence-quality', description: 'Source credibility is one dimension of overall evidence quality assessment' }],
  complexPlanePosition: { real: 0.65, imaginary: 0.45, magnitude: Math.sqrt(0.4225 + 0.2025), angle: Math.atan2(0.45, 0.65) },
};
