// test/proofs/proof-registry.ts
// Proof statement registry for Phase 475 (Chapters 1-6)
// Follows the Statement Registry spec in 04-proof-framework-spec.md

export type ProofClassification = 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
export type ProofStatus = 'proved' | 'verified' | 'acknowledged-gap' | 'beyond-scope';
export type ProofType =
  | 'theorem'
  | 'lemma'
  | 'corollary'
  | 'proposition'
  | 'identity'
  | 'definition';

export interface ProofStatement {
  id: string;
  chapter: number;
  section: number;
  name: string;
  type: ProofType;
  classification: ProofClassification;
  studentExperience: string;
  dependencies: string[];
  status: ProofStatus;
  testId?: string;
  platformConnection?: string;
  textbookFeedback?: string;
  subversion: string;
}

// ---------------------------------------------------------------------------
// Chapter 1: Numbers — Real Number System and Computability
// ---------------------------------------------------------------------------
export const ch01Proofs: ProofStatement[] = [
  {
    id: 'thm-1-1',
    chapter: 1,
    section: 1,
    name: 'sqrt2 is irrational',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-1-1-sqrt2-irrational',
    platformConnection: 'src/packs/plane/types.ts SkillPosition real-valued radius',
    subversion: '1.50.51',
  },
  {
    id: 'thm-1-2',
    chapter: 1,
    section: 2,
    name: 'rationals are countable',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-1-2-rationals-countable',
    platformConnection: 'src/packs/plane/position-store.ts enumerable positions',
    subversion: '1.50.51',
  },
  {
    id: 'thm-1-3',
    chapter: 1,
    section: 3,
    name: 'reals are uncountable (Cantor diagonalization)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-1-2'],
    status: 'proved',
    platformConnection: 'IEEE 754 floating-point approximation acknowledged',
    subversion: '1.50.51',
  },
  {
    id: 'thm-1-4',
    chapter: 1,
    section: 4,
    name: 'density of rationals in reals',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-1-3'],
    status: 'proved',
    testId: 'proof-1-4-density',
    platformConnection: 'floating-point approximation validity',
    subversion: '1.50.51',
  },
  {
    id: 'thm-1-5',
    chapter: 1,
    section: 5,
    name: 'well-ordering principle for naturals',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: [],
    status: 'proved',
    platformConnection: 'version ordering in plan tracking',
    subversion: '1.50.51',
  },
];

// ---------------------------------------------------------------------------
// Chapter 2: Unit Circle — Trigonometry and Complex Exponential
// ---------------------------------------------------------------------------
export const ch02Proofs: ProofStatement[] = [
  {
    id: 'thm-2-1',
    chapter: 2,
    section: 1,
    name: 'Pythagorean identity',
    type: 'identity',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: [],
    status: 'proved',
    testId: 'proof-2-1-pythagorean-identity',
    platformConnection: 'src/packs/plane/observer-bridge.ts angular constraint; src/packs/plane/types.ts SkillPositionSchema',
    subversion: '1.50.52',
  },
  {
    id: 'thm-2-2',
    chapter: 2,
    section: 2,
    name: 'radian-degree conversion',
    type: 'proposition',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: [],
    status: 'proved',
    testId: 'proof-2-2-radian-degree',
    platformConnection: 'v1.50 subversion angle calculation',
    subversion: '1.50.52',
  },
  {
    id: 'thm-2-3',
    chapter: 2,
    section: 3,
    name: 'symmetry: cos even, sin odd',
    type: 'theorem',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: ['thm-2-1'],
    status: 'proved',
    testId: 'proof-2-3-symmetry',
    platformConnection: 'src/packs/plane/observer-bridge.ts symmetric angular clamping',
    subversion: '1.50.52',
  },
  {
    id: 'thm-2-4',
    chapter: 2,
    section: 4,
    name: 'tan = sin/cos; fundamental trig relationships',
    type: 'definition',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: ['thm-2-1'],
    status: 'proved',
    testId: 'proof-2-4-trig-relationships',
    platformConnection: 'src/packs/plane/activation.ts TangentContext',
    subversion: '1.50.52',
  },
  {
    id: 'thm-2-5',
    chapter: 2,
    section: 5,
    name: 'complex exponential on unit circle',
    type: 'proposition',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-2-1'],
    status: 'proved',
    platformConnection: 'src/packs/plane/composition.ts Euler-based skill composition',
    subversion: '1.50.52',
  },
];

// ---------------------------------------------------------------------------
// Chapter 3: Pythagorean Theorem — Geometry and Distance
// ---------------------------------------------------------------------------
export const ch03Proofs: ProofStatement[] = [
  {
    id: 'thm-3-1',
    chapter: 3,
    section: 1,
    name: 'Pythagorean theorem (geometric proof)',
    type: 'theorem',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: [],
    status: 'proved',
    testId: 'proof-3-1-pythagorean-theorem',
    platformConnection: 'src/packs/plane/types.ts SkillPosition (r, theta) coordinate system',
    subversion: '1.50.53',
  },
  {
    id: 'thm-3-2',
    chapter: 3,
    section: 2,
    name: 'integer Pythagorean triples exist',
    type: 'proposition',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-3-1'],
    status: 'proved',
    testId: 'proof-3-2-pythagorean-triples',
    subversion: '1.50.53',
  },
  {
    id: 'thm-3-3',
    chapter: 3,
    section: 3,
    name: 'Cauchy-Schwarz inequality',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-3-1'],
    status: 'proved',
    testId: 'proof-3-3-cauchy-schwarz',
    platformConnection: 'src/packs/plane/activation.ts tangentScore bounded by Cauchy-Schwarz (HIGH CONSEQUENCE)',
    subversion: '1.50.53',
  },
  {
    id: 'thm-3-4',
    chapter: 3,
    section: 4,
    name: 'distance formula in R^2',
    type: 'corollary',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: ['thm-3-1'],
    status: 'proved',
    testId: 'proof-3-4-distance-formula',
    platformConnection: 'src/packs/plane/position-store.ts angular distance between skills',
    subversion: '1.50.53',
  },
];

