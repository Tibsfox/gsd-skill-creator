import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const informalFallacies: RosettaConcept = {
  id: 'log-informal-fallacies',
  name: 'Informal Fallacies',
  domain: 'logic',
  description: 'Informal fallacies are errors in reasoning that stem from content or context rather than logical form. ' +
    'Ad hominem: attacking the person rather than the argument. "You can\'t trust his economic views -- he went bankrupt." ' +
    'Straw man: misrepresenting an opponent\'s argument to make it easier to attack. ' +
    'False dichotomy: presenting two options as the only possibilities when others exist. "You\'re either with us or against us." ' +
    'Appeal to authority: "X is true because expert Y said so" -- problematic when the authority is irrelevant or consensus is ignored. ' +
    'Slippery slope: claiming A will inevitably lead to Z without establishing the chain. ' +
    'Circular reasoning (begging the question): the conclusion is hidden in a premise. "The Bible is true because it says so." ' +
    'Appeal to popularity: "Everyone believes X, so X must be true." ' +
    'Post hoc ergo propter hoc: "A followed B, therefore A caused B." ' +
    'Recognizing fallacies in the wild requires both naming them and explaining why the specific argument fails.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-argument-structure',
      description: 'Identifying fallacies requires first understanding what a valid argument structure looks like',
    },
    {
      type: 'cross-reference',
      targetId: 'psych-cognitive-biases',
      description: 'Many fallacies exploit cognitive biases -- social proof drives appeal to popularity; availability heuristic drives slippery slope fears',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
