/**
 * Agent Instruction-Hierarchy Repair concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.07808 (2026).
 *
 * @module departments/agent-systems/concepts/security/instruction-hierarchy-repair
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 14 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const instructionHierarchyRepair: RosettaConcept = {
  id: 'agent-instruction-hierarchy-repair',
  name: 'Agent Instruction-Hierarchy Repair',
  domain: 'agent-systems',
  description: 'Agent Instruction-Hierarchy Repair is a white-box approach to diagnosing and fixing why a reasoning model fails to obey an instruction hierarchy — the rule that when instructions from different sources (system, developer, user, tool output) conflict, the model must follow the highest-privilege applicable one. Rather than scoring compliance end-to-end, arXiv:2606.07808 (2026) decomposes any non-compliant response into exactly which of three sequential stages broke: instruction identification (the model never located the relevant instructions in context), conflict resolution (it located them but resolved the priority wrongly), or response realization (it resolved the conflict correctly in its reasoning yet still emitted a violating output). Evaluating Gemma-4-31B-IT, Qwen3.6-35B-A3B, and Claude Sonnet 4.6 on long-context adaptations of IHEval and IHChallenge, the paper finds the dominant failure stage shifts across model, task, and context length — so a single aggregate compliance number hides where the fix belongs. Because models can often detect a conflict when explicitly asked, the authors add two training-free self-monitors: a parallel input monitor that flags conflicts before generation at low latency, and a sequential output monitor that reviews and repairs the drafted response. The strongest monitor cuts rule-following non-compliance by 81-99%, with GPT-5.3 dropping 86% under static attacks and 45% under adaptive attacks. Distinct from agent-capability-gate-authorization, which decides whether a requested action is permitted at the tool boundary, this mechanism operates inside the model\'s own reasoning to localize and repair a mis-ordering of textual instructions before any action is taken. For agent systems this means privilege-violation defenses should be staged and observable: instrument identify/resolve/realize separately, attach a cheap pre-generation conflict detector, and gate emission through a post-generation repair pass rather than trusting a single compliance score.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-capability-gate-authorization',
      description: 'Both concern privilege enforcement, but capability-gate-authorization decides whether a requested action is permitted at the tool boundary, while instruction-hierarchy-repair localizes and repairs mis-ordering of conflicting textual instructions inside the model\'s reasoning before any action.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-compliance-trace-check',
      description: 'Complementary observability: compliance-trace-check verifies whether a trajectory honored its rules, while this concept decomposes a non-compliant trace into which of the identify/resolve/realize stages actually broke.',
    },
    {
      type: 'analogy',
      targetId: 'agent-streaming-guardrail',
      description: 'The sequential output monitor is a post-generation review-and-repair guardrail analogous to streaming-guardrail\'s emission-time interception, but keyed to privilege-ordering violations rather than content filtering.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
