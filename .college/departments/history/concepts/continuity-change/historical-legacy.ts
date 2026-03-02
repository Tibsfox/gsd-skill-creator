import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const historicalLegacy: RosettaConcept = {
  id: 'hist-historical-legacy',
  name: 'Historical Legacy & Memory',
  domain: 'history',
  description:
    'Historical legacy examines how past events continue to shape the present — through institutions, ' +
    'laws, borders, inequalities, cultural narratives, and trauma. Historical memory studies how societies ' +
    'remember (and forget) the past through monuments, textbooks, holidays, and oral traditions. ' +
    'These differ: the same events are remembered differently by different groups. ' +
    'Understanding legacy and memory reveals why history is never merely "the past."',
  panels: new Map(),
  relationships: [
    {
      type: 'dependency',
      targetId: 'hist-change-over-time',
      description: 'Legacy analysis tracks what persisted from the past into the present — the extreme slow-change case',
    },
  ],
  complexPlanePosition: {
    real: 0.5,
    imaginary: 0.65,
    magnitude: Math.sqrt(0.25 + 0.4225),
    angle: Math.atan2(0.65, 0.5),
  },
};
