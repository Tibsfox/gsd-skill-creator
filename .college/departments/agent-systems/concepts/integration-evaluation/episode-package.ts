import type { RosettaConcept } from '../../../../rosetta-core/types.js';

export const episodePackage: RosettaConcept = {
  id: 'agent-episode-package',
  name: 'Episode Package',
  domain: 'agent-systems',
  description:
    "A post-execution artifact that captures everything the harness was responsible for during one task: the model " +
    'inputs and outputs, the tool calls, the privilege checks, the autonomy-ledger reads/writes, the retrieval traces, ' +
    'the spec-gate verdicts, and the final outcome. The 2026 framing (Zhong & Zhu, arxiv `2605.13357v1`) enumerates ' +
    'eleven harness responsibilities and argues that all eleven must be captured for an episode to be reproducible ' +
    'and auditable. Episode packages are the unit of analysis for downstream audit, retrospective generation, and ' +
    "calibration — without them, the system has no record of what it actually did, only of what it produced. The " +
    'pattern reframes "logging" from an ops convenience into a first-class deliverable of every dispatch.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-harness-as-substrate',
      description: 'The episode package captures the eleven harness responsibilities; the harness is its source',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-paired-trace-audit',
      description: 'Paired-trace audit reads two episode packages and computes the SIP report from their difference',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-compliance-trace-check',
      description: 'Compliance trace checks read episode packages and verify SMT predicates over the trace',
    },
  ],
  complexPlanePosition: {
    real: -0.2,
    imaginary: 0.6,
    magnitude: Math.sqrt(0.04 + 0.36),
    angle: Math.atan2(0.6, -0.2),
  },
};
