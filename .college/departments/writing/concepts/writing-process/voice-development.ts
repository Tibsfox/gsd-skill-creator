import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const voiceDevelopment: RosettaConcept = {
  id: 'writ-voice-development',
  name: 'Voice Development',
  domain: 'writing',
  description: 'Voice is the quality that makes your writing sound like you and nobody else. ' +
    'It emerges from: sentence rhythm (short punchy vs. long discursive), ' +
    'word choices (Latinate or Anglo-Saxon, technical or plain), ' +
    'what you notice and emphasize, your characteristic preoccupations. ' +
    'Voice is developed through volume: the more you write, the more it emerges. ' +
    'Imitation exercises: write a page in Hemingway\'s style, then in Toni Morrison\'s -- ' +
    'understanding different voices helps you find your own. ' +
    'Voice vs. style: voice is relatively consistent across your work; style can vary by project. ' +
    'Academic writing often suppresses voice -- learning when voice is appropriate matters. ' +
    'The paradox: strong personal voice often makes writing more universal, not less.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'writ-drafting-discovery',
      description: 'Voice emerges through accumulated drafts -- you cannot discover it without extensive writing',
    },
    {
      type: 'cross-reference',
      targetId: 'lang-multilingual-identity',
      description: 'Code-switching between languages mirrors the writer\'s code-switching between registers and voices',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.2025 + 0.4225),
    angle: Math.atan2(0.65, 0.45),
  },
};
