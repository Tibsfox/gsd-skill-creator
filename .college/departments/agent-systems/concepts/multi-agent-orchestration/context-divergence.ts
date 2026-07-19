/**
 * Agent Context Divergence concept — agent-systems multi-agent-orchestration wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.21666 (2026).
 *
 * @module departments/agent-systems/concepts/multi-agent-orchestration/context-divergence
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 2 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const contextDivergence: RosettaConcept = {
  id: 'agent-context-divergence',
  name: 'Agent Context Divergence',
  domain: 'agent-systems',
  description: 'Agent Context Divergence names the failure mode in which concurrent LLM agents in a collaborative task hold mismatched or stale internal representations of shared world state, so their joint reasoning over those inconsistent knowledge-states produces contradictions that surface as hallucination — reframing a whole class of multi-agent hallucination not as model incapacity but as a distributed-systems synchronization problem. arXiv:2606.21666 (2026) operationalizes it with two instruments: the Context Divergence Score (CDS), a lightweight scalar quantifying knowledge-state discrepancy between agent pairs across spatial, temporal, and task dimensions, and the Shared State Verification Protocol (SSVP), in which agents periodically exchange compressed state summaries and flag high-divergence conditions before committing to joint reasoning. The counterintuitive empirical result, measured on Claude Haiku across multi-agent travel and software-planning domains, is that the obvious fix — naive full-broadcast synchronization — makes things worse, raising the hallucination rate 34% above a no-sync baseline (HR 0.658 vs 0.492, p=0.0022, d=1.18) by propagating one agent\'s erroneous belief to every other agent; SSVP instead avoids this contamination, achieves modestly lower hallucination (HR 0.463, d=0.30) and significantly beats full-broadcast (p=0.0005, d=1.47) while using 58% fewer API calls. The contamination effect is task-specific: it disappears in software planning (all conditions converge below 0.2 HR) where no single shared belief cascades across evaluation dimensions. These effects rest on small controlled samples (n=30 per travel condition, n=10 software), so the 34% contamination figure is directional rather than tightly bounded. Distinct from Semantic Concurrency Control, which arbitrates conflicting concurrent writes to a shared store, Context Divergence measures and gates the drift of each agent\'s private knowledge-state before it can contaminate the collective — the hazard is silent belief drift, not a write collision. For building agent systems the implication is sharp: broadcasting more state is not free coordination but a contamination vector, so multi-agent designs should treat selective, divergence-triggered synchronization — not full sync — as a first-class primitive.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A concrete SSVP loop: each agent emits a compressed state summary (e.g. a dict of key world-state assertions); compute a pairwise Context Divergence Score as a weighted discrepancy over spatial/temporal/task keys, e.g. cds = sum(w[k]*disagree(a[k], b[k]) for k in keys). Before any joint-reasoning step, gate on cds: if cds > threshold for a pair, flag the divergence and request a targeted reconcile of only the divergent keys instead of full-broadcasting every agent\'s state. This selective, divergence-triggered exchange is what lets SSVP cut ~58% of API calls versus full broadcast while dodging the contamination that full sync introduces — the key is to reconcile only when CDS is high and only on the divergent slice, never to overwrite a peer\'s whole state.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-coordination-surface',
      description: 'Both concern the shared joint-state where agents coordinate; Context Divergence supplies a scalar (CDS) measuring how far apart agents\' private views of that coordination surface have drifted before they reason jointly.',
    },
    {
      type: 'cross-reference',
      targetId: 'agent-semantic-concurrency-control',
      description: 'SSVP is a coordination primitive adjacent to concurrency control, but it gates divergence of private per-agent knowledge-states before joint reasoning rather than arbitrating conflicting writes to a shared store — the explicit distinction drawn in the description.',
    },
    {
      type: 'analogy',
      targetId: 'agent-constraint-drift',
      description: 'Analogous drift phenomenon: constraint drift tracks a single agent\'s requirements decaying over a long context, while context divergence tracks knowledge-state drift accumulating across concurrent agents, both surfacing as downstream reasoning errors.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
