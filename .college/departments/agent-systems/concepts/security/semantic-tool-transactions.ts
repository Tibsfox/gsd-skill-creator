/**
 * Semantic Tool Transactions -- agent-systems concept (June-2026 arXiv, Security & Governance wing).
 * @module departments/agent-systems/concepts/security/semantic-tool-transactions
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 102 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const semanticToolTransactions: RosettaConcept = {
  id: "agent-semantic-tool-transactions",
  name: "Semantic Tool Transactions",
  domain: 'agent-systems',
  description:
    "Agent runtimes still expose tools as isolated RPCs, which gives no task-scoped boundary for commit, rollback, recovery, and audit across a multi-step, stateful agent workflow. Cordon (arXiv 2606.17573, 2026) argues the fix is a runtime containment boundary rather than another per-call guardrail, and introduces the SEMANTIC TRANSACTION: a task-level execution boundary that binds tool intents and runtime-tracked result lineage to reversible local state, staged external effects, delegated authority, and audit metadata. A transaction manager runs reversible mutations in shadow state, stages outward-facing actions — an outbound email or a payment, say — in an effect outbox, records recovery metadata, and validates the composed execution flow before it commits state or releases those effects. On a 45-case adversarial suite Cordon intercepts all 45 policy-violating executions before commit, where strategy adapters ported from existing per-call defenses catch only 14/45, at modest overhead (about a 22.7% increase in mean task time driven mainly by approval waits, with roughly 4 ms median rollback). Implication for building agent systems: make the agent TASK, not the individual tool call, the unit of commit and rollback.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-capability-gate-authorization",
      description: "Complementary runtime layers: the authorization gate admits each call fail-closed, the transaction stages the composed sequence of authorized effects so it can be validated and rolled back before commit.",
    },
    {
      type: "cross-reference",
      targetId: "agent-episode-package",
      description: "The transaction's result lineage, staged effects, and recovery metadata are exactly the post-execution artifact the episode package records for audit.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "Validating the composed flow before commit is where compliance predicates gate a transaction — a semantic-transaction boundary gives those predicates a task-scoped point of enforcement.",
    },
    {
      type: "cross-reference",
      targetId: "agent-runtime-skill-spec-enforcement",
      description: "The reciprocal sibling link: this containment boundary (Cordon stages and rolls back tool effects) complements VIGIL's detection of skill-spec violations. Detection without containment cannot undo harm, and containment without detection has nothing to trigger the rollback.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
