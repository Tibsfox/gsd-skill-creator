/**
 * Capability Gate vs Authorization -- agent-systems concept (June-2026 arXiv, Security & Governance wing).
 * @module departments/agent-systems/concepts/security/capability-gate-authorization
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 101 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const capabilityGateAuthorization: RosettaConcept = {
  id: "agent-capability-gate-authorization",
  name: "Capability Gate vs Authorization",
  domain: 'agent-systems',
  description:
    "Framework defaults conflate tool EXPOSURE with AUTHORIZATION: making a side-effecting tool available to an agent (capability gating) is not the same as authorizing a specific call with concrete argument values. When an agent reads untrusted content while holding tools for payments, email, CRM, or infrastructure, that gap is a confused-deputy vulnerability — the agent is steered into wielding authority it holds but should not use here. The ScopeGate audit (arXiv 2606.28679, 2026) finds LangChain/LangGraph, LlamaIndex, and the Stripe Agent Toolkit all provide capability gating by default but none a deterministic fail-closed per-call value-authorization gate. Its five-stage PDP/PEP — scope, authorization, money ceiling, idempotency, default-deny — re-authorizes each model-emitted call before execution, denying an unauthorized payout that executes under default dispatch. Implication: authorize the CALL, not the capability; default deny.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-privilege-boundary",
      description: "The privilege boundary declares which capabilities are exposed; per-call value authorization is the fail-closed enforcement step that exposure alone does not perform.",
    },
    {
      type: "cross-reference",
      targetId: "agent-semantic-tool-transactions",
      description: "Complementary runtime layers over tool calls: the gate re-authorizes each call, transactions stage and can roll back the composed sequence of authorized effects.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "The PDP/PEP decisions — scope, ceiling, idempotency, default-deny — are exactly the enforceable predicates a compliance trace validates against the agent's manual.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
