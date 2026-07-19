/**
 * Agent Skill-Edit Trait Vector concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.02536 (2026).
 *
 * @module departments/agent-systems/concepts/security/skill-edit-trait-vector
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 19 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const skillEditTraitVector: RosettaConcept = {
  id: 'agent-skill-edit-trait-vector',
  name: 'Agent Skill-Edit Trait Vector',
  domain: 'agent-systems',
  description: 'A method for auditing how an edit to an agent\'s steering text — a skill file, memory file, or behavioral config — shifts the agent\'s propensity along a named behavioral trait, without executing the agent. From arXiv:2606.02536 (2026), a trait is defined as a single direction in the embedding space of a text embedding model. A linear model is trained on labeled "before" versus "after" skill-file diffs to recover that trait vector; then any new edit is scored by embedding its before and after states, taking the embedding difference, and projecting that difference onto the trait vector. The resulting signed scalar says both whether the edit pushes toward the trait and how strongly. On 68 labeled diff pairs for propensity to seek sensitive data, the method reaches 91.2% sign-classification accuracy and Spearman rank correlation ρ=0.82 under leave-one-out cross-validation, and is wired into an agent-to-agent protocol where one agent evaluates another\'s skill updates through a trusted intermediary. Distinct from agent-skill-scanner-evasion, which pattern-matches surface content in a skill file and can be defeated by rephrasing: the trait vector operates on the semantic embedding delta and yields a continuous magnitude rather than a binary malicious/benign flag, so a paraphrased-but-equivalent edit still registers the same directional shift. Its scope is bounded: the vector measures one named trait direction at a time and must be fit from labeled before/after diffs, so it gauges drift along a chosen axis rather than delivering a general safety verdict. For building agent systems this supplies a cheap, quantitative admission gate on self-edits and peer-shared config, letting a supervisor rank and threshold updates by measured behavioral drift before they take effect.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Score a skill edit: embed the before/after files, take the diff, project onto the learned trait vector. delta = embed(after) - embed(before); score = float(delta @ trait_vec / (norm(trait_vec))). A positive score means the edit increases the trait (e.g. propensity to seek sensitive data); threshold the magnitude to quarantine edits that drift too far. trait_vec itself is the coefficient vector of a linear model fit on labeled before/after embedding diffs.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-skill-scanner-evasion',
      description: 'Both aim to catch unsafe skill-file edits, but the trait vector scores the semantic embedding delta as a continuous behavioral shift, resisting the surface rephrasing that defeats a static content scanner.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-federated-skill-evolution',
      description: 'The trait-projection score is embedded in an agent-to-agent protocol so peers can evaluate one another\'s shared skill updates through a trusted intermediary before adopting them.',
    },
    {
      type: 'dependency',
      targetId: 'agent-safety-rule-evolution',
      description: 'Provides the quantitative drift measurement needed to gate how an agent\'s safety-relevant configuration is allowed to evolve over successive edits.',
    },
    {
      type: "cross-reference",
      targetId: "agent-self-mutating-poisoning",
      description: "The trait vector scores an edit once, at admission time, from its before/after diff; self-mutating poisoning defeats exactly this by staying benign at ingest and rewriting its payload afterward, so a stale admission-time score no longer reflects the live skill. Names the temporal limit of a one-shot semantic gate against post-admission mutation.",
    },
    {
      type: "cross-reference",
      targetId: "agent-skill-resource-supply-chain",
      description: "The trait vector measures drift in the embedding delta of a skill's steering TEXT; supply-chain attacks hide malice in the auxiliary scripts and resources, not the prose. So the semantic-delta gate is blind precisely where resource-level payloads live, marking the boundary of what a prose-embedding audit can catch.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
