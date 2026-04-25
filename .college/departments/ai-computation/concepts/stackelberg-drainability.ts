/**
 * Stackelberg Drainability concept — multi-tenant pricing guardrail reference.
 *
 * Source: Stackelberg Game with Drainability Guardrails (arXiv:2604.16802,
 * Yan et al., CDC 2026).
 *
 * The paper formulates multi-tenant compute pricing as a Stackelberg bilevel game:
 * a platform operator (leader) sets prices; tenants (followers) solve best-response
 * optimisations over workload placement. The novel contribution is the drainability
 * guardrail: a constraint on the leader's optimisation that prevents the equilibrium
 * from having a tenant whose unconstrained best response could drain shared resources
 * to zero. The paper proves existence of a guardrail-feasible Stackelberg equilibrium,
 * characterises iterative best-response convergence, and shows that equilibrium prices
 * are monotone non-decreasing in tenant count, so admission self-regulates.
 *
 * For gsd-skill-creator, this is the academic antecedent for multi-tenant pricing
 * in any compute resource shared across skill-creator users. Phase 773 T3a (if
 * budget) implements a reference pricing layer based on this formulation, using
 * generic "multi-tenant pricing" language in all public artifacts. Fox Companies
 * IP stays in .planning/ per the hard rule.
 *
 * Convergent-discovery classification: Strong. CDC 2026 acceptance provides
 * peer-review tier; existence and convergence proofs give formal academic foundation.
 *
 * Milestone: v1.49.573 upstream-intelligence-pack-v1.44.
 *
 * @module departments/ai-computation/concepts/stackelberg-drainability
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~15*2pi/29, radius ~0.92 (game-theory ring)
const theta = 15 * 2 * Math.PI / 29;
const radius = 0.92;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const stackelbergDrainability: RosettaConcept = {
  id: 'ai-computation-stackelberg-drainability',
  name: 'Stackelberg Drainability',
  domain: 'ai-computation',
  description: 'The Stackelberg Drainability concept (arXiv:2604.16802, CDC 2026) ' +
    'formalises multi-tenant compute pricing as a bilevel optimisation problem. The ' +
    'platform operator (leader) sets per-unit prices to maximise revenue subject to ' +
    'a drainability guardrail constraint: for each shared resource r, the minimum ' +
    'remaining capacity after all tenant best responses must exceed a floor delta > 0. ' +
    'This prevents any tenant from exhausting shared resources in equilibrium. The ' +
    'paper proves: (a) existence of a guardrail-feasible Stackelberg equilibrium under ' +
    'mild convexity conditions; (b) iterative best-response convergence to the ' +
    'equilibrium; (c) monotone non-decreasing equilibrium prices as tenant count ' +
    'grows, so admission pricing self-regulates. For gsd-skill-creator, this is the ' +
    'published academic antecedent for any multi-tenant skill-compute pricing layer ' +
    'that needs a fairness guarantee (no single tenant exhausts shared capacity). ' +
    'Phase 773 T3a (strictly optional) implements a reference pricing layer. All ' +
    'public surfaces use generic "multi-tenant pricing" language; no internal company ' +
    'names appear in public artifacts.',
  panels: new Map([
    ['typescript', {
      panelId: 'typescript',
      explanation: 'Phase 773 T3a exports a StackelbergPricing class with ' +
        'computePrices(tenants: Tenant[], resources: Resource[], delta: number): ' +
        'PriceVector. The iterative best-response loop runs until the price vector ' +
        'converges within epsilon. Drainability check verifies that remaining[r] > delta ' +
        'for all resources r after computing tenant best responses. See arXiv:2604.16802.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'ai-computation-capability-evolution',
      description: 'Multi-tenant pricing under the Stackelberg-drainability guardrail ' +
        'is a capability-evolution constraint: the system can evolve its pricing as ' +
        'tenant count grows (monotone scaling result), but the guardrail prevents ' +
        'the pricing evolution from reaching a state where any tenant is crowded out.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-data-free-mia-attack',
      description: 'Any compute service that offers federated training capabilities ' +
        'must address the data-free MIA threat model (arXiv:2604.19891+19915+20020) ' +
        'before the pricing layer can be deployed for FL workloads. Stackelberg pricing ' +
        'is secondary to the FL security gate (UIP-11 cascade).',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
