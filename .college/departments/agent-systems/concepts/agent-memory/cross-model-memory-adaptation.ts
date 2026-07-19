/**
 * Cross-Model Memory Adaptation concept — agent-systems agent-memory wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.07711 (2026).
 *
 * @module departments/agent-systems/concepts/agent-memory/cross-model-memory-adaptation
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 9 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const crossModelMemoryAdaptation: RosettaConcept = {
  id: 'agent-cross-model-memory-adaptation',
  name: 'Cross-Model Memory Adaptation',
  domain: 'agent-systems',
  description: 'Cross-Model Memory Adaptation reframes agent memory as a cross-backbone transfer problem rather than a single-model store. Most memory systems are LLM-centric: they tune write and read operations to one backbone, so a note authored while Claude handled a coding step may fail to activate GPT when a later writing step is routed elsewhere, or when an agent switches models mid-task for cost reasons. Introduced in arXiv:2606.07711 (2026) as Rosetta Memory, the mechanism shifts to memory-centric LLM adaptation, attacking the upstream-downstream mismatch from both sides with two profile-conditioned operators — one that decides how an experience is stored, one that decides how it is presented — jointly trained so memory written by one model reliably drives a different downstream model. Two training ideas make the operators general: a minimum-gain sampling curriculum that prioritizes the least-served backbones during training so no model is starved, and a performance-gap reward that scores the operators against a naive-memory baseline, isolating the operators\' contribution from the downstream LLM\'s own capability. On HotpotQA, 2WikiMultihopQA, and MuSiQue the trained operators consistently beat baselines and stay robust when the downstream model is replaced by one unseen during training. Distinct from Memory Consolidation, which curates and compresses experience for a single evolving agent\'s own future reads, this mechanism optimizes for portability across heterogeneous backbones — the writer and reader are deliberately different models. For agent systems it means memory can become a durable substrate independent of any one provider: teams that route Claude, GPT, and open-weight models to different steps, or migrate providers between sessions, can carry accumulated experience across the boundary instead of re-earning it each time the backbone changes.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-memory-consolidation',
      description: 'Memory Consolidation curates and compresses experience for one evolving agent\'s own future reads; Cross-Model Memory Adaptation instead re-encodes and re-presents that stored experience so a different downstream backbone can activate it, making the writer and reader deliberately distinct models.',
    },
    {
      type: 'dependency',
      targetId: 'agent-model-dependency-audit',
      description: 'Cross-Model Memory Adaptation directly remediates the portability liability that Model Dependency Audit surfaces — memory whose value is silently bound to the backbone that authored it — by training write/read operators to survive backbone replacement.',
    },
    {
      type: 'analogy',
      targetId: 'agent-non-readable-inter-model-encoding',
      description: 'Both move information across a model boundary and optimize the encoding for the consuming model rather than for a human reader; Non-Readable Inter-Model Encoding does this for live agent-to-agent communication, whereas this mechanism does it for persistent, replayable memory.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
