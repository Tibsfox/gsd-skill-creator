import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const aiLimitations: RosettaConcept = {
  id: 'diglit-ai-limitations',
  name: 'AI Capabilities & Limitations',
  domain: 'digital-literacy',
  description: 'What AI systems can and cannot do -- critical for informed use. ' +
    'Current AI strengths: pattern recognition (image classification, speech recognition), ' +
    'text generation, translation, game playing in well-defined environments. ' +
    'Key limitations: hallucination (generating plausible but false information confidently), ' +
    'lack of genuine understanding (statistical pattern matching, not reasoning), ' +
    'training cutoff (knowledge limited to training data date), ' +
    'brittleness (fails unexpectedly outside training distribution), ' +
    'no persistent memory across conversations (by default). ' +
    'AI as a tool: powerful for drafting, brainstorming, coding assistance, summarization -- ' +
    'not reliable for facts, medical advice, legal advice, or high-stakes decisions. ' +
    'Verification responsibility: always verify AI-generated claims against authoritative sources.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'code-ai-ml-fundamentals',
      description: 'Understanding ML fundamentals explains why hallucination occurs -- it is an inherent feature of probabilistic text generation',
    },
    {
      type: 'cross-reference',
      targetId: 'diglit-fact-checking',
      description: 'AI limitations make fact-checking AI output especially important',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.16 + 0.49),
    angle: Math.atan2(0.7, 0.4),
  },
};
