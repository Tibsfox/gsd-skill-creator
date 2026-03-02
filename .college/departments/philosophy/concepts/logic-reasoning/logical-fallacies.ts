import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const logicalFallacies: RosettaConcept = {
  id: 'philo-logical-fallacies',
  name: 'Logical Fallacies',
  domain: 'philosophy',
  description:
    'Logical fallacies are errors in reasoning that make arguments invalid or misleading. ' +
    'Formal fallacies violate rules of valid inference: affirming the consequent (If P then Q; Q; therefore P -- invalid), ' +
    'denying the antecedent (If P then Q; not P; therefore not Q -- invalid). ' +
    'Informal fallacies appear valid but rely on non-logical tricks: ' +
    'Ad hominem (attacking the person, not the argument), ' +
    'Straw man (misrepresenting an opponent\'s position), ' +
    'False dichotomy (presenting only two options when more exist), ' +
    'Slippery slope (claiming one step inevitably leads to extreme consequences without evidence), ' +
    'Appeal to authority (citing authority in wrong domain), ' +
    'Circular reasoning (begging the question -- conclusion restated as premise), ' +
    'Hasty generalization (drawing broad conclusions from insufficient examples). ' +
    'Recognizing fallacies does not refute a conclusion -- it shows the argument fails to support it.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'philo-argument-structure',
      description: 'Fallacies are deviations from valid argument structure',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.15,
    magnitude: Math.sqrt(0.49 + 0.0225),
    angle: Math.atan2(0.15, 0.7),
  },
};
