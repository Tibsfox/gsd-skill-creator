import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const pairedTraceAudit: RosettaConcept = {
  id: 'agent-paired-trace-audit',
  name: 'Paired-Trace Audit',
  domain: 'agent-systems',
  description:
    'Run the same probe task twice — with the skill loaded and without — segment both traces into goal-directed phases, ' +
    'align phases, and emit a "skill influence pattern" (SIP) report covering surface anchoring, template copy, excess ' +
    'planning, task recovery, and off-task artifact. The 2026 finding (Wang et al., arxiv 2605.11946v1 CTA) is that ' +
    'pass-rate is blind to most skill effects: a single skill can produce 522 measurable behavioural changes across 49 ' +
    'tasks while pass-rate moves only +0.3%. The audit is therefore the dominant signal for skill quality — pass-rate ' +
    'remains a sufficient condition for shipping but is no longer a necessary one for measuring impact. The pattern ' +
    'generalises: any time you ship a configuration change to an agent system, the paired-trace comparison reveals what ' +
    'the change actually did, independent of headline metrics. Operationally implemented as a gate in `done-retirement` ' +
    'and as a regular health check.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-counterfactual-audit',
      description: 'Paired-trace audit is the concrete implementation of counterfactual audit (the abstract idea)',
    },
    {
      type: 'cross-reference',
      targetId: 'rosetta-execution-grounded-selection',
      description: 'Paired-trace audit is execution-grounded selection (Rosetta #9) applied to skills rather than to code outputs',
    },
  ],
  complexPlanePosition: {
    real: -0.6,
    imaginary: 0.5,
    magnitude: Math.sqrt(0.36 + 0.25),
    angle: Math.atan2(0.5, -0.6),
  },
};
