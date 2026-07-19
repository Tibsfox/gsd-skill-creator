/**
 * Retriever Weight-Editing Attack -- agent-systems concept (June-2026 arXiv additional scan, T2).
 * @module departments/agent-systems/concepts/security/retriever-weight-editing-attack
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 115 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const retrieverWeightEditingAttack: RosettaConcept = {
  id: "agent-retriever-weight-editing-attack",
  name: "Retriever Weight-Editing Attack",
  domain: 'agent-systems',
  description:
    "CAREATTACK is a model-centric attack that injects malicious knowledge into retrieval-augmented generation by editing the retriever's parameters rather than the corpus (arXiv 2606.18310, 2026). It proceeds in two stages: conflict-aware retriever editing applies closed-form parameter edits to a dense retrieval model, promoting malicious passages above benign competitors and resolving parameter conflicts through graph-based conflict detection and an editing-projection step; then attack-preserving anchor repair lightly calibrates the edited retriever to remove side effects on non-target prompts while keeping the attack effective for targeted ones. Because synthetic malicious corpora are often detectable, moving the attack into the weights of widely reused open-source retrievers exposes a stealthier surface. For agent builders, it shows that vetting a knowledge base is insufficient: the retriever checkpoint itself must be treated as untrusted and integrity-verified.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-self-mutating-poisoning",
      description: "Both stealthily inject adversarial knowledge into RAG, but self-mutating poisoning corrupts the corpus data plane whereas CAREATTACK edits the retriever's weights, evading the corpus detection that catches data-centric attacks.",
    },
    {
      type: "cross-reference",
      targetId: "agent-model-dependency-audit",
      description: "Because CAREATTACK weaponizes reused open-source retriever checkpoints, model-dependency auditing that verifies the provenance and integrity of retriever weights is the natural defense this attack motivates.",
    },
    {
      type: "analogy",
      targetId: "agent-in-weight-skill",
      description: "CAREATTACK's closed-form parameter editing embeds malicious knowledge directly into retriever weights, the adversarial mirror of internalizing a capability as an in-weight skill.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
