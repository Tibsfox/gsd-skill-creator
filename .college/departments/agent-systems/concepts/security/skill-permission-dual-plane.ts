/**
 * Skill Permission Dual-Plane -- agent-systems concept (June-2026 arXiv, Security & Governance wing).
 * @module departments/agent-systems/concepts/security/skill-permission-dual-plane
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 100 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const skillPermissionDualPlane: RosettaConcept = {
  id: "agent-skill-permission-dual-plane",
  name: "Skill Permission Dual-Plane",
  domain: 'agent-systems',
  description:
    "A skill is a new security principal because it plays two roles at once: it can alter the agent's reasoning before any tool is called (the context-influence plane) and steer the agent toward actions with concrete side effects (the action plane). Existing defenses cover only one plane — file inspection before use, or per-tool-call constraints during execution — leaving the link between skill-level intent, contextual influence, and runtime behavior weakly governed. SkillGuard (arXiv 2606.03024, 2026) treats skills as permission-bearing executable artifacts and governs both planes jointly through a declared skill manifest, runtime permission control, user interaction, and policy enforcement; its taxonomy covers 99.93% of protected objects across 1,260 real skills, and on the SkillInject dataset it cuts attack-success from 35.3% to 20.7% for contextual injections and from 36.7% to 18.0% for obvious ones — a mitigation, not a cure, that leaves a residual ~19-21% ASR, with contextual injections the harder residual to defend. Distinct from the static per-skill privilege boundary, which is a single action-surface field: the dual-plane model adds the reasoning-influence surface. Implication for building agent systems: govern what a skill is allowed to INFLUENCE, not only what it is allowed to DO.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-privilege-boundary",
      description: "Extends the single action-surface privilege field with a second governance plane — the skill's influence on the agent's reasoning before any tool call is emitted.",
    },
    {
      type: "cross-reference",
      targetId: "agent-capability-gate-authorization",
      description: "Both separate exposure/influence from authorization: the dual-plane manifest declares what a call may do, and the authorization gate enforces it per call with concrete argument values.",
    },
    {
      type: "cross-reference",
      targetId: "skill-injection-guardian",
      description: "The shipped static-inspection defense covers the file plane at ingest; the dual-plane permission model adds runtime governance of contextual influence and side effects.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
