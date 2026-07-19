/**
 * Agent Artifact Provenance Gap concept — agent-systems security wing (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.09084 (2026).
 *
 * @module departments/agent-systems/concepts/security/artifact-provenance-gap
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 17 * 2 * Math.PI / 29;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const artifactProvenanceGap: RosettaConcept = {
  id: 'agent-artifact-provenance-gap',
  name: 'Agent Artifact Provenance Gap',
  domain: 'agent-systems',
  description: 'Context-Fractured Decomposition (CFD) is a jailbreak class that exploits the provenance gap: the deployment failure mode where a tool-using LLM agent persists benign-looking artifacts (workspace files, logs) but never tracks where they came from, so enforcement that is fragmented across tools, modules, and time cannot reason about cross-step composition. arXiv:2606.09084 (2026) operationalizes this by planting innocuous intermediate artifacts during an early interaction and then eliciting harmful behavior much later — potentially in a different agent instance or workflow stage — through individually innocuous tool actions whose risk emerges only under delayed, artifact-mediated composition. Because no single conversation contains the whole attack, single-turn and even multi-turn judges (Crescendo, Tree of Attacks) that assume one contiguous, defender-visible transcript are blind to it; across agent-system jailbreak benchmarks CFD lifts attack success by up to 28.3 percentage points over state-of-the-art baselines, even against strong single-turn judges. The proposed mitigation is provenance lineage tagging: attach and propagate origin metadata on every artifact so a defender can score composed risk at read time rather than at write time. Distinct from agent-joint-intent-harm-defense, which scores a single request for combined intent and harm, CFD defeats point-in-time judgment precisely by ensuring every observable step is individually benign — harm is a property of the artifact lineage, not of any one action. For building agent systems, the implication is that safety enforcement must be a stateful, cross-instance property carried by data provenance, not a stateless filter re-run per turn; a workspace shared across agents is an attack surface unless its artifacts carry auditable lineage.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Provenance lineage tagging in practice: wrap every tool write so the artifact record carries origin_agent, origin_turn, and the ids of any parent artifacts it was derived from. At read/compose time, a defender walks the lineage DAG and scores the WHOLE ancestry — not just the current call — flagging a composition whose combined lineage crosses a risk threshold even when each contributing action passed its own per-turn judge. This shifts enforcement from a stateless per-turn filter to a stateful graph check over data provenance, which is what makes it robust to attacks fractured across instances and time.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'agent-stored-prompt-injection',
      description: 'Both weaponize a persisted artifact as the attack vector rather than live conversation text, but stored prompt injection replays an embedded instruction, whereas the provenance gap composes several individually benign artifacts across instances and time so risk exists only in the lineage, not in any one stored payload.',
    },
    {
      type: 'analogy',
      targetId: 'agent-compositional-behavioral-leakage',
      description: 'Shares the core shape that danger emerges from composing individually safe parts; CFD is the adversarial-security instance of this compositional emergence, deliberately fracturing a harmful request into innocuous artifact-producing steps that recombine later.',
    },
    {
      type: 'dependency',
      targetId: 'agent-content-addressed-storage',
      description: 'The proposed provenance-lineage-tagging mitigation depends on a storage layer that can attach and propagate immutable origin metadata per artifact; content-addressed storage supplies exactly the stable, auditable identity that lineage tags reference.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
