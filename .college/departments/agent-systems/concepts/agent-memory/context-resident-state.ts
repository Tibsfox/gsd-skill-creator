/**
 * Agent Context-Resident State concept — agent-systems agent-memory wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.22953 (2026).
 *
 * @module departments/agent-systems/concepts/agent-memory/context-resident-state
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 3 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const contextResidentState: RosettaConcept = {
  id: 'agent-context-resident-state',
  name: 'Agent Context-Resident State',
  domain: 'agent-systems',
  description: 'Agent Context-Resident State names an empirically demonstrated property: the plan an LLM agent writes early in a trajectory does not become persistent hidden state that the model carries forward — it stays load-bearing only while its tokens remain in the context window. arXiv:2606.22953 (2026) establishes this with replay pairing, a diagnostic that runs the identical trajectory once with and once without the plan in history and measures the cosine distance between the two hidden states at a probe layer (L32). On Llama-3.1-70B the plan signal spikes to 0.453 one action-observation step after the plan is written, then decays 4.1x in a single step (12.4x on HotpotQA), evidence that the agent does not internalize the plan but re-reads it from context. Reasoning models introduce a reasoning-trace confound — their think blocks re-derive plan content and contaminate the stripped condition — which the authors fix with strict stripping, recovering +163% of the step+1 signal in-sample and +153% held out while barely moving non-reasoning Llama (+4.8%). The signal is model-specific in its encoding: a Llama-trained probe transfers to DeepSeek-R1-Distill-Llama-70B at AUROC 0.748 while R1-specific probes reach 1.000, indicating each model carries the plan signal in a different hidden-state direction. The practical stress test is stark: naive plan eviction cuts ALFWorld success by 34.7pp, and probe-gated re-surfacing does not fully recover it. Distinct from Memory Consolidation, which promotes session traces into durable storage; here the finding is that plan information is never consolidated into weights or hidden state at all and is simply destroyed by eviction. For building agent systems, this means context compaction must be treated as a load-bearing operation with an explicit plan-protection budget, and persistence can never be assumed just because critical information was once "seen" in the window.',
  panels: new Map(),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-load-bearing-eviction',
      description: 'Both establish that context eviction is load-bearing rather than free; this concept supplies the mechanistic diagnostic — replay-paired plan-signal decay — that explains why eviction of a still-needed plan is so costly.',
    },
    {
      type: 'analogy',
      targetId: 'agent-experience-internalization-collapse',
      description: 'Mirror-image failures of internalization: internalization-collapse shows training-time experience failing to become durable capability, while context-resident state shows inference-time plans failing to become durable hidden state and remaining external in the window.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-context-proprioception',
      description: 'Context proprioception is an agent sensing its own context state; this concept motivates why that sensing is load-bearing, since agent-critical plan information lives only in context and vanishes when compacted.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
