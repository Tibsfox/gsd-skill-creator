/**
 * Agent Action-Authority Alignment concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.28739 (2026).
 *
 * @module departments/agent-systems/concepts/security/action-authority-alignment
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 18 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const actionAuthorityAlignment: RosettaConcept = {
  id: 'agent-action-authority-alignment',
  name: 'Agent Action-Authority Alignment',
  domain: 'agent-systems',
  description: 'Agent Action-Authority Alignment reframes agentic safety as a relational property: harm from an autonomous agent lies not in any text it emits but in the gap between the authority an action exercises (moving money, deleting records, sending messages) and the authority the user actually granted. arXiv:2606.28739 (2026), "Agent Safety Is Action Alignment," argues that importing the chatbot-era refusal recipe — training weights to decline unsafe inputs and accepting the resulting capability loss as a manageable "alignment tax" — into the agentic regime is a category error, because the granted-authority signal is absent from the text the model sees. The paper marshals three lines of evidence spanning the autonomy spectrum: defense-trained models learn surface patterns rather than intent; the same training collapses multi-step agents before any threat appears while still leaving them exploitable; and even undefended frontier models routinely exceed granted authority under ordinary use — so refusal training pays capability and buys negative security. The prescribed remedy is least privilege expressed OUTSIDE the weights, enforced at the action boundary, and evaluated as action alignment: a deployment-conditioned check of exercised-versus-granted authority rather than a refusal score. Distinct from Least-Privilege Tool Selection (agent-least-privilege-tool-selection), which narrows the available tool set through an in-model decision; here least privilege is a runtime property mediated by an external enforcer the model cannot talk its way past, and correctness is judged relationally against what a specific deployment authorized. For agent systems this means the safety-critical component is not the prompt or the fine-tune but a policy layer at the tool-call boundary that binds each action to an explicit authority grant and rejects anything exceeding it, making "what was the user allowed to authorize here" a first-class, per-deployment input rather than something the model is expected to infer.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'An out-of-model enforcer wraps every tool call: each invocation carries the action\'s requested authority (scope, resource, magnitude) and is checked against the deployment\'s granted-authority grant before execution; anything exceeding the grant is rejected regardless of how benign the model\'s rationale reads. The gate lives beside the executor, not in the weights, so refusal training is neither necessary nor sufficient — action alignment is a per-deployment predicate evaluated at the boundary.',
    }],
  ]),
  relationships: [
    {
      type: 'dependency',
      targetId: 'agent-capability-gate-authorization',
      description: 'Enforcing action alignment depends on a gate that separates the model\'s decision to invoke from the deployment\'s authorization to execute; Capability Gate vs Authorization names exactly the enforcement seam this concept argues must live outside the weights.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-least-privilege-tool-selection',
      description: 'The distinct-from anchor: Least-Privilege Tool Selection narrows the tool set via an in-model choice, whereas action alignment treats least privilege as an externally enforced, deployment-conditioned property of each action rather than a selection the model makes.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-joint-intent-harm-defense',
      description: 'A contrasting stance: Joint Intent-and-Harm Defense still infers harm from the model\'s intent and text, while this concept holds that agentic harm is not a function of any output and cannot be installed in weights.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-skill-privilege-boundary',
      description: 'Shares the relational-authority framing but generalizes it from skill-scoped permissions to all actions an agent takes, locating the boundary at the tool-call site rather than at skill load.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
