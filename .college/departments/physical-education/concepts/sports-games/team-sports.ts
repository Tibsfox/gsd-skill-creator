import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const teamSports: RosettaConcept = {
  id: 'pe-team-sports',
  name: 'Team Sports',
  domain: 'physical-education',
  description:
    'Team sports develop cooperation, communication, positional awareness, and collective strategy. ' +
    'Invasion games (soccer, basketball, hockey, rugby) involve scoring in the opponent\'s territory ' +
    'while defending your own — requiring spatial awareness of teammates and opponents, transitional ' +
    'play (offense to defense), and role specialization. Net/wall games (volleyball, tennis, ' +
    'badminton) require anticipation of opponent placement and shot selection. Striking/fielding ' +
    'games (baseball, cricket, softball) require coordination between batting, fielding, and base ' +
    'running. Tactical understanding transfers across game categories: creating space, supporting ' +
    'the ball carrier, and defensive pressing appear in many sports. Social learning in team sports ' +
    'includes accepting different skill levels among teammates, communicating under pressure, and ' +
    'shared goal pursuit. Leadership roles rotate to develop communication and decision-making ' +
    'across all participants.',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'pe-sport-strategy',
      description: 'Team sports require applying sport strategy concepts to coordinated multi-player scenarios',
    },
  ],
  complexPlanePosition: {
    real: 0.7,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.49 + 0.09),
    angle: Math.atan2(0.3, 0.7),
  },
};
