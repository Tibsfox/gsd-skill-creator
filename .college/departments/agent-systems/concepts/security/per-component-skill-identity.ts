/**
 * Per-Component Skill Identity -- agent-systems concept (June-2026 arXiv, Security & Governance wing).
 * @module departments/agent-systems/concepts/security/per-component-skill-identity
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 105 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const perComponentSkillIdentity: RosettaConcept = {
  id: "agent-per-component-skill-identity",
  name: "Per-Component Skill Identity",
  domain: 'agent-systems',
  description:
    "Governing skills fetched at runtime from marketplaces and other agents needs a stable notion of skill IDENTITY, yet cryptographic hashing is engineered to destroy the similarity we need — a one-character edit scrambles the digest. Per-component identity (arXiv 2606.31272, 2026) embeds each component of a skill and projects it to bits with a multi-bank SimHash, giving a fixed 120-byte locality-sensitive signature compared in constant time by Hamming distance. The central move is keeping the fingerprint as a per-component TRIPLE (prompt, code, tools) rather than a single score: the triple recovers skill-family identity through paraphrase, renaming, refactoring, and controlled code translation whenever another component stays shared, and it localizes WHICH component carries the reuse (AUC 0.974 over 4,950 pairs, 77x fewer bits than the embedding it approximates). It claims lineage, not behavioral equivalence — recognition is not trust — supplying the structural axis of a skill registry and a portable 'SkillBOM' while leaving safety to behavioral verification.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-skill-as-artifact",
      description: "Identity is a property of the skill-as-artifact; the per-component fingerprint gives that artifact a stable, similarity-preserving name that survives edits.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-resource-supply-chain",
      description: "On an injection benchmark the fingerprint recognizes a tampered skill as a modified copy of a known base and localizes the changed component — the code/resource plane of a supply-chain attack.",
    },
    {
      type: "cross-reference",
      targetId: "agent-verifiable-skill-contract",
      description: "Identity is complementary to behavioral verification: the fingerprint asserts 'same family', the verifiable contract asserts 'safe to run' — recognition is a structural axis, not a safety verdict.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
