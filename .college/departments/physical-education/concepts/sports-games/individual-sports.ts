import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const individualSports: RosettaConcept = {
  id: 'pe-individual-sports',
  name: 'Individual Sports',
  domain: 'physical-education',
  description:
    'Individual sports place performance accountability on the single athlete, developing ' +
    'self-regulation, goal-setting, and personal challenge orientation. Track and field events ' +
    '(sprints, jumps, throws) require mastering isolated technical skills with clear, measurable ' +
    'performance benchmarks. Swimming combines aerobic endurance with stroke mechanics: freestyle ' +
    'technique (catch, pull, push phases; bilateral breathing), flip turns, and pacing. Gymnastics ' +
    'develops body control, spatial awareness, strength-to-weight ratio, and aesthetic performance. ' +
    'Cycling, rowing, and combat sports each require unique technique-fitness integration. ' +
    'Individual sports cultivate intrinsic motivation (personal best as the target), honest ' +
    'self-assessment (no teammates to credit or blame), and mental toughness — managing anxiety ' +
    'without team support structures. For students who struggle with team dynamics, individual ' +
    'sports offer full physical education engagement.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'pe-team-sports',
      description: 'Individual and team sports develop complementary physical and psychological competencies',
    },
    {
      type: 'dependency',
      targetId: 'pe-fundamental-movement',
      description: 'Individual sports refine the fundamental movement skills established in movement foundations',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
