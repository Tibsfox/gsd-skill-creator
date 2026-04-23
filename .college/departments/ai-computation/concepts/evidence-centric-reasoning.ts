/**
 * Evidence-Centric Reasoning concept -- persisted CoT edges as graph structure.
 *
 * Penaroza (2026, arXiv:2604.07595) proposes reasoning graphs that persist per-evidence
 * chain-of-thought as structured edges. Traversal surfaces how specific evidence items
 * have been judged across prior runs. Self-improving without retraining: base model
 * stays frozen, all gains come from context engineering via graph traversal. Accuracy
 * rises and variance collapses over successive runs. Directly relevant to DACP's
 * three-part bundle structure, where each bundle becomes a graph node whose judgment
 * persists across sessions.
 *
 * @module departments/ai-computation/concepts/evidence-centric-reasoning
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~18*2pi/23, radius ~0.78 (procedural, well-grounded)
const theta = 18 * 2 * Math.PI / 23;
const radius = 0.78;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const evidenceCentricReasoning: RosettaConcept = {
  id: 'ai-computation-evidence-centric-reasoning',
  name: 'Evidence-Centric Reasoning',
  domain: 'ai-computation',
  description: 'Evidence-Centric Reasoning treats every piece of evidence used in a ' +
    'chain-of-thought as a persistent graph node whose judgments accumulate across ' +
    'sessions. Penaroza (2026) demonstrates that this form of context engineering ' +
    'delivers measurable accuracy gains and variance collapse over successive runs ' +
    'without any weight updates to the base model. The pattern differs in kind from ' +
    'query-similarity retrieval: retrieval surfaces candidate evidence, while an ' +
    'evidence-centric graph surfaces how that evidence has previously been judged. ' +
    'For gsd-skill-creator, this is the pattern that makes the DACP three-part ' +
    'bundle structure cumulative: each bundle is a graph node carrying its ' +
    'accumulated judgment history, which turns successive CAPCOM decisions into a ' +
    'self-improving feedback loop.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-harness-as-object',
      description: 'The harness object is where evidence-centric reasoning graphs are maintained across sessions',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-alignment-drift',
      description: 'Evidence-centric traversal can detect alignment drift by surfacing when evidence judgment shifts across runs without new information',
    },
    {
      type: 'cross-reference',
      targetId: 'data-science-compression-spectrum',
      description: 'Reasoning graphs occupy a specific position on the memory-skills-rules compression spectrum: edges compress per-evidence judgment into a declarative rule-like form',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
