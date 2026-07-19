/**
 * Least-Privilege Tool Selection -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/security/least-privilege-tool-selection
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 112 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const leastPrivilegeToolSelection: RosettaConcept = {
  id: "agent-least-privilege-tool-selection",
  name: "Least-Privilege Tool Selection",
  domain: 'agent-systems',
  description:
    "Least-Privilege Tool Selection studies over-privileged tool selection: an LLM agent choosing or escalating to a higher-privilege tool despite a sufficient lower-privilege alternative (arXiv 2606.20023, 2026). Its distinct contribution is ToolPrivBench, which evaluates privilege-sensitive choices — both initial selection and escalation after transient tool failures — across eight domains and five recurring risk patterns, reframing tool selection as a safety problem rather than a safety-agnostic metadata preference. The paper finds over-privileged selection common and amplified by transient failures, that general safety alignment does not reliably transfer to least-privilege choice, and that prompt-level controls only weakly mitigate; it then introduces a privilege-aware post-training defense that teaches agents to prefer sufficient lower-privilege tools and escalate only when necessary while preserving capability. For agent builders, it implies privilege must be an explicit selection criterion, not an emergent side effect of alignment.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-skill-privilege-boundary",
      description: "Both minimize granted privilege, but skill-privilege-boundary bounds a skill's static capability surface at authoring time, whereas least-privilege tool selection governs the agent's runtime choice among tools of differing privilege.",
    },
    {
      type: "dependency",
      targetId: "agent-capability-gate-authorization",
      description: "The 'escalate only when necessary' rule depends on a capability gate to authorize the jump to a higher-privilege tool once a lower-privilege alternative has demonstrably failed.",
    },
    {
      type: "analogy",
      targetId: "agent-dynamic-autonomy",
      description: "Just as dynamic autonomy scales an agent's granted freedom to task difficulty, least-privilege tool selection scales granted privilege to task necessity, holding at the lowest sufficient level until insufficiency is shown.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
