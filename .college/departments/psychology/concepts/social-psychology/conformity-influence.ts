import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const conformityInfluence: RosettaConcept = {
  id: 'psych-conformity-influence',
  name: 'Conformity and Social Influence',
  domain: 'psychology',
  description: 'Humans are profoundly social -- our beliefs and behavior are shaped by those around us. ' +
    'Asch conformity experiments: 75% of participants conformed to obviously wrong group answers at least once -- social pressure overrides perception. ' +
    'Normative influence: conforming to fit in, gain approval, avoid rejection. Informational influence: conforming because others seem to know better. ' +
    'Milgram obedience studies: ~65% of participants administered apparently lethal electric shocks when instructed by authority -- situational power of authority. ' +
    'Bystander effect: the more bystanders present, the less likely any one will help -- diffusion of responsibility and pluralistic ignorance. ' +
    'Cialdini\'s 6 principles of influence: reciprocity, commitment, social proof, authority, liking, scarcity. ' +
    'Group polarization: discussion among like-minded people pushes positions more extreme. ' +
    'Groupthink: desire for harmony suppresses dissent, leading groups to make poor decisions. ' +
    'Minority influence: persistent, consistent minorities can shift majority opinion over time -- social change requires minority influence.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'psych-social-cognition',
      description: 'Conformity works through social cognitive mechanisms -- we update beliefs based on what others seem to believe',
    },
    {
      type: 'cross-reference',
      targetId: 'log-critical-thinking-framework',
      description: 'Conformity and groupthink are barriers to critical thinking -- intellectual courage requires resisting social pressure toward incorrect conclusions',
    },
  ],
  complexPlanePosition: {
    real: 0.45,
    imaginary: 0.7,
    magnitude: Math.sqrt(0.2025 + 0.49),
    angle: Math.atan2(0.7, 0.45),
  },
};