// ---------------------------------------------------------------------------
// Chapter 4: Trigonometry and Waves
// ---------------------------------------------------------------------------
export const ch04Proofs: ProofStatement[] = [
  {
    id: 'thm-4-1',
    chapter: 4,
    section: 1,
    name: 'cosine addition formula',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-2-1'],
    status: 'proved',
    testId: 'proof-4-1-cos-addition',
    platformConnection: 'src/packs/plane/arithmetic.ts angular addition',
    subversion: '1.50.54',
  },
  {
    id: 'thm-4-2',
    chapter: 4,
    section: 2,
    name: 'sine addition formula',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-2-1'],
    status: 'proved',
    testId: 'proof-4-2-sin-addition',
    platformConnection: 'src/packs/plane/arithmetic.ts angular addition',
    subversion: '1.50.54',
  },
  {
    id: 'thm-4-3',
    chapter: 4,
    section: 3,
    name: 'double-angle formulas',
    type: 'corollary',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: ['thm-4-1', 'thm-4-2'],
    status: 'proved',
    testId: 'proof-4-3-double-angle',
    subversion: '1.50.54',
  },
  {
    id: 'thm-4-6',
    chapter: 4,
    section: 6,
    name: 'beat frequency: sum-to-product identity',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-4-1', 'thm-4-2'],
    status: 'proved',
    testId: 'proof-4-6-beat-frequency',
    platformConnection: 'src/packs/plane/signal-classification.ts beat-frequency sensitivity (HIGH CONSEQUENCE)',
    subversion: '1.50.54',
  },
];

// ---------------------------------------------------------------------------
// Chapter 5: Music and the 12-TET System
// ---------------------------------------------------------------------------
export const ch05Proofs: ProofStatement[] = [
  {
    id: 'thm-5-3',
    chapter: 5,
    section: 3,
    name: '12-TET frequency formula f_n = f0 * 2^(n/12)',
    type: 'theorem',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: [],
    status: 'proved',
    testId: 'proof-5-3-12tet-formula',
    platformConnection: 'src/packs/plane/chords.ts terminological (chord name mapping)',
    subversion: '1.50.55',
  },
  {
    id: 'thm-5-4',
    chapter: 5,
    section: 4,
    name: '12-TET approximation quality (deviations from just intonation)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-5-3'],
    status: 'proved',
    testId: 'proof-5-4-12tet-approx',
    platformConnection: 'src/packs/plane/signal-classification.ts structural parallel',
    subversion: '1.50.55',
  },
];

// ---------------------------------------------------------------------------
// Chapter 6: Standing Waves — Boundary Conditions and Modes
// ---------------------------------------------------------------------------
export const ch06Proofs: ProofStatement[] = [
  {
    id: 'thm-6-1',
    chapter: 6,
    section: 1,
    name: 'standing wave from superposition of traveling waves',
    type: 'theorem',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: [],
    status: 'proved',
    testId: 'proof-6-1-standing-wave-superposition',
    subversion: '1.50.56',
  },
  {
    id: 'thm-6-2',
    chapter: 6,
    section: 2,
    name: 'boundary conditions quantize normal modes',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-6-1'],
    status: 'proved',
    testId: 'proof-6-2-boundary-conditions',
    platformConnection:
      'src/packs/plane/observer-bridge.ts velocity clamping — boundary conditions → angular velocity bound (HIGH CONSEQUENCE)',
    subversion: '1.50.56',
  },
  {
    id: 'thm-6-4',
    chapter: 6,
    section: 4,
    name: 'Fourier series convergence (L2 sense; Riemann-Lebesgue lemma acknowledged)',
    type: 'theorem',
    classification: 'L4',
    studentExperience: 'Acknowledged gap — requires measure theory',
    dependencies: ['thm-6-1'],
    status: 'acknowledged-gap',
    testId: 'proof-6-4-fourier-convergence',
    platformConnection: 'src/packs/plane/signal-classification.ts classifySignals (Fourier → signal decomposition)',
    subversion: '1.50.56',
  },
];

// ---------------------------------------------------------------------------
// Chapter 7: Musical Notation as Coordinate System (Phase 476)
// ---------------------------------------------------------------------------
export const ch07Proofs: ProofStatement[] = [
  {
    id: 'thm-7-1',
    chapter: 7,
    section: 1,
    name: 'Z₁₂ group structure (chromatic scale abelian group)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-7-1-z12-group',
    platformConnection: 'src/packs/plane/signal-classification.ts 12 signal categories as Z₁₂ structural parallel',
    subversion: '1.50.57',
  },
  {
    id: 'thm-7-2',
    chapter: 7,
    section: 2,
    name: 'geometric series sum ∑(1/2)^n = 2 for rhythmic values',
    type: 'theorem',
    classification: 'L1',
    studentExperience: 'I see it',
    dependencies: [],
    status: 'proved',
    testId: 'proof-7-2-geometric-series',
    platformConnection: 'src/packs/plane/types.ts MATURITY_THRESHOLD convergence',
    subversion: '1.50.57',
  },
  {
    id: 'thm-7-3',
    chapter: 7,
    section: 3,
    name: 'information density — Shannon entropy log₂(A) for uniform distributions',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-7-3-information-density',
    platformConnection: 'src/packs/plane/types.ts SkillPosition coordinate vs. discrete label design',
    subversion: '1.50.57',
  },
];

