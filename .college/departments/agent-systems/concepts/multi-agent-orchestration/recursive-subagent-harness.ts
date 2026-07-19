/**
 * Recursive Subagent Harness -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/multi-agent-orchestration/recursive-subagent-harness
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 127 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const recursiveSubagentHarness: RosettaConcept = {
  id: "agent-recursive-subagent-harness",
  name: "Recursive Subagent Harness",
  domain: 'agent-systems',
  description:
    "The Recursive Agent Harness (RAH) makes the recursive unit a full agent harness — filesystem tools, code execution, and planning — rather than a bare model call, extending the model recursion of recursive language models into a code-first harness recursion (arXiv 2606.13643, 2026). A parent agent generates and runs an executable script that spawns subagent harnesses in parallel for fine-grained workloads while reserving structured function calls for small subtasks, decomposing long-context reasoning across independently-tooled children. Its distinct contribution is isolating the harness itself, not the model, as the source of the gain: holding the backbone fixed at GPT-5, RAH lifts the Codex baseline from 71.75% to 81.36% on Oolong-Synthetic (199 samples across 13 context-length buckets reaching up to 4M tokens), and reaches 89.77% with Claude Sonnet 4.5. The implication for agent systems is that orchestration structure drives long-context performance, so spawned subagents should carry full tooling rather than merely receive prompts.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-harness-as-substrate",
      description: "RAH takes the entire agent harness, not a tool-less model call, as its recursive unit, depending on the view of the harness as a reusable substrate capable of hosting nested agents.",
    },
    {
      type: "cross-reference",
      targetId: "agent-llm-as-code",
      description: "The parent's core mechanism—generating and running an executable script that spawns children in parallel—is a concrete instance of treating LLM-authored code as the orchestration control plane.",
    },
    {
      type: "analogy",
      targetId: "agent-infrastructure-aware-orchestration",
      description: "Spawning subagent harnesses in parallel for fine-grained workloads mirrors infrastructure-aware orchestration, distributing long-context work across independently-provisioned, fully-tooled executors.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
