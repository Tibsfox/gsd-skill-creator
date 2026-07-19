import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dynamicAutonomy: RosettaConcept = {
  id: 'agent-dynamic-autonomy',
  name: 'Dynamic Autonomy',
  domain: 'agent-systems',
  description:
    "Autonomy that tightens on correction and loosens on clean runs, rather than being fixed once per mission. " +
    'Hedwig (arxiv `2605.11495v1`, "Dynamic Autonomy for Coding Agents Under Local Oversight") is a CLI coding agent ' +
    'that treats autonomy as a moving target: motivated by a formative survey of 21 software engineers who found ' +
    'calibrating autonomy frustrating and held evolving oversight preferences, it learns an evolving set of ' +
    'behavioral guidelines from developer decisions and feedback across sessions. Each correction lowers the autonomy ' +
    'floor (more confirmation gates, smaller batches, more explicit acknowledgement); each clean run raises it. The ' +
    'pattern is the opposite of one-shot per-mission autonomy settings — autonomy emerges from the interaction ' +
    "record, not from a global fixed configuration. Closes the failure mode where an agent system feels right at " +
    'first run but drifts toward over-confidence as the task distribution shifts.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-fast-slow-coevolution',
      description: 'Dynamic autonomy is the fast/slow pattern applied to authorisation rather than to topology',
    },
    {
      type: 'dependency',
      targetId: 'agent-counterfactual-audit',
      description: 'The intent-recovery audit that attributes corrections is a counterfactual audit',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-harness-as-substrate',
      description: 'The autonomy ledger lives at the harness layer, between model and environment',
    },
  ],
  complexPlanePosition: {
    real: 0.4,
    imaginary: 0.3,
    magnitude: Math.sqrt(0.16 + 0.09),
    angle: Math.atan2(0.3, 0.4),
  },
};