// ---------------------------------------------------------------------------
// Chapter 8: Calculus I — Limits, Derivatives, Transcendentals (Phase 476)
// ---------------------------------------------------------------------------
export const ch08Proofs: ProofStatement[] = [
  {
    id: 'thm-8-1',
    chapter: 8,
    section: 1,
    name: 'ε-δ limit definition — lim_{x→2}(3x-1)=5, δ=ε/3',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-8-1-epsilon-delta-linear',
    subversion: '1.50.58',
  },
  {
    id: 'thm-8-2',
    chapter: 8,
    section: 2,
    name: 'limit sum law — lim(f+g) = lim f + lim g',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-8-1'],
    status: 'proved',
    testId: 'proof-8-2-limit-sum-law',
    subversion: '1.50.58',
  },
  {
    id: 'thm-8-3',
    chapter: 8,
    section: 3,
    name: 'power rule: d/dx(x^n) = n*x^(n-1)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-1'],
    status: 'proved',
    testId: 'proof-8-3-power-rule',
    subversion: '1.50.58',
  },
  {
    id: 'thm-8-4',
    chapter: 8,
    section: 4,
    name: "product rule: d/dx(fg) = f'g + fg'",
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-1'],
    status: 'proved',
    testId: 'proof-8-4-product-rule',
    subversion: '1.50.58',
  },
  {
    id: 'thm-8-5',
    chapter: 8,
    section: 5,
    name: "chain rule: d/dx(f(g(x))) = f'(g(x))*g'(x)",
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-8-3', 'thm-8-4'],
    status: 'proved',
    testId: 'proof-8-5-chain-rule',
    subversion: '1.50.58',
  },
  {
    id: 'thm-8-6',
    chapter: 8,
    section: 6,
    name: 'sin(h)/h → 1 as h → 0 (Squeeze Theorem)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-1'],
    status: 'proved',
    testId: 'proof-8-6-sinh-over-h',
    subversion: '1.50.58',
  },
  {
    id: 'thm-8-7',
    chapter: 8,
    section: 7,
    name: 'd/dx(sin x) = cos x',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-6'],
    status: 'proved',
    testId: 'proof-8-7-derivative-sin',
    platformConnection: 'src/packs/plane/observer-bridge.ts angular velocity as discrete derivative',
    subversion: '1.50.58',
  },
  {
    id: 'thm-8-8',
    chapter: 8,
    section: 8,
    name: 'd/dx(e^x) = e^x (defining property; L5 acknowledgment for uniform convergence)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-1'],
    status: 'proved',
    testId: 'proof-8-8-exp-derivative',
    subversion: '1.50.58',
  },
  {
    id: 'thm-8-9',
    chapter: 8,
    section: 9,
    name: "L'Hôpital's rule (application; L4 acknowledged for rule proof)",
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-1'],
    status: 'acknowledged-gap',
    testId: 'proof-8-9-lhopital',
    subversion: '1.50.58',
  },
];

// ---------------------------------------------------------------------------
// Chapter 9: Integration (Phase 476)
// ---------------------------------------------------------------------------
export const ch09Proofs: ProofStatement[] = [
  {
    id: 'thm-9-1',
    chapter: 9,
    section: 1,
    name: 'FTC Part 1: d/dx(∫ₐˣ f(t)dt) = f(x)',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-8-1'],
    status: 'proved',
    testId: 'proof-9-1-ftc-part1',
    platformConnection: 'src/packs/plane/observer-bridge.ts radius growth as discrete Riemann sum',
    subversion: '1.50.59',
  },
  {
    id: 'thm-9-2',
    chapter: 9,
    section: 2,
    name: 'FTC Part 2: ∫ₐᵇ f dx = F(b) - F(a)',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-9-1'],
    status: 'proved',
    testId: 'proof-9-2-ftc-part2',
    subversion: '1.50.59',
  },
  {
    id: 'thm-9-3',
    chapter: 9,
    section: 3,
    name: "integration by parts: ∫u dv = uv - ∫v du",
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-4'],
    status: 'proved',
    testId: 'proof-9-3-integration-by-parts',
    subversion: '1.50.59',
  },
  {
    id: 'thm-9-4',
    chapter: 9,
    section: 4,
    name: "Simpson's rule: ∫ₐᵇ f dx ≈ (b-a)/6 * (f(a) + 4f(m) + f(b))",
    type: 'proposition',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-9-2'],
    status: 'proved',
    testId: 'proof-9-4-simpsons-rule',
    subversion: '1.50.59',
  },
];

// ---------------------------------------------------------------------------
// Chapter 10: Differential Equations (Phase 476)
// ---------------------------------------------------------------------------
export const ch10Proofs: ProofStatement[] = [
  {
    id: 'thm-10-1',
    chapter: 10,
    section: 1,
    name: "harmonic oscillator x'' + ω²x = 0 has solution A·cos(ωt) + B·sin(ωt)",
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-5', 'thm-8-7'],
    status: 'proved',
    testId: 'proof-10-1-harmonic-oscillator',
    platformConnection: 'src/packs/plane/observer-bridge.ts skill position oscillation dynamics',
    subversion: '1.50.60',
  },
  {
    id: 'thm-10-2',
    chapter: 10,
    section: 2,
    name: 'wave equation ∂²u/∂t² = c²·∂²u/∂x² — standing wave solutions',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-6-2', 'thm-8-5'],
    status: 'proved',
    testId: 'proof-10-2-wave-equation',
    platformConnection: 'cross-citation with ch06-standing-waves.md Theorem 6.2',
    subversion: '1.50.60',
  },
  {
    id: 'thm-10-3',
    chapter: 10,
    section: 3,
    name: "Picard iteration converges to e^x for y'=y, y(0)=1 (L4 partial; Banach FPT acknowledged)",
    type: 'theorem',
    classification: 'L4',
    studentExperience: 'Acknowledged gap — Banach Fixed Point Theorem deferred',
    dependencies: ['thm-9-1'],
    status: 'acknowledged-gap',
    testId: 'proof-10-3-picard-iteration',
    platformConnection: 'MAX_ANGULAR_VELOCITY as Lipschitz constant in Picard-Lindelöf',
    subversion: '1.50.60',
  },
];

// ---------------------------------------------------------------------------
// All Phase 475 proofs
// ---------------------------------------------------------------------------
export const allPhase475Proofs: ProofStatement[] = [
  ...ch01Proofs,
  ...ch02Proofs,
  ...ch03Proofs,
  ...ch04Proofs,
  ...ch05Proofs,
  ...ch06Proofs,
];

// ---------------------------------------------------------------------------
// All Phase 476 proofs (Ch 7-10)
// ---------------------------------------------------------------------------
export const allPhase476Proofs: ProofStatement[] = [
  ...ch07Proofs,
  ...ch08Proofs,
  ...ch09Proofs,
  ...ch10Proofs,
];

// ---------------------------------------------------------------------------
// All proofs (Phase 475 + Phase 476)
// ---------------------------------------------------------------------------
export const allProofs: ProofStatement[] = [
  ...allPhase475Proofs,
  ...allPhase476Proofs,
];

// Alias: combined registry through Phase 476
export const allProofsThrough476: ProofStatement[] = allProofs;

