import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const criticalThinkingFramework: RosettaConcept = {
  id: 'log-critical-thinking-framework',
  name: 'Critical Thinking Framework',
  domain: 'logic',
  description: 'Critical thinking is disciplined, self-directed thinking that meets high standards of clarity, accuracy, relevance, and fairness. ' +
    'Paul-Elder framework: elements of reasoning (purpose, question, information, interpretation, assumptions, concepts, implications, point of view) evaluated against intellectual standards. ' +
    'Intellectual standards: clarity, accuracy, precision, relevance, depth, breadth, logic, significance, fairness. ' +
    'Metacognition: thinking about your own thinking -- monitoring for biases, gaps, and errors in your reasoning process. ' +
    'Socratic questioning: asking clarifying questions to expose hidden assumptions and unstated premises. ' +
    'Intellectual virtues: humility (recognizing limits of knowledge), perseverance, courage, empathy, autonomy, integrity, confidence in reason. ' +
    'Confirmation bias: the tendency to seek information confirming existing beliefs -- the most pervasive barrier to critical thinking. ' +
    'Practical discipline: actively seek disconfirming evidence, steelman opposing views, check sources before sharing.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-informal-fallacies',
      description: 'Fallacy recognition is one component of critical thinking -- the framework gives context for why fallacy identification matters',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-cognitive-biases',
      description: 'Critical thinking is partly the practice of counteracting cognitive biases through systematic deliberation',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};
