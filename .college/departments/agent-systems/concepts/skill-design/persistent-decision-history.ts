/**
 * Persistent Decision History -- agent-systems concept (June-2026 arXiv cohort, T2).
 * @module departments/agent-systems/concepts/skill-design/persistent-decision-history
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 71 * 2 * Math.PI / 85;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const persistentDecisionHistory: RosettaConcept = {
  id: "agent-persistent-decision-history",
  name: "Persistent Decision History",
  domain: 'agent-systems',
  description:
    "Revising a skill while keeping only the final artifact discards why it changed — the diagnosis that triggered the edit, the evaluation evidence, the outcome, and the alternatives that were considered and rejected. SkillHone (arXiv 2606.08671v3, 2026) attaches each revision's decision trail to the skill as a first-class memory unit, so a later agent reads the reasoning behind a prior version instead of re-deriving it, and improves across sessions. The mechanism that makes the history consumable rather than merely stored: role-separated subagents run candidate skills on practice probes with redacted reporting, then propose revisions informed by the prior decision trail. On deep-research benchmarks this cross-session reuse — with no pre-integrated search stack — beats a commercially backed deep-research agent by +15.8 points on GAIA and +3.2 on WebWalkerQA-EN, and improves accuracy by +18.8 points on average across seven internal tool-mediated settings. The insight is process-as-memory: the revision history, not just the current skill, is the learnable object. Rejected alternatives are load-bearing — they record paths already ruled out, so an evolving library stops re-litigating settled decisions.",
  panels: new Map(),
  relationships: [
    {
      type: "dependency",
      targetId: "agent-counterfactual-audit",
      description: "Counterfactual audit weighs a skill's presence-vs-absence delta as a one-shot measurement; persistent decision history specializes it by durably storing that reasoning — above all the rejected-alternative branches, which are precisely the counterfactuals the audit considers — so the comparison is re-readable across sessions instead of recomputed each time.",
    },
    {
      type: "cross-reference",
      targetId: "agent-compositional-skill-evolution",
      description: "The create/improve/merge operators produce the revisions; the decision trail is the orthogonal memory layer recording why each operator fired, letting a later evolution step build on prior diagnoses and evidence rather than re-exploring the same paths.",
    },
    {
      type: "analogy",
      targetId: "agent-episode-package",
      description: "As an episode package makes one task's execution a reproducible, auditable artifact, a persistent decision trail makes one revision's reasoning a retained artifact — process, not just the produced skill, becomes the unit of downstream analysis.",
    },
    {
      type: "cross-reference",
      targetId: "agent-temporal-supersession-memory",
      description: "Supersession retires a stale skill version when a newer keyed record arrives; decision history keeps the superseded version's rationale readable, so the retirement stays interpretable and reversible rather than a silent overwrite.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
