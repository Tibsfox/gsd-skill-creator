/**
 * Coherent Functor concept — category-theoretic neural-network presentation.
 *
 * Complex Analysis / Categorical wing.
 * A coherent functor F : A → B is an additive functor between abelian categories
 * that commutes with filtered colimits and is presented by a single exact sequence.
 * The April 2026 cluster paper (arXiv:2604.15100) uses coherent functors to
 * present neural-network layer stacks: the presentation structure makes
 * layer composition, invariant tracking, and naturality checks algebraic
 * rather than approximate. This is the M3 categorical backbone for
 * gsd-skill-creator's Rosetta Core — and the seed primitive for Phase 745
 * (src/coherent-functors/).
 *
 * Milestone: v1.49.572 math-foundations-apr2026.
 *
 * @module departments/mathematics/concepts/coherent-functor
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~3*2pi/29, radius ~0.92 (categorical-foundation ring)
const theta = 3 * 2 * Math.PI / 29;
const radius = 0.92;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const coherentFunctor: RosettaConcept = {
  id: 'mathematics-coherent-functor',
  name: 'Coherent Functor',
  domain: 'mathematics',
  description: 'A coherent functor F : A → B between abelian categories is an ' +
    'additive functor that commutes with filtered colimits and is presented by ' +
    'a single exact sequence. The April 2026 cluster paper (arXiv:2604.15100) ' +
    'shows that neural-network layer stacks admit coherent-functor presentations, ' +
    'which makes composition, naturality, and invariant-tracking checks algebraic ' +
    'rather than approximate. The invariants (identity preservation, associativity ' +
    'of composition, respect for natural transformations) become typed boundary ' +
    'conditions at compile time rather than training-time regularisers. For ' +
    'gsd-skill-creator, coherent functors are the M3 categorical backbone of the ' +
    'Rosetta Core: skills, departments, and their cross-references compose by the ' +
    'same coherent-functor rules that layer stacks do, and the Phase 745 primitive ' +
    '(src/coherent-functors/) ships a factory + composition + invariant-check bundle ' +
    'with a typed boundary against the Silicon Layer.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A coherent functor is a frozen dataclass (@dataclass(frozen=True)) carrying the three-morphism presentation as immutable tuples; composition is a monoid operation validated by an invariant-check pass. The runtime keeps a registry mapping functor identity hashes to typed Silicon-Layer endpoints. See arXiv:2604.15100.',
    }],
    ['typescript', {
      panelId: 'typescript',
      explanation: 'A coherent functor is a TypeScript interface with a presentation triple and a compose method; invariant checks are static-type conditions augmented by a run-once verification at construction. The Phase 745 primitive exports a factory and uses TypeScript\'s structural typing to enforce naturality at the call site. See arXiv:2604.15100.',
    }],
    ['lean4', {
      panelId: 'lean4',
      explanation: 'In Lean 4 the coherent-functor structure is a structure with fields for source and target categories, the presentation sequence, and proof obligations for associativity and identity. Mathlib supplies the abelian-category setup; the M1 Formal Methods cluster (PCWP-M1) is the workflow for assembling such proofs under the six-step LLM-draft / kernel-check loop. See arXiv:2604.15100.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-complex-numbers',
      description: 'Coherent functors between complex-analytic categories carry the rotational symmetries that the Complex Analysis wing uses for concept-plane rotations',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-harness-as-object',
      description: 'The harness-as-object pattern is the gsd-skill-creator analogue of a coherent-functor presentation: the harness is the presentation, the agents are the morphisms',
    },
    {
      type: 'dependency',
      targetId: 'mathematics-euler-formula',
      description: 'Coherent-functor presentations on the unit circle reduce to Euler-rotation composition rules; the Rosetta Core Complex Plane mapping depends on this reduction',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
