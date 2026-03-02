import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const collaborativeLearning: RosettaConcept = {
  id: 'learn-collaborative-learning',
  name: 'Collaborative Learning',
  domain: 'learning',
  description:
    'Collaborative learning structures — study groups, peer tutoring, cooperative learning ' +
    'formats — leverage social interaction to deepen understanding beyond individual study. ' +
    'Peer instruction (Mazur): students explain concepts to each other, revealing and correcting ' +
    'misconceptions more effectively than expert re-explanation. The generation effect: explaining ' +
    'material to others requires constructing an explanation, which is itself a retrieval and ' +
    'elaboration activity. Cooperative learning structures (Jigsaw, Think-Pair-Share, Team-Based ' +
    'Learning) distribute responsibility and create positive interdependence. Effective study ' +
    'groups: members prepare individually before meeting, focus sessions on problem-solving not ' +
    're-reading, rotate explanation roles, and set specific learning goals. Risks to mitigate: ' +
    'social loafing (some members not contributing), incorrect knowledge propagation (the blind ' +
    'leading the blind), and convergence on wrong answers through social pressure. Metacognitive ' +
    'awareness of group dynamics improves collaborative learning outcomes.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'learn-study-environment',
      description: 'Collaborative learning requires careful management of the study environment for productive group interaction',
    },
  ],
  complexPlanePosition: {
    real: 0.65,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.4225 + 0.1225),
    angle: Math.atan2(0.35, 0.65),
  },
};