// ---------------------------------------------------------------------------
// Chapter 11: Vectors and Vector Spaces (Phase 477)
// ---------------------------------------------------------------------------
export const ch11Proofs: ProofStatement[] = [
  {
    id: 'thm-11-1',
    chapter: 11,
    section: 1,
    name: '(R², +, ·) is a vector space — all 8 axioms verified',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-11-1-vector-space-axioms',
    platformConnection: 'SkillPosition lives in R² via (r·cosθ, r·sinθ); vector axioms validate skill position arithmetic',
    subversion: '1.50.61',
  },
  {
    id: 'thm-11-2',
    chapter: 11,
    section: 2,
    name: 'Cauchy-Schwarz inequality: |u·v| ≤ |u||v|',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-11-1'],
    status: 'proved',
    testId: 'proof-11-2-cauchy-schwarz',
    platformConnection: 'estimateTheta = atan2(abstractSignals, concreteSignals) IS the dot-product angle computation',
    subversion: '1.50.61',
  },
  {
    id: 'thm-11-3',
    chapter: 11,
    section: 3,
    name: 'orthogonal projection: proj_v(u) = (u·v/|v|²)v',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-11-2'],
    status: 'proved',
    testId: 'proof-11-3-projection',
    platformConnection: 'pointToTangentDistance uses projection formula: n̂·q − r is signed distance',
    subversion: '1.50.61',
  },
  {
    id: 'thm-11-4',
    chapter: 11,
    section: 4,
    name: 'Gram-Schmidt orthogonalization',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-11-3'],
    status: 'proved',
    testId: 'proof-11-4-gram-schmidt',
    platformConnection: 'PROMOTION_REGIONS angular sectors as approximate orthogonal basis decomposition',
    subversion: '1.50.61',
  },
  {
    id: 'thm-11-5',
    chapter: 11,
    section: 5,
    name: 'basis and dimension theorem: all bases of R² have 2 elements',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-11-4'],
    status: 'proved',
    testId: 'proof-11-5-dimension',
    platformConnection: 'SkillPosition requires exactly 2 coordinates (theta, radius); dimension is invariant',
    subversion: '1.50.61',
  },
];

// ---------------------------------------------------------------------------
// Chapter 12: Linear Algebra (Phase 477)
// ---------------------------------------------------------------------------
export const ch12Proofs: ProofStatement[] = [
  {
    id: 'thm-12-1',
    chapter: 12,
    section: 1,
    name: 'eigenvalue equation Av = λv and det(A − λI) = 0; R(θ) eigenvalues = e^(±iθ)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-11-1'],
    status: 'proved',
    testId: 'proof-12-1-eigenvalues',
    platformConnection: 'rotation matrix R(θ) eigenvalues e^(±iθ) = cos θ ± i sin θ — Euler\'s formula in disguise',
    subversion: '1.50.62',
  },
  {
    id: 'thm-12-2',
    chapter: 12,
    section: 2,
    name: 'spectral theorem: symmetric matrices have real eigenvalues and orthogonal eigenvectors',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-11-2', 'thm-12-1'],
    status: 'proved',
    testId: 'proof-12-2-spectral-theorem',
    platformConnection: 'skill co-activation matrix is symmetric; real eigenvalues validate spectral skill clustering',
    subversion: '1.50.62',
  },
  {
    id: 'thm-12-3',
    chapter: 12,
    section: 3,
    name: 'determinant multiplicativity: det(AB) = det(A)·det(B)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-11-5'],
    status: 'proved',
    testId: 'proof-12-3-det-multiplicative',
    platformConnection: 'det(R(θ)) = 1 under composition; unit circle (det=1) closed under composePositions',
    subversion: '1.50.62',
  },
];

// ---------------------------------------------------------------------------
// Chapter 13: Vector Calculus (Phase 477)
// ---------------------------------------------------------------------------
export const ch13Proofs: ProofStatement[] = [
  {
    id: 'thm-13-1',
    chapter: 13,
    section: 1,
    name: 'gradient ∇f is direction of steepest ascent; D_u f = ∇f·u',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-11-2'],
    status: 'proved',
    testId: 'proof-13-1-gradient',
    platformConnection: 'computeAngularStep = bounded gradient descent; angular velocity update = gradient descent on quality metric',
    subversion: '1.50.63',
  },
  {
    id: 'thm-13-2',
    chapter: 13,
    section: 2,
    name: 'Divergence Theorem: ∯_S F·dA = ∭_V (∇·F) dV — proof sketch',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-9-2'],
    status: 'proved',
    testId: 'proof-13-2-divergence-theorem',
    platformConnection: 'skill influence propagation: total outflow across cluster boundary = total divergence within',
    subversion: '1.50.63',
  },
  {
    id: 'thm-13-3',
    chapter: 13,
    section: 3,
    name: "Stokes' Theorem: ∮_C F·dr = ∯_S (∇×F)·dA — FTC→Green→Stokes chain",
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-9-2', 'thm-13-2'],
    status: 'proved',
    testId: 'proof-13-3-stokes',
    platformConnection: 'rotation in skill-space; total angular change along composition path bounded by total curl',
    subversion: '1.50.63',
  },
];

