/**
 * Joint Intent-and-Harm Defense -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/security/joint-intent-harm-defense
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 113 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const jointIntentHarmDefense: RosettaConcept = {
  id: "agent-joint-intent-harm-defense",
  name: "Joint Intent-and-Harm Defense",
  domain: 'agent-systems',
  description:
    "Joint Intent-and-Harm Defense is a verification-centric safety framework that evaluates a prompt's adversarial intent and its generated response's actionable harm together, before the response reaches the user (arXiv 2606.26377, 2026). Specialized analysts score intent and harm independently, and a Judge resolves their conflicts into a single deliver-or-block decision. Its distinct contribution is targeting attacks that separate intent expressed in the prompt from harm manifested only in the response — interactions that appear benign to prompt-only or response-only defenses viewed in isolation. Formalizing a prompt-response threat model across jailbreaks, prompt injection, phishing, cyber abuse, and harmful content, joint verification lifts average F1 from 0.90 for the strongest applicable baselines to 0.95 while cutting average attack success rate to 4.1%, and against a Single-Agent+CoT baseline it drops the false-positive rate on benign-sensitive requests from 0.12 to 0.06 — outperforming single-sided and single-agent reasoning baselines while resisting architecture-aware adaptive attacks. For agent systems, it argues for a two-sided delivery gate: mediate the prompt-response boundary rather than trusting either half alone.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-intent-routing",
      description: "Both classify prompt intent, but Joint Intent-and-Harm Defense pairs that intent read with an independent response-harm read behind a Judge, whereas intent-routing uses the intent classification only to pick a downstream retrieval or reasoning strategy.",
    },
    {
      type: "cross-reference",
      targetId: "agent-isolated-planning-poison-defense",
      description: "Both are security-wing verifiers, but this framework gates the prompt-response boundary at delivery time while isolated-planning-poison-defense guards the earlier planning stage against injected or poisoned content.",
    },
    {
      type: "analogy",
      targetId: "skill-injection-guardian",
      description: "Each layers two complementary defenses hardened against adversaries who know the structure — static plus dynamic mediation of untrusted files here, intent-side plus harm-side analysts with a conflict-resolving Judge there.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
