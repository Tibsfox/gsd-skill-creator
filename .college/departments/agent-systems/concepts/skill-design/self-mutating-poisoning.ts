/**
 * Self Mutating Poisoning -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/self-mutating-poisoning
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 77 * 2 * Math.PI / 85;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const selfMutatingPoisoning: RosettaConcept = {
  id: "agent-self-mutating-poisoning",
  name: "Self Mutating Poisoning",
  domain: 'agent-systems',
  description:
    "Fixed-payload skill poisoning ships one malicious instruction that a single-session review can catch. Self-mutating poisoning, characterized by SkillHarm (arXiv 2606.02540), instead ships a package that executes benignly on first invocation and then silently rewrites its own payload across later sessions, so the harmful behavior never appears in the audited state. Review certifies one point in a skill's lifecycle rather than its whole trajectory, meaning any task that later invokes the skill can be compromised. SkillHarm measures attack success rates up to 86.3% for fixed-payload and 69.3% for self-mutating poisoning, and classifies harms across three workflow-component axes — data pipelines, system environments, and agent autonomy. Its sharpest defensive warning: many apparent attack failures come from the agent never engaging with the poisoned file at all, not from genuine resistance, so a low observed success rate overstates real safety. Ingesting third-party skills therefore demands re-verification at load time and cross-session change detection, not one-time vetting.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "skill-injection-guardian",
      description: "Specializes the guardian's threat model along a temporal axis. The guardian's static ingest-time rewrite certifies a fixed payload; self-mutating poisoning defeats one-time certification by rewriting itself after ingest, so it forces the guardian's DYNAMIC load-time mediation to run every session rather than trusting the ingest scan.",
    },
    {
      type: "cross-reference",
      targetId: "agent-content-addressed-storage",
      description: "Content addressing is a direct detector for this attack: because a mutated payload produces a different content hash, pinning skills by hash surfaces exactly the silent lifecycle rewrite that self-mutating poisoning relies on to evade single-session review.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-privilege-boundary",
      description: "Enforcing a per-invocation privilege boundary caps the blast radius even after a payload has mutated, so the two defenses compose: content-hash detection exposes the mutation while the privilege boundary contains what a compromised skill can do at load time.",
    },
    {
      type: "analogy",
      targetId: "agent-capability-controlled-self-evolution",
      description: "Both concern a skill or agent modifying itself over its lifecycle; self-mutating poisoning is the adversarial mirror of legitimate capability-gated self-evolution, showing why unbounded self-modification must be governed rather than trusted after one audit.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
