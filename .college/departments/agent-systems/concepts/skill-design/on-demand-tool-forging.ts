/**
 * On Demand Tool Forging -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/on-demand-tool-forging
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 68 * 2 * Math.PI / 85;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const onDemandToolForging: RosettaConcept = {
  id: "agent-on-demand-tool-forging",
  name: "On Demand Tool Forging",
  domain: 'agent-systems',
  description:
    "Static tool inventories force agents to fail or improvise when no predefined tool fits a task. MetaForge (2026) closes a judge-retrieve-adapt-forge-recycle loop: a warrant gate first judges whether a new tool is even needed, then retrieves and adapts existing skills before synthesizing a fresh tool online only when justified, and recycles the result back into the library for later reuse. Making tool creation a runtime, need-gated decision that is amortized across tasks lets an agent's capability surface grow with demand instead of being frozen at design time.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "Specializes the skill-as-artifact view by making artifact creation an online, need-gated event: a forged tool is a first-class artifact minted mid-task and recycled into the library, not authored ahead of time.",
    },
    {
      type: "cross-reference",
      targetId: "agent-tool-contract-inference",
      description: "A distinct creation axis: contract inference recovers the latent spec of an existing tool, whereas forging synthesizes a wholly new tool when retrieve-and-adapt over the current library fails.",
    },
    {
      type: "cross-reference",
      targetId: "agent-trace-to-skill-induction",
      description: "Both convert runtime activity into reusable library skills; induction mines completed traces after the fact, while forging mints a tool mid-task the moment the warrant gate detects a capability gap.",
    },
    {
      type: "cross-reference",
      targetId: "agent-causal-tool-frontier",
      description: "The warrant gate deciding whether a new tool is needed operates at the tool frontier, judging where existing capabilities end and online synthesis becomes justified rather than wasteful.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
