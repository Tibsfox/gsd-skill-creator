/**
 * Agent Compiled Correction Enforcement concept — agent-systems skill-design wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.13174 (2026).
 *
 * @module departments/agent-systems/concepts/skill-design/compiled-correction-enforcement
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 21 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const compiledCorrectionEnforcement: RosettaConcept = {
  id: 'agent-compiled-correction-enforcement',
  name: 'Agent Compiled Correction Enforcement',
  domain: 'agent-systems',
  description: 'Agent Compiled Correction Enforcement is the pattern of turning a user\'s in-chat corrections into runtime PASS-gates that an agent must satisfy before it is allowed to mark a future task complete, rather than merely storing the correction as a memory the model may or may not consult. The named instance, TRACE (Test-time Rule Acquisition and Compiled Enforcement) from arXiv:2606.13174 (2026), is a drop-in skill-layer pipeline for coding-agent runtimes that mines corrections from the user\'s own chat, rewrites each into an atomic, self-contained rule, and compiles that rule into an executable check wired into the completion path — so a violated preference blocks task closure the way a failing test would, unlike developer-authored guardrails written ahead of time. It targets the gap the paper calls preference ACCESS versus preference COMPLIANCE: Mem0-style memory can recall a correction yet still leaves 57.5% of applicable preference checks violated. Compiled enforcement collapses that gap, cutting held-out preference violation on ClawArena from 100.0% to 37.6% in-distribution and from 100.0% to 2.0% out-of-distribution, while matching or beating the strongest memory baseline on task pass. Distinct from Trace-to-Skill Induction, which segments a trajectory into a reusable, generically applicable skill spec, this mechanism\'s unit of value is a single user correction and its output is a hard runtime gate on task completion, not a capability the agent gains. The implication for agent systems: persistence of a preference should be measured by whether the next run is blocked when it is violated, not by whether the preference can be retrieved — the enforcement path, not the memory store, is where "getting easier to work with over time" actually lives, so wire corrections into the completion gate.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'agent-knowing-doing-gap',
      description: 'The preference access-versus-compliance gap TRACE closes is the corrective-instruction instance of the knowing-doing gap: the agent demonstrably knows the rule (it is in memory) yet fails to act on it, and compiled enforcement is the do-side remedy.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-trace-to-skill-induction',
      description: 'Both mine a captured trace into a durable artifact, but induction produces a reusable skill spec whereas this compiles a single user correction into a hard runtime completion gate.',
    },
    {
      type: 'dependency',
      targetId: 'agent-runtime-skill-spec-enforcement',
      description: 'Compiled corrections are only load-bearing if the runtime actually blocks task completion on a failed check, so this pattern rides on the same must-pass-before-complete enforcement machinery.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
