import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const sportStrategy: RosettaConcept = {
  id: 'pe-sport-strategy',
  name: 'Sport Strategy',
  domain: 'physical-education',
  description:
    'Sport strategy is the application of tactical thinking to physical competition. ' +
    'The Teaching Games for Understanding (TGfU) approach develops tactical awareness ' +
    'before technique: understand WHY to position here before HOW to execute the skill. ' +
    'Invasion games (soccer, basketball, hockey) share strategic principles: maintain possession, ' +
    'create and use space, transition quickly between attack and defense. ' +
    'Net/wall games (tennis, volleyball, badminton) emphasize angle, depth, and tempo manipulation. ' +
    'Striking/fielding games (baseball, cricket) involve reading the defense and placing the ball. ' +
    'Transferable tactical concepts: 2v1 advantage exploitation, defensive pressure, ' +
    'switching play to the weak side, high-low combination play. ' +
    'Sport intelligence (game sense) develops through game play more than drill repetition.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-fundamental-movement',
      description: 'Sport strategy builds on fundamental movement skill proficiency',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
