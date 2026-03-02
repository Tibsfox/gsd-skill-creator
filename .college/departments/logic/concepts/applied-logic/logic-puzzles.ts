import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const logicPuzzles: RosettaConcept = {
  id: 'log-logic-puzzles',
  name: 'Logic Puzzles and Problem Solving',
  domain: 'logic',
  description: 'Logic puzzles provide low-stakes practice for systematic reasoning under constraints. ' +
    'Knights and knaves puzzles (Smullyan): characters always tell truth or always lie -- determine who is who from statements. ' +
    'Constraint satisfaction: Sudoku, Einstein\'s riddle -- eliminate possibilities using logical deduction. ' +
    'Working method: write out all possibilities, use given information to eliminate, use process of elimination. ' +
    'Strategy: start with the most constrained positions. Use indirect proof (assume the opposite and derive contradiction). ' +
    'Logic grids: table-based method for categorical deduction puzzles ("the blue house is next to the white house"). ' +
    'Process of elimination: the core technique -- marking out what CANNOT be true converges on what MUST be true. ' +
    'Transfer to real problems: the same constraint satisfaction approach applies to scheduling, configuration, planning. ' +
    'Recreational logic builds intuition for formal reasoning in a way abstract exercises do not.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'log-validity-soundness',
      description: 'Logic puzzles are validity exercises -- each deduction step must be a valid inference from available premises',
    },
    {
      type: 'cross-reference',
      targetId: 'code-algorithms-efficiency',
      description: 'Constraint propagation algorithms solve the same puzzles computationally -- Sudoku solving and logic puzzle solving are instances of constraint satisfaction problems',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.35,
    magnitude: Math.sqrt(0.49 + 0.1225),
    angle: Math.atan2(0.35, 0.7),
  },
};
