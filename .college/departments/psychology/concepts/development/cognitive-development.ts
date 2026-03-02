import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const cognitiveDevelopment: RosettaConcept = {
  id: 'psych-cognitive-development',
  name: 'Cognitive Development',
  domain: 'psychology',
  description: 'Cognitive development is the growth of thinking, reasoning, language, and problem-solving abilities across the lifespan. ' +
    'Core knowledge: infants arrive with primitive concepts of physics, number, and intentionality -- not a blank slate. ' +
    'Theory of mind: the ability to understand that others have different beliefs, desires, and perspectives -- emerges ~4 years. ' +
    'False belief tasks: "Sally puts ball in basket. Anne moves ball to box while Sally is away. Where will Sally look?" -- measures theory of mind. ' +
    'Executive function development: working memory, inhibitory control, and cognitive flexibility develop through childhood and adolescence. ' +
    'Language and thought: Vygotsky argued language shapes thought -- inner speech becomes the tool for self-regulation and abstract reasoning. ' +
    'Crystallized vs. fluid intelligence: fluid (novel problem-solving) peaks in 20s-30s; crystallized (accumulated knowledge) grows into old age. ' +
    'Metacognition: thinking about thinking -- develops in adolescence and enables strategic learning. ' +
    'Neuroplasticity and learning: the brain reorganizes with experience throughout life, though critical periods show heightened plasticity.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-developmental-stages',
      description: 'Cognitive development follows developmental stages -- Piaget\'s stages are specifically a theory of cognitive development',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-memory-consolidation',
      description: 'Cognitive development builds on memory systems -- the developing hippocampus and prefrontal cortex enable increasingly sophisticated learning',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.55,
    magnitude: Math.sqrt(0.3025 + 0.3025),
    angle: Math.atan2(0.55, 0.55),
  },
};
