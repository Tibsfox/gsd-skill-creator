import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const learningStrategiesAwareness: RosettaConcept = {
  id: 'learn-learning-strategies-awareness',
  name: 'Learning Strategies Awareness',
  domain: 'learning',
  description:
    'Knowing which learning strategies work for which types of material — and why — distinguishes ' +
    'strategic learners from those who apply the same approach to every task. Dunlosky et al. ' +
    '(2013) rated 10 common study strategies: high-utility (retrieval practice, distributed ' +
    'practice), moderate utility (elaborative interrogation, self-explanation, interleaved ' +
    'practice), low utility (highlighting, rereading, keyword mnemonics). Strategy matching: ' +
    'conceptual understanding is built by elaboration (asking "why" and connecting to prior ' +
    'knowledge); procedural fluency is built by varied practice with feedback; factual recall is ' +
    'built by spaced retrieval practice. Transfer requires practice with varied contexts — ' +
    'blocked practice (all problems of one type) produces worse transfer than interleaved practice ' +
    '(mixed types). Common mismatch: visual learners spending time creating elaborate diagrams ' +
    'of verbal material — no consistent evidence supports matching learning "style" to input ' +
    'modality for retention outcomes.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-metacognition',
      description: 'Knowing which strategies to apply requires the metacognitive capacity to monitor and regulate learning',
    },
    {
      type: 'analogy',
      targetId: 'learn-self-assessment',
      description: 'Strategy awareness and self-assessment are complementary metacognitive skills for directing effective study',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.2025 + 0.3025),
    angle: Math.atan2(0.55, 0.45),
  },
};
