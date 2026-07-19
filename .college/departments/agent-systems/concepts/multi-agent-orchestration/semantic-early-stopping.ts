/**
 * Semantic Early-Stopping concept — agent-systems multi-agent-orchestration wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.27009 (2026).
 *
 * @module departments/agent-systems/concepts/multi-agent-orchestration/semantic-early-stopping
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 8 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const semanticEarlyStopping: RosettaConcept = {
  id: 'agent-semantic-early-stopping',
  name: 'Semantic Early-Stopping',
  domain: 'agent-systems',
  description: 'Semantic Early-Stopping is a termination rule for iterative Writer/Critic LLM agent loops that replaces the fixed max_iterations cap with a meaning-convergence test: after each revision round the current draft is embedded, and the loop halts when consecutive draft embeddings stop changing in meaning — cosine distance falling below a threshold sustained across a patience window — optionally gated by a quality plateau. Per arXiv:2606.27009 (2026), on the 60-question HotpotQA multi-hop retrieval-augmented QA test split a judge-free semantic stopper cut operational tokens by 38% relative to max_iterations at parity quality (Delta-IS = -0.004, p = 0.81), while the full quality-gated variant was counter-productive because its per-round LLM-judge calls dominated cost. The paper pairs this with an honest theoretical footing — machine-checked proofs of deterministic termination and well-definedness, with distance-sequence convergence treated as an empirically tested conjecture rather than a previously over-claimed Banach contraction — and a judge-efficient evaluation protocol that generates each trajectory once, replays every stopping policy over identical drafts, and caches judge calls, cleanly separating operational tokens (charged to a policy) from evaluation tokens (a measurement instrument). A best-round oracle beat every practical policy by +0.115 Information Score (p ~ 4e-11), reframing the task from "when to stop" (easy) to "which round is best" (open). Distinct from Critique-and-Route, which decides where to send a critiqued output; Semantic Early-Stopping instead decides whether the same loop should iterate again at all, treating embedding stagnation as the exit signal. For agent systems this means the ubiquitous max_iterations kill-switch leaves ~38% of tokens on the table on easy inputs while truncating hard ones, and a cheap embedding-distance monitor over successive drafts is a near-free upgrade — though the oracle gap warns that stopping alone cannot recover the best draft, only avoid wasted rounds.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Implement as a stateful stop-check over the running draft sequence: embed each new draft, compute cosine distance to the previous draft\'s embedding, and maintain a rolling patience counter. def should_stop(prev_emb, cur_emb, patience_state, eps=0.02, patience=2): d = 1 - cosine_similarity(prev_emb, cur_emb); patience_state = patience_state + 1 if d < eps else 0; return patience_state >= patience, patience_state. Halt when the counter reaches the patience window. Keep it judge-free — the paper shows adding a per-round LLM-judge quality gate erases the savings because judging cost dominates. Charge only the writer/critic tokens as operational; keep any offline judge calls as a separate measurement instrument so efficiency numbers stay honest.',
    }],
  ]),
  relationships: [
    {
      type: 'analogy',
      targetId: 'agent-adaptive-retrieval-stopping',
      description: 'Both replace a fixed budget with a dynamic, signal-driven stop; adaptive-retrieval-stopping halts the retrieve-more decision on information saturation, whereas semantic early-stopping halts the revise-again decision on draft-embedding convergence.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-critique-and-route',
      description: 'Operates on the same Writer/Critic revision loop but governs a different decision — whether to iterate again versus where to route the critiqued output — so the two compose over one loop.',
    },
    {
      type: 'dependency',
      targetId: 'agent-loop-specification',
      description: 'Semantic early-stopping is a termination policy that presupposes a specified iterative loop; it plugs into that loop\'s stop condition rather than defining the loop itself.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
