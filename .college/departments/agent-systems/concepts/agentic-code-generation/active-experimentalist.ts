/**
 * Active Experimentalist Agent -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agentic-code-generation/active-experimentalist
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 132 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const activeExperimentalist: RosettaConcept = {
  id: "agent-active-experimentalist",
  name: "Active Experimentalist Agent",
  domain: 'agent-systems',
  description:
    "Hierarchical Experimentalist Agents (HExA) is a training-free, in-context self-improvement framework that lets a black-box LLM learn by actively experimenting rather than relying on parametric knowledge, retrieval, or search (arXiv 2606.29315, 2026). Facing a novel long-horizon task, HExA iteratively designs and refines query-relevant experiments, runs them through simulation or tool APIs, distills a reusable library of composable skills from the resulting experience, and integrates the accumulated evidence to answer the query or act. It requires no external supervision, oracles, or offline data. Its distinct contribution is closing the gap between knowing facts and acting competently in unfamiliar systems: evaluated on Interphyre -- a tool-calling benchmark built on the PHYRE 2D procedural-physics environment, where agents propose interventions and test hypotheses through simulation APIs -- it lifts Claude Sonnet 4.6 from 2% to up to 77% success, and skills learned on easier levels then transferred without any further experimentation still reach 44%, outperforming agentic baselines such as ReAct and Reflexion. For agent builders, it argues that runtime intervention and hypothesis testing should be first-class capabilities, not just recall.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-knowing-doing-gap",
      description: "HExA is a direct remedy for the knowing-doing gap: it turns an agent's inert parametric knowledge into competent action in novel systems by grounding decisions in evidence gathered through active experimentation rather than recall.",
    },
    {
      type: "cross-reference",
      targetId: "agent-exploration-skill-discovery",
      description: "Both acquire a reusable library of composable skills through self-directed exploration rather than supervision, but HExA specifically drives that discovery with query-relevant experiments run against simulation and tool APIs.",
    },
    {
      type: "analogy",
      targetId: "agent-answer-conditioned-information-gain",
      description: "HExA's iterative design of query-relevant experiments mirrors answer-conditioned information gain, choosing interventions expected to most reduce uncertainty about the specific query the agent must resolve.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
