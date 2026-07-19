/**
 * Load-Bearing Eviction concept — agent-systems agent-memory wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.20954 (2026).
 *
 * @module departments/agent-systems/concepts/agent-memory/load-bearing-eviction
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 27 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const loadBearingEviction: RosettaConcept = {
  id: 'agent-load-bearing-eviction',
  name: 'Load-Bearing Eviction',
  domain: 'agent-systems',
  description: 'Learned Relevance Eviction (LRE) reframes long-horizon agent memory management as a fidelity problem rather than a summarization problem: when accumulated interaction history outgrows the context window and the agent must evict, dropping a single load-bearing unit — an access token issued at login, a file path the next call depends on — silently breaks the task even though most of the context was safe to discard. LRE is a tiny, few-kilobyte, CPU-only, language-model-free relevance scorer that learns which history units are load-bearing and preserves them by verbatim extraction rather than paraphrase or compression, so exact state survives eviction. Introduced in arXiv:2606.20954 (2026), it matches the accuracy of keeping the entire history under a matched-budget comparison while making zero compressor calls and cutting peak context size by up to 52%; on the simplest tasks it beats the no-eviction baseline by 27%, on LoCoMo it delivers the best budgeted answer quality while reading 68% fewer tokens, and its supervision can be annotation-free — training only on the system\'s own behavior recovers 95% of the supervised scorer\'s effectiveness. Distinct from Single-Token Memory Compression, which folds context into a learned dense representation and tolerates lossy re-expansion, LRE deliberately refuses to compress: it keeps decisive tokens byte-for-byte because a corrupted token is worse than a dropped one when exact state is what the next tool call consumes. For building agent systems the implication is that eviction should be a cheap, deployable, proactive policy that runs at every step where the future query is unavailable — a small learned classifier over raw history units, not a large-model summarizer — turning "what not to forget" into a self-supervised inference the agent trains from its own success and failure traces.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Implementation angle: an LRE-style evictor is a per-unit binary classifier, not a model call. Segment history into atomic units (a tool result, a login response, a path assignment), featurize each cheaply (does it contain a secret/token/path pattern, was it referenced by a later successful action, distance-since-last-use, source tool), and score keep-probability with a few-kilobyte logistic/GBM model that runs on CPU. Kept units are copied byte-for-byte into a pinned region of the prompt; everything else is evicted when the budget is exceeded. The label for self-supervision is annotation-free: replay the agent\'s own traces and mark a unit load-bearing if removing it would have changed a later successful call — recovering ~95% of a hand-supervised scorer. The key discipline is verbatim retention (never re-encode a kept token) so exact state reaches the next tool call intact.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-single-token-memory-compression',
      description: 'Both confront context-window overflow, but where Single-Token Memory Compression folds history into a learned dense token and accepts lossy re-expansion, LRE keeps load-bearing units verbatim and makes zero compressor calls — the sharp compress-vs-preserve contrast for exact-state fidelity.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-multi-factor-memory-valuation',
      description: 'LRE is a valuation-and-retention mechanism: its tiny learned scorer decides which history units to keep, a single-signal (load-bearing relevance) counterpart to Multi-Factor Memory Valuation\'s composite scoring of what memory to retain.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-anticipatory-memory',
      description: 'Both operate proactively where the future query is unavailable — Anticipatory Agent Memory pre-stages what will be needed, while LRE decides at each step what not to evict — two sides of forward-looking, query-blind memory management.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
