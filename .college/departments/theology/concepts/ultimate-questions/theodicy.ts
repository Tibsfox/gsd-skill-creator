import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const theodicy: RosettaConcept = {
  id: 'theo-theodicy',
  name: 'Theodicy',
  domain: 'theology',
  description:
    'Theodicy (theos + dike = God + justice) addresses the problem of evil: if God is ' +
    'all-powerful, all-knowing, and perfectly good, why does evil and suffering exist? ' +
    'Epicurus\' formulation: God either cannot prevent evil (not omnipotent), will not ' +
    '(not benevolent), does not know about it (not omniscient), or evil does not exist -- ' +
    'but evil clearly does exist. Classical responses: ' +
    'Free will defense (Alvin Plantinga): God grants free will; moral evil results from ' +
    'human choice, not divine negligence. ' +
    'Soul-making theodicy (John Hick): suffering is necessary for character development ' +
    'and spiritual growth -- a perfect world would produce stunted souls. ' +
    'Protest theology (Elie Wiesel, after the Holocaust): God is put on trial and found guilty; ' +
    'yet faith continues. ' +
    'Buddhist response: there is no creator God; suffering arises from attachment and craving; ' +
    'the path is the response to suffering, not an explanation of its source.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'philo-applied-ethics',
      description: 'Theodicy connects to applied ethics in questions of suffering, justice, and the meaning of tragedy',
    },
  ],
  complexPlanePosition: {
    real: 0.2,
    imaginary: 0.8,
    magnitude: Math.sqrt(0.04 + 0.64),
    angle: Math.atan2(0.8, 0.2),
  },
};
