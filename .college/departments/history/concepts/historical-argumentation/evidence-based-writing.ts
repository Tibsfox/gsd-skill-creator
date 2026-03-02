import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const evidenceBasedWriting: RosettaConcept = {
  id: 'hist-evidence-based-writing',
  name: 'Evidence-Based Historical Writing',
  domain: 'history',
  description:
    'Historical writing marshals evidence — quotations, statistics, specific events, and examples — ' +
    'to support an argument. Effective historical writers don\'t just cite sources; they explain what each ' +
    'piece of evidence shows, why it is reliable, and how it advances the argument. ' +
    'The DBQ (Document-Based Question) essay format explicitly trains this skill by requiring ' +
    'integration of multiple primary source documents into a coherent argument.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-thesis-construction',
      description: 'Evidence-based writing requires a thesis to provide the argument that evidence supports',
    },
    {
      type: 'dependency',
      targetId: 'hist-source-analysis',
      description: 'Each piece of evidence must be analyzed for reliability before being incorporated into writing',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};