// ---------------------------------------------------------------------------
// Chapter 14: Complex Analysis — Euler's Formula (Phase 477)
// ---------------------------------------------------------------------------
export const ch14Proofs: ProofStatement[] = [
  {
    id: 'thm-14-1',
    chapter: 14,
    section: 1,
    name: 'complex polar form z = r·e^(iθ); multiplication rule (r₁e^(iθ₁))(r₂e^(iθ₂)) = r₁r₂·e^(i(θ₁+θ₂))',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-2-1', 'thm-8-8', 'thm-11-1'],
    status: 'proved',
    testId: 'proof-14-1-complex-polar',
    platformConnection: 'SkillPosition IS r·e^(iθ); composePositions IS complex multiplication — P-002 RESOLVED (Type 4)',
    subversion: '1.50.64',
  },
  {
    id: 'thm-14-2',
    chapter: 14,
    section: 2,
    name: "Euler's formula e^(iθ) = cos θ + i sin θ — via Taylor series (THE CORE PROOF)",
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-8-8', 'thm-11-1'],
    status: 'proved',
    testId: 'proof-14-2-eulers-formula',
    platformConnection: 'PLAT-01: Euler\'s formula IS the reason SkillPosition uses polar coordinates and composePositions adds angles',
    subversion: '1.50.64',
  },
  {
    id: 'thm-14-3',
    chapter: 14,
    section: 3,
    name: 'Cauchy-Riemann equations: holomorphic iff ∂u/∂x=∂v/∂y and ∂u/∂y=-∂v/∂x',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-8-1', 'thm-13-1'],
    status: 'proved',
    testId: 'proof-14-3-cauchy-riemann',
    platformConnection: 'composePositions is holomorphic (satisfies Cauchy-Riemann); inherits infinite differentiability',
    subversion: '1.50.64',
  },
  {
    id: 'thm-14-4',
    chapter: 14,
    section: 4,
    name: 'Cauchy Integral Theorem: ∮_C f(z) dz = 0 for holomorphic f — proof sketch',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-14-3', 'thm-13-3'],
    status: 'proved',
    testId: 'proof-14-4-cauchy-integral',
    platformConnection: 'Euler composition forms a group: invertible, associative, closed under composition',
    subversion: '1.50.64',
  },
  {
    id: 'thm-14-5',
    chapter: 14,
    section: 5,
    name: 'Residue Theorem essential case: ∮_{|z|=1} 1/z dz = 2πi (L4 honest partial)',
    type: 'theorem',
    classification: 'L4',
    studentExperience: 'Acknowledged gap — Laurent series and winding numbers deferred to Ch 22',
    dependencies: ['thm-14-2'],
    status: 'acknowledged-gap',
    testId: 'proof-14-5-residue-basic',
    platformConnection: 'MIN_THETA guard regularizes singularity at θ=0 (exsecant pole); residue theory validates platform design',
    subversion: '1.50.64',
  },
];

// ---------------------------------------------------------------------------
// All Phase 477 proofs (Ch 11-14)
// ---------------------------------------------------------------------------
export const allPhase477Proofs: ProofStatement[] = [
  ...ch11Proofs,
  ...ch12Proofs,
  ...ch13Proofs,
  ...ch14Proofs,
];

// ---------------------------------------------------------------------------
// All proofs through Phase 477
// ---------------------------------------------------------------------------
export const allProofsThrough477: ProofStatement[] = [
  ...allProofsThrough476,
  ...allPhase477Proofs,
];

// ---------------------------------------------------------------------------
// Chapter 15: Physics Constants and Dimensional Analysis (Phase 478)
// ---------------------------------------------------------------------------
export const ch15Proofs: ProofStatement[] = [
  {
    id: 'thm-15-1',
    chapter: 15,
    section: 1,
    name: 'Buckingham Pi theorem for pendulum: rank-nullity gives 1 dimensionless group',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-12-1'],
    status: 'proved',
    testId: 'proof-15-1-buckingham-pi',
    platformConnection: 'rank-nullity theorem from linear algebra determines how many dimensionless groups exist',
    subversion: '1.50.66',
  },
  {
    id: 'thm-15-2',
    chapter: 15,
    section: 2,
    name: 'natural units: F/(ma) = 1 is invariant under consistent rescaling of units',
    type: 'proposition',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-15-1'],
    status: 'proved',
    testId: 'proof-15-2-natural-units',
    platformConnection: 'src/packs/plane/types.ts radius ∈ [0,1] is natural units normalization — max skill strength = 1',
    subversion: '1.50.66',
  },
  {
    id: 'thm-15-3',
    chapter: 15,
    section: 3,
    name: 'fine structure constant α ≈ 1/137 is dimensionless and unit-invariant',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-15-1'],
    status: 'proved',
    testId: 'proof-15-3-fine-structure',
    platformConnection: 'MATURITY_THRESHOLD/MAX_ANGULAR_VELOCITY ratio is a dimensionless platform constant analogous to α',
    subversion: '1.50.66',
  },
];

// ---------------------------------------------------------------------------
// Chapter 16: Periodic Table and Atomic Structure (Phase 478)
// ---------------------------------------------------------------------------
export const ch16Proofs: ProofStatement[] = [
  {
    id: 'thm-16-1',
    chapter: 16,
    section: 1,
    name: 'shell capacity = 2n²: sum of subshell capacities 2(2l+1) for l=0..n-1',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-16-1-shell-filling',
    platformConnection: 'discrete levels with increasing capacity mirror shell capacity sequence',
    subversion: '1.50.66',
  },
  {
    id: 'thm-16-2',
    chapter: 16,
    section: 2,
    name: 'periodicity: Aufbau recurrence generates period lengths [2,8,8,18,18,32]',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-16-1'],
    status: 'proved',
    testId: 'proof-16-2-periodicity',
    platformConnection: 'PROMOTION_REGIONS as discrete angular sectors — both systems partition space into discrete levels',
    subversion: '1.50.66',
  },
];

// ---------------------------------------------------------------------------
// Chapter 17: Quantum Mechanics (Phase 478)
// ---------------------------------------------------------------------------
export const ch17Proofs: ProofStatement[] = [
  {
    id: 'thm-17-1',
    chapter: 17,
    section: 1,
    name: 'L²(ℝ) inner product axioms hold for Gaussian wave packets',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-9-4', 'thm-11-1'],
    status: 'proved',
    testId: 'proof-17-1-hilbert-space',
    platformConnection: 'skill co-activation inner product satisfies Hilbert space axioms (positivity, symmetry, linearity)',
    subversion: '1.50.66',
  },
  {
    id: 'thm-17-2',
    chapter: 17,
    section: 2,
    name: 'Heisenberg uncertainty: ΔxΔp = ħ/2 for Gaussian (minimum uncertainty state)',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-17-1'],
    status: 'proved',
    testId: 'proof-17-2-uncertainty-principle',
    platformConnection: 'MIN_THETA · MAX_ANGULAR_VELOCITY ≥ constant analogous to Heisenberg lower bound',
    subversion: '1.50.66',
  },
  {
    id: 'thm-17-3',
    chapter: 17,
    section: 3,
    name: 'hydrogen Eₙ = -13.6 eV/n² and Balmer spectral lines (L4 honest partial)',
    type: 'theorem',
    classification: 'L4',
    studentExperience: 'Acknowledged gap — full eigenvalue derivation requires functional analysis',
    dependencies: ['thm-17-1'],
    status: 'acknowledged-gap',
    testId: 'proof-17-3-hydrogen-energy',
    platformConnection: 'discrete promotion levels mirror discrete energy quantization',
    subversion: '1.50.66',
  },
];

