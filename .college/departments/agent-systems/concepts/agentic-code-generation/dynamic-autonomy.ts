import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const dynamicAutonomy: RosettaConcept = {
  id: 'agent-dynamic-autonomy',
  name: 'Dynamic Autonomy',
  domain: 'agent-systems',
  description:
    "Per-task-class autonomy that tightens on correction and loosens on clean runs. The 2026 framing (Hedwig, arxiv " +
    '`2605.11495v1`) treats autonomy as a moving ledger, not a static configuration: every correction the user makes ' +
    'on a task class lowers the autonomy floor for that class (more confirmation gates, smaller batches, more ' +
    'explicit acknowledgement); every clean run raises it. Two timescales: the ledger updates online per correction, ' +
    'and an offline intent-recovery audit runs post-execution to attribute corrections correctly. The pattern is the ' +
    'opposite of one-shot per-mission autonomy settings — autonomy emerges from the trajectory record, not from ' +
    "configuration. Closes the failure mode where an agent system feels right at first run but drifts toward " +
    'over-confidence as the task distribution shifts.',
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
