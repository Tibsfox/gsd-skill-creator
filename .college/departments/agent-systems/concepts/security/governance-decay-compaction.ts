/**
 * Governance Decay via Compaction -- agent-systems concept (June-2026 arXiv, Security & Governance wing).
 * @module departments/agent-systems/concepts/security/governance-decay-compaction
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 104 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const governanceDecayCompaction: RosettaConcept = {
  id: "agent-governance-decay-compaction",
  name: "Governance Decay via Compaction",
  domain: 'agent-systems',
  description:
    "Long-running agents use context compaction, summarization, or eviction to stay within a token budget — and that context-management layer is itself a safety-critical failure surface. GOVERNANCE DECAY (arXiv 2606.22528, 2026): in-context governance constraints an agent reliably obeys while they are visible can be silently removed by compaction, so the same agent performs prohibited tool actions later in the same session. On the ConstraintRot benchmark (1,323 episodes, deterministic tool-call grading, measured across seven model families) violation rises from 0% with the policy in full context to 30% after compaction on average and up to 59% for the worst-affected family; when the constraint survives the summary violation stays 0%, but when it is dropped it reaches 38%. A Compaction-Eviction Attack biases the summarizer to omit a legitimate policy, and optimized injections defeat every model tested. Constraint Pinning — quarantining governance constraints from lossy compaction — is a training-free mitigation that restores violation to 0%. Implication: treat context management as a first-class governance surface and pin safety constraints out of compaction (directly relevant to this project's own compaction path).",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-constraint-drift",
      description: "Compaction is a concrete mechanism of constraint drift: safety constraints are lost not across delegation or tool use but across summarization and eviction of the context window.",
    },
    {
      type: "cross-reference",
      targetId: "agent-memory-consolidation",
      description: "Compaction and eviction are memory-consolidation operations; governance decay is the safety failure mode that appears when consolidation is lossy over governance constraints.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "A compliance trace that assumes the policy stays in context is silently defeated once compaction drops it; constraint pinning restores the premise the trace depends on.",
    },
    {
      type: "cross-reference",
      targetId: "agent-action-authority-alignment",
      description: "The reciprocal 'safety cannot live inside the model' pairing: governance decays because rules do not survive context-window compaction, while authority alignment fails because privilege cannot be reliably weight-encoded. Both demand an external enforcement layer that outlives the model's own state.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
