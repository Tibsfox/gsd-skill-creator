import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const fundamentalMovement: RosettaConcept = {
  id: 'pe-fundamental-movement',
  name: 'Fundamental Movement Skills',
  domain: 'physical-education',
  description:
    'Fundamental movement skills (FMS) are the building blocks of all physical activity. ' +
    'Locomotor skills move the body through space: running, jumping, hopping, skipping, ' +
    'galloping, sliding, leaping. Non-locomotor skills stabilize the body: bending, ' +
    'stretching, twisting, turning, balancing, pushing, pulling. Manipulative skills ' +
    'involve objects: throwing, catching, kicking, striking, dribbling, volleying. ' +
    'The critical period for FMS development is ages 2-7; failure to develop FMS correlates ' +
    'with reduced physical activity in adolescence and adulthood. ' +
    'FMS proficiency assessment uses the Test of Gross Motor Development (TGMD): ' +
    'each skill is scored on 3-5 performance criteria evaluated by observation. ' +
    'Spatial awareness (personal vs. general space, levels, directions, pathways) provides ' +
    'the conceptual framework for understanding how movement relates to the environment.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-fitness-training',
      description: 'Fundamental movement skills are the prerequisite for sport and fitness training',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.2,
    magnitude: Math.sqrt(0.25 + 0.04),
    angle: Math.atan2(0.2, 0.5),
  },
};
