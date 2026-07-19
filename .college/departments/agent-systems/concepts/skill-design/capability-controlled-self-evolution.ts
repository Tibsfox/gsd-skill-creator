/**
 * Capability-Controlled Self-Evolution -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/skill-design/capability-controlled-self-evolution
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 94 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const capabilityControlledSelfEvolution: RosettaConcept = {
  id: "agent-capability-controlled-self-evolution",
  name: "Capability-Controlled Self-Evolution",
  domain: 'agent-systems',
  description:
    "A long-running agent that rewrites its own skills turns self-evolution into a privilege-escalation surface: every mutation is a chance to silently widen the resource authority it can reach. The 2026 invariant (Agent libOS, arXiv 2606.03895v2, 2026) closes this hole by splitting two mutation channels — model-visible affordances may change freely, while resource authority changes only through explicit, audited runtime primitives. Affordance drift is cheap and unlogged; authority drift is expensive, gated, and traced. Authority here is not a slogan but an enumerated set of classes — filesystem, shell, human, memory, process, checkpoint, image, JSON-RPC, MCP, and PTY — none of which a newly loaded skill, JIT tool, or checkpoint-derived image grants by itself. This adds the temporal dimension the static per-skill privilege field lacks: privilege stops being a fixed manifest field checked at one dispatch and becomes an invariant maintained across the agent's whole evolutionary trajectory. On 27 deterministic tasks the prototype completed every task plan while preventing all modeled unauthorized side effects, paying for that hard gate with a 7.0% conservative false-denial rate — whereas simple wrapper and sandbox baselines preserved task completion but failed most safety checks. Implication for building agent systems: let a self-modifying system freely reshape what it can see and attempt, but force every change to what it can actually reach through one narrow, auditable gate, and expect to over-deny at the margin.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-privilege-boundary",
      description: "Extends the static per-skill privilege field into a temporal invariant held across self-evolution, rather than a boundary checked only at a single dispatch.",
    },
    {
      type: "cross-reference",
      targetId: "agent-constraint-drift",
      description: "Unaudited affordance or authority mutation is how privilege drifts over a long run; this invariant bounds that drift to one traced channel.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compositional-skill-evolution",
      description: "Governs the resource-authority side of evolving skills: composition may freely grow affordances but never silently grow reach.",
    },
    {
      type: "analogy",
      targetId: "security-capability-model",
      description: "Maps capability-based security onto the time axis — capabilities may be re-exposed freely, but granting new authority requires an explicit, mediated primitive.",
    },
    {
      type: "cross-reference",
      targetId: "agent-held-out-evolution-gate",
      description: "The held-out evolution gate is the empirical-validation counterpart to this concept's a-priori capability control: where capability-controlled self-evolution constrains what a skill may become before the fact, the held-out gate measures whether an accepted mutation actually generalizes. The gate already links back here as its a-priori-vs-empirical contrast; this edge closes the reciprocal.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
