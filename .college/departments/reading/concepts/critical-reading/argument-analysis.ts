import type { RosettaConcept } from '../../../../rosetta-core/types.js';
export const argumentAnalysis: RosettaConcept = {
  id: 'read-argument-analysis',
  name: 'Argument Analysis',
  domain: 'reading',
  description: 'Analyzing argumentative texts means identifying the author\'s claim, the evidence provided (facts, statistics, expert opinion, anecdote), and the reasoning that connects them. Evaluating the strength of an argument requires assessing evidence quality, identifying assumptions, and noting what the author does not address.',
  panels: new Map(),
  relationships: [
    { type: 'dependency', targetId: 'read-author-purpose-perspective', description: 'Argument analysis builds on recognizing persuasive purpose and author perspective' },
    { type: 'cross-reference', targetId: 'crit-argument-structure', description: 'Critical thinking provides the structural framework for reading arguments' },
  ],
  complexPlanePosition: { real: 0.5, imaginary: 0.65, magnitude: Math.sqrt(0.25 + 0.4225), angle: Math.atan2(0.65, 0.5) },
};
