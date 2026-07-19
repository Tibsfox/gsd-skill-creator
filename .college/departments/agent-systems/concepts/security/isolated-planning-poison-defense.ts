/**
 * Isolated-Planning Poison Defense -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/security/isolated-planning-poison-defense
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 110 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const isolatedPlanningPoisonDefense: RosettaConcept = {
  id: "agent-isolated-planning-poison-defense",
  name: "Isolated-Planning Poison Defense",
  domain: 'agent-systems',
  description:
    "Isolated-Planning Poison Defense, realized as the Tool-Guard system, counters cross-tool description poisoning, an attack surface distinct from prompt injection in which adversarial tool metadata steers an LLM agent's trajectory even when the poisoned tool is never selected (arXiv 2606.20922, 2026). Its key observation is that poisoned descriptions persist in the planning context across steps, exerting continuous influence over subsequent tool choices, and that existing prompt-injection defenses transfer poorly to this threat. The distinct contribution is isolated planning: once an invocation is flagged as misaligned or suspicious, the offending tool is moved to a quarantined \"influenced list\" that severs its descriptive reach while the tool itself remains callable for the task. On the AgentDojo and ASB benchmarks this reduces attack success while preserving utility. For agent builders it teaches quarantining influence rather than revoking capability.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-self-mutating-poisoning",
      description: "Both concern adversarial poisoning that lodges in an agent's persistent planning context; self-mutating poisoning is an adaptive variant whose cross-step persistence is exactly the influence isolated planning's quarantine is designed to sever.",
    },
    {
      type: "cross-reference",
      targetId: "agent-least-privilege-tool-selection",
      description: "Complementary tool-exposure defenses: least-privilege selection restricts which tools an agent may access, whereas isolated planning restricts how much a suspect tool's description may influence planning without revoking its availability.",
    },
    {
      type: "analogy",
      targetId: "skill-injection-guardian",
      description: "Tool-Guard's quarantine-the-influence-but-keep-the-tool tactic mirrors skill-injection-guardian's neutralize-the-embedded-instructions-but-keep-the-file defense, both isolating malicious steering while retaining the underlying artifact's legitimate function.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
