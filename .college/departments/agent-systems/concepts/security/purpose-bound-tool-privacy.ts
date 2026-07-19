/**
 * Purpose-Bound Tool Privacy -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/security/purpose-bound-tool-privacy
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 114 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const purposeBoundToolPrivacy: RosettaConcept = {
  id: "agent-purpose-bound-tool-privacy",
  name: "Purpose-Bound Tool Privacy",
  domain: 'agent-systems',
  description:
    "Purpose-Bound Tool Privacy audits whether an agent routes task-private atoms only to the tools and downstream sinks authorized to receive them, rather than measuring task success or final-response privacy alone. Introduced with ToolPrivacyBench (arXiv 2606.28061, 2026), a benchmark of synthetic privacy-sensitive business workflows and cases adapted from multi-tool function-calling suites, each case carries a policy knowledge base; after the agent executes against mock backends, an evaluator compares recorded tool arguments and backend audit logs against that policy to detect over-disclosure. Its distinct contribution is formalizing a need-to-know disclosure boundary enforced by trajectory-level auditing across an executed multi-tool trajectory, not just the final answer. The key implication: successful tool execution does not imply appropriate disclosure — an agent can complete a task while leaking unnecessary private information through intermediate calls, so agent systems must audit per-hop information flow.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-least-privilege-tool-selection",
      description: "Least-privilege selection restricts which tool an agent may invoke, while purpose-bound tool privacy restricts which private atoms flow into each invoked tool, extending the least-privilege principle from capability to information flow.",
    },
    {
      type: "dependency",
      targetId: "agent-compliance-trace-check",
      description: "Its need-to-know boundary is enforced by the same trace-versus-policy mechanism compliance-trace-check provides, comparing recorded tool arguments and backend audit logs against a per-case policy knowledge base to flag over-disclosure.",
    },
    {
      type: "analogy",
      targetId: "agent-capability-gate-authorization",
      description: "Deciding which tools and sinks may receive a private atom mirrors gating whether a capability may be exercised, but keys the gate on the data's stated purpose rather than on action permission.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