// ---------------------------------------------------------------------------
// Chapter 18: Set Theory (Phase 478)
// ---------------------------------------------------------------------------
export const ch18Proofs: ProofStatement[] = [
  {
    id: 'thm-18-1',
    chapter: 18,
    section: 1,
    name: 'Russell paradox: naive comprehension is inconsistent; ZFC Separation prevents it',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-18-1-russell-paradox',
    platformConnection: 'ZFC Separation mirrors security-hygiene skill: bounded access prevents self-referential loops',
    subversion: '1.50.67',
  },
  {
    id: 'thm-18-2',
    chapter: 18,
    section: 2,
    name: 'Von Neumann ordinals construct ℕ; Peano axioms verified in ZFC',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-18-1'],
    status: 'proved',
    testId: 'proof-18-2-natural-numbers',
    platformConnection: 'version number ordering (ℕ-structure) underlies plan and phase tracking',
    subversion: '1.50.67',
  },
  {
    id: 'thm-18-3',
    chapter: 18,
    section: 3,
    name: 'Cantor theorem: |P(A)| > |A| — no surjection A → P(A) (diagonalization)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-18-2'],
    status: 'proved',
    testId: 'proof-18-3-cantor-theorem',
    platformConnection: 'skill-space is strictly richer than any finite enumeration — no finite skill registry can cover all skills',
    subversion: '1.50.67',
  },
];

// ---------------------------------------------------------------------------
// Chapter 19: Logic and Proof Theory (Phase 478)
// ---------------------------------------------------------------------------
export const ch19Proofs: ProofStatement[] = [
  {
    id: 'thm-19-1',
    chapter: 19,
    section: 1,
    name: 'De Morgan laws: ¬(P∧Q) ↔ ¬P∨¬Q and ¬(P∨Q) ↔ ¬P∧¬Q (truth table)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-19-1-boolean-algebra',
    platformConnection: 'NOT/AND/OR are the logical primitives underlying all skill activation conditions',
    subversion: '1.50.68',
  },
  {
    id: 'thm-19-2',
    chapter: 19,
    section: 2,
    name: 'soundness of modus ponens, tollens, hypothetical syllogism, disjunctive syllogism',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-19-1'],
    status: 'proved',
    testId: 'proof-19-2-soundness',
    platformConnection: 'inference rules are the logical backbone of agent reasoning chains',
    subversion: '1.50.68',
  },
  {
    id: 'thm-19-3',
    chapter: 19,
    section: 3,
    name: 'propositional completeness outline: all tautologies provable from Boolean axioms',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-19-1', 'thm-19-2'],
    status: 'proved',
    testId: 'proof-19-3-completeness-outline',
    platformConnection: 'completeness guarantees that all true activation conditions are expressible',
    subversion: '1.50.68',
  },
];

// ---------------------------------------------------------------------------
// Chapter 20: Probability and Statistics (Phase 478)
// ---------------------------------------------------------------------------
export const ch20Proofs: ProofStatement[] = [
  {
    id: 'thm-20-1',
    chapter: 20,
    section: 1,
    name: "Bayes' theorem: P(A|B) = P(B|A)P(A)/P(B); medical test example ≈ 49%",
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: [],
    status: 'proved',
    testId: 'proof-20-1-bayes-theorem',
    platformConnection: 'computeEnhancedScore in src/packs/plane/activation.ts IS Bayesian inference (identity-level connection)',
    subversion: '1.50.70',
  },
  {
    id: 'thm-20-2',
    chapter: 20,
    section: 2,
    name: 'Weak Law of Large Numbers: P(|X̄ₙ − μ| > ε) ≤ σ²/(nε²) via Chebyshev',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-20-1'],
    status: 'proved',
    testId: 'proof-20-2-law-of-large-numbers',
    platformConnection: 'long-run average skill score converges to true quality — law of large sessions',
    subversion: '1.50.70',
  },
  {
    id: 'thm-20-3',
    chapter: 20,
    section: 3,
    name: 'Central Limit Theorem (simulation): standardized Uniform[0,1] sums → N(0,1), KS < 0.02',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-20-2'],
    status: 'proved',
    testId: 'proof-20-3-central-limit-theorem',
    platformConnection: 'aggregated skill scores across many sessions approximate a normal distribution',
    subversion: '1.50.70',
  },
];

// ---------------------------------------------------------------------------
// All Phase 478 proofs (Ch 15-20)
// ---------------------------------------------------------------------------
export const allPhase478Proofs: ProofStatement[] = [
  ...ch15Proofs,
  ...ch16Proofs,
  ...ch17Proofs,
  ...ch18Proofs,
  ...ch19Proofs,
  ...ch20Proofs,
];

// ---------------------------------------------------------------------------
// All proofs through Phase 478
// ---------------------------------------------------------------------------
export const allProofsThrough478: ProofStatement[] = [
  ...allProofsThrough477,
  ...allPhase478Proofs,
];

// ---------------------------------------------------------------------------
// Chapter 21: Abstract Algebra (Phase 479)
// ---------------------------------------------------------------------------
export const ch21Proofs: ProofStatement[] = [
  {
    id: 'thm-21-A',
    chapter: 21,
    section: 0,
    name: 'Group axioms — definitional L5 (7th L5-AXIOM instance)',
    type: 'definition',
    classification: 'L5',
    studentExperience: 'Acknowledged gap — definitional axioms accepted',
    dependencies: [],
    status: 'acknowledged-gap',
    platformConnection: 'Skill composition satisfies group axioms (associativity, identity)',
    subversion: '1.50.71',
  },
  {
    id: 'thm-21-1',
    chapter: 21,
    section: 1,
    name: "Lagrange's theorem: |H| divides |G| for any subgroup H of finite group G",
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-21-A'],
    status: 'proved',
    testId: 'proof-21-1-lagrange',
    platformConnection: 'Skill refinement phases divide total plans — divisibility structure',
    subversion: '1.50.71',
  },
  {
    id: 'thm-21-2',
    chapter: 21,
    section: 2,
    name: 'First isomorphism theorem: G/ker(φ) ≅ im(φ)',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-21-1'],
    status: 'proved',
    testId: 'proof-21-2-isomorphism',
    platformConnection: 'Skill projection through kernel = signal-classification quotient structure',
    subversion: '1.50.71',
  },
  {
    id: 'thm-21-3',
    chapter: 21,
    section: 3,
    name: "Stokes' theorem via differential forms: d² = 0; Green's theorem as special case",
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-21-2'],
    status: 'proved',
    testId: 'proof-21-3-stokes-forms',
    platformConnection: 'Differential structure of skill positions on the plane (angular derivative)',
    subversion: '1.50.71',
  },
];

