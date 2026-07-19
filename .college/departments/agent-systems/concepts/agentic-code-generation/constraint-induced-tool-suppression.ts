/**
 * Constraint Induced Tool Suppression -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/agentic-code-generation/constraint-induced-tool-suppression
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 51 * 2 * Math.PI / 85;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const constraintInducedToolSuppression: RosettaConcept = {
  id: "agent-constraint-induced-tool-suppression",
  name: "Constraint Induced Tool Suppression",
  domain: 'agent-systems',
  description:
    "Constrained decoding for JSON-schema structured output compiles the schema into grammar-based token masks that zero out any token the grammar forbids at each step. Enable structured output and tool calling together on an open-weight model and they collide: the schema grammar masks the very tokens that would begin a tool call, so the model silently stops invoking tools even though schema compliance and tool execution each work in isolation. Named Constraint Induced Tool Suppression (arXiv 2606.25605) and reproduced across multiple open-weight model families and deployment settings, it matters because both features appear enabled and no error is raised — the agent quietly loses its tools, so the two capabilities must be tested jointly, not separately. The authors offer the Constraint Priority Inversion (CPI) hypothesis — that schema satisfaction may dominate action-selection under simultaneous constraints — carefully framed as a behavioral hypothesis consistent with the evidence rather than a verified internal mechanism, and mitigate the failure with Transparent Two-Pass Execution: an inference-time strategy that decouples tool execution from schema-constrained response generation, restoring tool invocation while preserving structured-output guarantees without retraining.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-structured-spec-gate",
      description: "Specializes the structured-spec gate: where the parent enforces output conformance to a schema, this identifies the destructive case where that same schema-enforcement grammar masks tool-call tokens and disables the tool channel entirely.",
    },
    {
      type: "cross-reference",
      targetId: "agent-silent-failure-taxonomy",
      description: "A concrete instance of a silent failure — tools are never invoked yet no exception or degraded-output signal is emitted, so it belongs in and motivates the taxonomy of failures that evade error surfaces.",
    },
    {
      type: "analogy",
      targetId: "agent-skill-ir-compilation",
      description: "Analogous compilation hazard: just as compiling a skill spec into an executable intermediate representation can introduce behavior the source spec never intended, compiling a JSON schema into token-mask grammar produces a mask that suppresses intended tool actions.",
    },
    {
      type: "cross-reference",
      targetId: "agent-constraint-drift",
      description: "Sibling constraint-induced tool degradation — drift erodes correct tool use gradually across turns, whereas suppression eliminates it immediately at decode time via the schema grammar mask; both couple constraints to loss of tool behavior.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
