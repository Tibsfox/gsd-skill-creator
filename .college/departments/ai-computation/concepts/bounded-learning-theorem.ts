/**
 * Bounded-Learning Theorem concept — formal backing for the 20%-rule via Peng recovery.
 *
 * Learning Dynamics / Capacity wing.
 * The Bounded-Learning Discipline in gsd-skill-creator caps per-phase
 * library expansion at ~20% of library size before a CAPCOM checkpoint is
 * required. Until April 2026 this was a rule-of-thumb. The nine-paper M1
 * cluster on formal methods supplies PCWP-M1 (six-step proof-companion
 * workflow) as the process substrate, and the Peng continual-recovery paper
 * (arXiv:2604.17563) supplies the recovery-envelope argument that makes
 * "20%" the correct envelope radius at edge-of-stability step sizes with
 * Wasserstein-Hebbian update geometry. Phase 748 ships the formal reference
 * at docs/substrate/bounded-learning-theorem.md.
 *
 * Milestone: v1.49.572 math-foundations-apr2026.
 *
 * @module departments/ai-computation/concepts/bounded-learning-theorem
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~15*2pi/29, radius ~0.91 (learning-theoretic ring, high-priority backing)
const theta = 15 * 2 * Math.PI / 29;
const radius = 0.91;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const boundedLearningTheorem: RosettaConcept = {
  id: 'ai-computation-bounded-learning-theorem',
  name: 'Bounded-Learning Theorem',
  domain: 'ai-computation',
  description: 'The Bounded-Learning Theorem formalises gsd-skill-creator\'s ' +
    '20%-rule: per-phase library expansion is capped at roughly 20% of current ' +
    'library size before a CAPCOM checkpoint is required. Three April 2026 ' +
    'clusters compose to supply the theorem. The M1 formal-methods cluster ' +
    'supplies PCWP-M1 (Proof-Companion Workflow Pattern, six-step LLM-draft / ' +
    'kernel-check / failure-recovery loop) as the process substrate; the ' +
    'acceptance rate of the loop drops sharply once per-iteration expansion ' +
    'exceeds ~0.2 of library size. The M5 Peng continual-recovery paper ' +
    '(arXiv:2604.17563) supplies the recovery-envelope argument: a ' +
    'Wasserstein-Hebbian update at edge-of-stability step sizes converges ' +
    'provided the expansion radius stays inside the Peng envelope. The ' +
    'composition of the three (PCWP-M1 acceptance phase-transition + ' +
    'Peng envelope + edge-of-stability step-size bound) pins the constant at ' +
    'approximately 0.2. Phase 748 ships docs/substrate/bounded-learning-theorem.md ' +
    'as the formal reference, with a machine-checked sketch of the envelope ' +
    'argument.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'A numerical validation harness generates synthetic skill-DAGs, runs the PCWP-M1 loop at varying expansion ratios, and measures acceptance rate and Peng-envelope convergence. The phase-transition at ~0.2 is reproducible across a grid of random seeds. See arXiv:2604.17563.',
    }],
    ['typescript', {
      panelId: 'typescript',
      explanation: 'The Phase 748 reference exports no runtime code — it is documentation-only. A companion harness in tests/bounded-learning/ produces the numerical validation results at CI time and writes them to the docs/substrate/bounded-learning-theorem.md file as a table. See arXiv:2604.17563.',
    }],
    ['lean4', {
      panelId: 'lean4',
      explanation: 'The Lean 4 sketch states the envelope condition as a Real-valued inequality and proves the simple direction (small radius ⇒ convergence) with mathlib\'s Wasserstein machinery. The reverse direction (phase transition at ~0.2) is left as a numerical claim validated by the harness.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'mathematics-coherent-functor',
      description: 'PCWP-M1 acceptance under coherent-functor presentations: the kernel-check step is a coherent-functor morphism test, so the Bounded-Learning Theorem inherits the categorical structure',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-capability-evolution',
      description: 'Capability-evolution tracking across phases is the observability layer that makes the 20%-rule enforceable; the Bounded-Learning Theorem gives that observability a quantitative target',
    },
    {
      type: 'dependency',
      targetId: 'mathematics-exponential-decay',
      description: 'Convergence inside the Peng recovery envelope is characterised by exponential-decay rates; the Calculus wing\'s exponential-decay concept is a prerequisite',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