// ---------------------------------------------------------------------------
// Chapter 22: Topology (Phase 479)
// ---------------------------------------------------------------------------
export const ch22Proofs: ProofStatement[] = [
  {
    id: 'thm-22-A',
    chapter: 22,
    section: 0,
    name: 'Topological open-set axioms — definitional L5 (8th L5-AXIOM instance)',
    type: 'definition',
    classification: 'L5',
    studentExperience: 'Acknowledged gap — definitional axioms accepted',
    dependencies: [],
    status: 'acknowledged-gap',
    platformConnection: 'Skill activation neighborhoods form open sets in the skill topology',
    subversion: '1.50.72',
  },
  {
    id: 'thm-22-1',
    chapter: 22,
    section: 1,
    name: 'Continuous image of compact set is compact (f(x)=x² on [0,1])',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-22-A'],
    status: 'proved',
    testId: 'proof-22-1-continuous-compact',
    platformConnection: 'Bounded skill radius maps to bounded activation score range',
    subversion: '1.50.72',
  },
  {
    id: 'thm-22-2',
    chapter: 22,
    section: 2,
    name: 'Heine-Borel theorem: [0,1] compact ↔ closed and bounded in ℝ',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-22-1'],
    status: 'proved',
    testId: 'proof-22-2-heine-borel',
    platformConnection: 'Skill position space [0,2π] × [0,1] is compact — bounded learning',
    subversion: '1.50.72',
  },
  {
    id: 'thm-22-3',
    chapter: 22,
    section: 3,
    name: 'Banach fixed-point theorem: T(x)=x/2+1 converges to x*=2 (CLOSES L5-B-001)',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-22-2'],
    status: 'proved',
    testId: 'proof-22-3-banach-fpt',
    platformConnection: 'Learning update in observer-bridge.ts is a contraction — skill positions converge',
    subversion: '1.50.72',
  },
];

// ---------------------------------------------------------------------------
// Chapter 23: Category Theory (Phase 479)
// ---------------------------------------------------------------------------
export const ch23Proofs: ProofStatement[] = [
  {
    id: 'thm-23-A',
    chapter: 23,
    section: 0,
    name: 'Category axioms — definitional L5 (9th L5-AXIOM instance)',
    type: 'definition',
    classification: 'L5',
    studentExperience: 'Acknowledged gap — definitional axioms accepted',
    dependencies: [],
    status: 'acknowledged-gap',
    platformConnection: 'Skill domain with composition satisfies category axioms (src/packs/plane/composition.ts)',
    subversion: '1.50.73',
  },
  {
    id: 'thm-23-1',
    chapter: 23,
    section: 1,
    name: 'Category axioms verified for Set, Grp, Top; skill domain is a category',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-23-A'],
    status: 'proved',
    testId: 'proof-23-1-category-axioms',
    platformConnection: 'src/packs/plane/composition.ts implements categorical composition (identity-level)',
    subversion: '1.50.73',
  },
  {
    id: 'thm-23-2',
    chapter: 23,
    section: 2,
    name: 'Functor preserves composition and identities: chipset IS a functor',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-23-1'],
    status: 'proved',
    testId: 'proof-23-2-functor',
    platformConnection: 'config/crews/ crew configuration IS a functor (identity-level connection)',
    subversion: '1.50.73',
  },
  {
    id: 'thm-23-B',
    chapter: 23,
    section: 3,
    name: 'Yoneda lemma (L4 partial): |Nat(Hom(−,A),F)| = |F(A)| verified for small category',
    type: 'theorem',
    classification: 'L4',
    studentExperience: 'Acknowledged gap — bijection verified for small category; full generality L4',
    dependencies: ['thm-23-2'],
    status: 'acknowledged-gap',
    testId: 'proof-23-3-yoneda-partial',
    platformConnection: 'Activation function in src/packs/plane/activation.ts IS Yoneda embedding (identity-level)',
    subversion: '1.50.73',
  },
];

// ---------------------------------------------------------------------------
// Chapter 24: Information Theory (Phase 479)
// ---------------------------------------------------------------------------
export const ch24Proofs: ProofStatement[] = [
  {
    id: 'thm-24-A',
    chapter: 24,
    section: 0,
    name: 'Shannon entropy axioms — definitional L5 (10th L5-AXIOM instance)',
    type: 'definition',
    classification: 'L5',
    studentExperience: 'Acknowledged gap — definitional axioms accepted',
    dependencies: [],
    status: 'acknowledged-gap',
    platformConnection: 'Signal classification reduces entropy — Shannon framework applies to skill activation',
    subversion: '1.50.74',
  },
  {
    id: 'thm-24-1',
    chapter: 24,
    section: 1,
    name: 'Shannon entropy formula from axioms: H = −∑pᵢ log pᵢ uniquely satisfies axioms',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-24-A'],
    status: 'proved',
    testId: 'proof-24-1-shannon-entropy',
    platformConnection: 'src/packs/plane/signal-classification.ts 12-type taxonomy reduces entropy (identity-level)',
    subversion: '1.50.74',
  },
  {
    id: 'thm-24-2',
    chapter: 24,
    section: 2,
    name: 'Source coding theorem: Huffman achieves H ≤ L < H+1 (4-symbol source)',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-24-1'],
    status: 'proved',
    testId: 'proof-24-2-source-coding',
    platformConnection: 'Signal taxonomy ≈ Huffman code for context signals (identity-level)',
    subversion: '1.50.74',
  },
  {
    id: 'thm-24-B',
    chapter: 24,
    section: 3,
    name: 'Noisy channel coding theorem (L4): converse direction via Fano inequality',
    type: 'theorem',
    classification: 'L4',
    studentExperience: 'Acknowledged gap — converse proved; achievability requires L4 random coding',
    dependencies: ['thm-24-2'],
    status: 'acknowledged-gap',
    testId: 'proof-24-3-channel-capacity',
    platformConnection: 'Token budget as rate control below context window capacity (structural)',
    subversion: '1.50.74',
  },
];

