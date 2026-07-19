/**
 * Agent-Native Computer Use -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/agentic-code-generation/native-computer-use
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 134 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const nativeComputerUse: RosettaConcept = {
  id: "agent-native-computer-use",
  name: "Agent-Native Computer Use",
  domain: 'agent-systems',
  description:
    "Agent-Native Computer Use rejects the dominant GUI-centric paradigm—where agents drive software by interpreting screenshots, locating UI elements, and issuing coordinate-based mouse clicks—as a fundamental misalignment with agent strengths (arXiv 2606.03854, 2026). CLI-Anything argues that forcing agents to emulate human perceptual limits produces brittle pixel-level interactions and timing dependencies that break when interfaces change. Its distinct move is to redesign the interaction surface itself: transform existing applications into command-line harnesses that preserve functionality while exposing structured commands, explicit state representations, and deterministic feedback through machine-readable protocols. This is more than generic tool-use or MCP — the novelty is retrofitting existing human-facing applications into machine-readable CLI harnesses rather than calling pre-built tools. As a position/vision paper it argues, rather than measures, that this eliminates the lossy visual-to-computational translation that plagues screen-reader-and-click-simulator stacks; the CLI-Hub platform operationalizes the proposed methodology, architecture, and infrastructure, but the source presents no head-to-head benchmark that agent-native CLI beats GUI agents. For building agent systems, the implication is to expose programmatic, deterministic control surfaces rather than automate human-facing GUIs.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-harness-as-substrate",
      description: "Operationalizing agent-native computer use requires treating the command-line harness itself as the primary substrate agents act on, exactly the framing agent-harness-as-substrate develops.",
    },
    {
      type: "cross-reference",
      targetId: "agent-tool-contract-inference",
      description: "The machine-readable protocols CLI-Hub exposes are the explicit tool contracts that agent-tool-contract-inference otherwise has to reconstruct from observed application behavior.",
    },
    {
      type: "analogy",
      targetId: "agent-operator-vocabulary-thesis",
      description: "Both hold that interaction primitives should match how agents natively operate—structured commands here, a curated operator vocabulary there—rather than mimicking human-facing controls.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
