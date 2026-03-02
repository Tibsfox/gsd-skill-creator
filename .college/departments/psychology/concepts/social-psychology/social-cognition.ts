import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const socialCognition: RosettaConcept = {
  id: 'psych-social-cognition',
  name: 'Social Cognition',
  domain: 'psychology',
  description: 'Social cognition is how we think about ourselves and others -- the cognitive processes underlying social behavior. ' +
    'Person perception: forming impressions of others. We make rapid trait judgments from minimal information (thin slices of behavior). ' +
    'Attribution: explaining the causes of behavior. Why did X do Y? Internal (personality) vs. external (situational) causes. ' +
    'Fundamental attribution error: overattributing others\' behavior to personality and underattributing to situations. ' +
    'Actor-observer asymmetry: we attribute our own behavior to situations and others\' behavior to their dispositions. ' +
    'Self-serving bias: attributing successes to internal factors and failures to external ones. ' +
    'Schemas: cognitive frameworks organizing knowledge about types of people, situations, events. ' +
    'Stereotypes: schemas about social groups -- efficient but often inaccurate, and can bias perception and behavior. ' +
    'Implicit associations: automatic associations between concepts (tested with IAT) -- can influence behavior without awareness.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-cognitive-development',
      description: 'Social cognition builds on general cognitive development -- theory of mind and perspective-taking are foundational social cognitive skills',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-cognitive-biases',
      description: 'Many cognitive biases are social in nature -- attribution errors, stereotyping, and in-group favoritism are both cognitive and social phenomena',
    },
  ],
  complexPlanePosition: {
    real: 0.55,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.3025 + 0.36),
    angle: Math.atan2(0.6, 0.55),
  },
};