// ---------------------------------------------------------------------------
// Chapter 25: Signal Processing (Phase 479)
// ---------------------------------------------------------------------------
export const ch25Proofs: ProofStatement[] = [
  {
    id: 'thm-25-1',
    chapter: 25,
    section: 1,
    name: 'Fourier inversion theorem: DFT round-trip + Parseval; CLOSES CLT Fourier gap',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-24-1', 'thm-22-3'],
    status: 'proved',
    testId: 'proof-25-1-fourier-inversion',
    platformConnection: 'Activation signal Fourier decomposition is lossless (src/packs/plane/activation.ts)',
    subversion: '1.50.75',
  },
  {
    id: 'thm-25-2',
    chapter: 25,
    section: 2,
    name: 'Nyquist-Shannon sampling theorem: above Nyquist reconstructs; below aliases',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-25-1'],
    status: 'proved',
    testId: 'proof-25-2-nyquist',
    platformConnection: 'Observer-bridge.ts sampling rate must satisfy Nyquist condition (identity-level)',
    subversion: '1.50.75',
  },
  {
    id: 'thm-25-3',
    chapter: 25,
    section: 3,
    name: 'Convolution theorem: direct convolution = frequency-domain multiplication',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-25-1'],
    status: 'proved',
    testId: 'proof-25-3-convolution',
    platformConnection: 'Pattern detection in signal-classification.ts as frequency-domain matching (structural)',
    subversion: '1.50.75',
  },
];

// ---------------------------------------------------------------------------
// Chapter 26: Computation (Phase 479)
// ---------------------------------------------------------------------------
export const ch26Proofs: ProofStatement[] = [
  {
    id: 'thm-26-1',
    chapter: 26,
    section: 1,
    name: 'Halting problem undecidable: diagonal construction DIAG defeats any total detector',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-19-1'],
    status: 'proved',
    testId: 'proof-26-1-halting',
    platformConnection: 'Probabilistic activation in src/packs/plane/activation.ts is the correct response to undecidability',
    subversion: '1.50.76',
  },
  {
    id: 'thm-26-2',
    chapter: 26,
    section: 2,
    name: 'P ⊆ NP (L2); Cook-Levin: SAT is NP-complete (L4 outline)',
    type: 'theorem',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-26-1'],
    status: 'proved',
    testId: 'proof-26-2-cook-levin',
    platformConnection: 'Geometric approximation (θ,r) converts NP-hard skill matching to polynomial-time',
    subversion: '1.50.76',
  },
  {
    id: 'thm-26-A',
    chapter: 26,
    section: 3,
    name: 'P vs NP open problem — acknowledged, relativization barrier, unresolved',
    type: 'theorem',
    classification: 'L4',
    studentExperience: 'Acknowledged gap — open problem; diagonalization cannot resolve due to relativization barrier',
    dependencies: ['thm-26-2'],
    status: 'acknowledged-gap',
    platformConnection: 'P vs NP is genuinely open; platform correctly uses approximation not exact optimization',
    subversion: '1.50.76',
  },
];

// ---------------------------------------------------------------------------
// Chapter 27: AI/ML Foundations (Phase 479)
// ---------------------------------------------------------------------------
export const ch27Proofs: ProofStatement[] = [
  {
    id: 'thm-27-1',
    chapter: 27,
    section: 1,
    name: 'Universal approximation theorem: 1-hidden-layer σ network approximates any continuous f',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-22-2', 'thm-25-1'],
    status: 'proved',
    testId: 'proof-27-1-universal-approx',
    platformConnection: 'Claude model has universal approximation capacity for skill activation rules',
    subversion: '1.50.77',
  },
  {
    id: 'thm-27-2',
    chapter: 27,
    section: 2,
    name: 'Backpropagation = chain rule (Ch 8 Proof 8.5): gradient check < 1e-5',
    type: 'identity',
    classification: 'L2',
    studentExperience: 'I can do this',
    dependencies: ['thm-27-1'],
    status: 'proved',
    testId: 'proof-27-2-backprop',
    platformConnection: 'Chain rule (Ch 8) IS the algorithm training the AI system executing this proof',
    subversion: '1.50.77',
  },
  {
    id: 'thm-27-3',
    chapter: 27,
    section: 3,
    name: 'Gradient descent convergence: O(1/k) rate for L-smooth convex f',
    type: 'theorem',
    classification: 'L3',
    studentExperience: 'This is hard but I am getting it',
    dependencies: ['thm-22-3', 'thm-27-2'],
    status: 'proved',
    testId: 'proof-27-3-gradient-descent',
    platformConnection: 'computeAngularStep in observer-bridge.ts IS gradient descent — O(1/k) convergence',
    subversion: '1.50.77',
  },
  {
    id: 'thm-27-A',
    chapter: 27,
    section: 4,
    name: 'Attention mechanism: geometric structure L2; expressiveness and training convergence L4',
    type: 'theorem',
    classification: 'L4',
    studentExperience: 'Acknowledged gap — attention structure proved at L2; full expressiveness L4',
    dependencies: ['thm-27-1'],
    status: 'acknowledged-gap',
    platformConnection: 'Attention mechanism IS skill-creator activation formalized (identity-level)',
    subversion: '1.50.77',
  },
];

// ---------------------------------------------------------------------------
// All Phase 479 proofs by Part
// ---------------------------------------------------------------------------
export const allPhase479PartVIIProofs: ProofStatement[] = [
  ...ch21Proofs,
  ...ch22Proofs,
  ...ch23Proofs,
];

export const allPhase479PartVIIIProofs: ProofStatement[] = [
  ...ch24Proofs,
  ...ch25Proofs,
  ...ch26Proofs,
];

export const allPhase479PartIXProofs: ProofStatement[] = [
  ...ch27Proofs,
];

// ---------------------------------------------------------------------------
// All Phase 479 proofs (Ch 21-27)
// ---------------------------------------------------------------------------
export const allPhase479Proofs: ProofStatement[] = [
  ...allPhase479PartVIIProofs,
  ...allPhase479PartVIIIProofs,
  ...allPhase479PartIXProofs,
];

// ---------------------------------------------------------------------------
// All proofs through Phase 479 (Ch 1-27)
// ---------------------------------------------------------------------------
export const allProofsThrough479: ProofStatement[] = [
  ...allProofsThrough478,
  ...allPhase479Proofs,
];
