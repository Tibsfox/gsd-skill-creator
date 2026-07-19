/**
 * Silent-Failure Taxonomy -- agent-systems concept (June-2026 arXiv cohort).
 * @module departments/agent-systems/concepts/integration-evaluation/silent-failure-taxonomy
 */

import type { RosettaConcept } from '../../../../rosetta-core/types.js';

const theta = 143 * 2 * Math.PI / 47;
const radius = 0.85;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const silentFailureTaxonomy: RosettaConcept = {
  id: "agent-silent-failure-taxonomy",
  name: "Silent-Failure Taxonomy",
  domain: 'agent-systems',
  description:
    "A silent failure is an agent error whose signal never reaches a human in actionable form: the fault fires, but no alert, log, or gate surfaces it in time to act. The 2026 finding (arXiv 2606.14589v1, 2026) is a five-class, mechanism-oriented taxonomy — environment and platform quirks, design-assumption mismatches, error swallowing, and more — of how such faults survive dense test suites and governance coverage in long-lived runtimes. It is the negative-space dual of the compliance-trace gate: that gate enumerates predicates that must fire; this enumerates the mechanisms by which a fault emits no fireable signal at all. Each class names a distinct point where the error-to-human channel breaks, so a green board is not evidence of health. Implication: pair every positive gate with a silent-failure sweep and instrument the swallow points rather than trusting that green means safe.",
  panels: new Map(),
  relationships: [
    {
      type: "cross-reference",
      targetId: "agent-compliance-trace-check",
      description: "The negative-space dual of the positive gate: this catalogs the mechanisms by which a fault evades the very predicates a compliance-trace check installs, so the two together bound both what must fire and how signals fail to reach a human.",
    },
    {
      type: "cross-reference",
      targetId: "agent-paired-trace-audit",
      description: "Paired-trace audit is a concrete way to surface silent failures — the behavioural effects a green pass-rate is blind to are exactly the class this taxonomy names.",
    },
    {
      type: "cross-reference",
      targetId: "agent-evaluator-validity-audit",
      description: "An invalid evaluator is itself a silent-failure channel — error-swallowing at the measurement layer — so validating the evaluator closes one taxonomy class.",
    },
    {
      type: "analogy",
      targetId: "agent-knowing-doing-gap",
      description: "Both are gaps between internal reality and its externalized signal: knowing-doing separates latent representation from emitted action, while silent failure separates an occurring fault from any actionable alert.",
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
