/**
 * Trace-to-Skill Induction -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/skill-design/trace-to-skill-induction
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 129 * 2 * Math.PI / 47;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const traceToSkillInduction: RosettaConcept = {
  id: "agent-trace-to-skill-induction",
  name: "Trace-to-Skill Induction",
  domain: 'agent-systems',
  description:
    "Skills need not be hand-authored: they can be induced backwards from heterogeneous interaction evidence (demonstrations, trajectories, tool traces, execution logs) by segmenting each trace into reusable units (arXiv 2606.06893v1, 2026). The finding is that a soundly induced skill decomposes into three layers: workflow structure (the ordered scaffold), execution semantics (what each step means and mutates), and runtime attachments capturing verification, safety, rollback, and state management. This W2S/RWSA decomposition names an axis the IR manifest omits: a compilation manifest declares tools, inputs, dependencies, ordering, and output shape, but nothing about how to verify a step, roll it back, or recover mid-run. The implication: the library grows from what the agent already did rather than from what an author remembered to write, each induced entry carrying its own safety envelope.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-skill-ir-compilation",
      description: "Extends the IR by reversing its direction (trace-to-skill, not spec-to-target) and adding a runtime-attachment layer — verification, safety, rollback, state — that the tools/inputs/deps/ordering/output-shape manifest cannot express.",
    },
    {
      type: "cross-reference",
      targetId: "agent-tool-contract-inference",
      description: "Sibling recover-from-evidence mechanism: contract inference reconstructs one tool's interface from traces, while induction reconstructs a whole reusable skill from the same trajectory evidence.",
    },
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "Induction is the automatic producer of the typed skill artifact that compilation, audit, and provenance all presuppose — it fills the library without an author.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-privilege-boundary",
      description: "The safety runtime attachment of an induced skill is where its privilege boundary is captured, so induction must emit that boundary rather than leave it undeclared.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
