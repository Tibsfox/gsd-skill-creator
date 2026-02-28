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
    platformConnection: 'src/plane/types.ts SkillPosition real-valued radius',
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
    platformConnection: 'src/plane/position-store.ts enumerable positions',
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
    platformConnection: 'src/plane/observer-bridge.ts angular constraint; src/plane/types.ts SkillPositionSchema',
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
    platformConnection: 'src/plane/observer-bridge.ts symmetric angular clamping',
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
    platformConnection: 'src/plane/activation.ts TangentContext',
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
    platformConnection: 'src/plane/composition.ts Euler-based skill composition',
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
    platformConnection: 'src/plane/types.ts SkillPosition (r, theta) coordinate system',
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
    platformConnection: 'src/plane/activation.ts tangentScore bounded by Cauchy-Schwarz (HIGH CONSEQUENCE)',
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
    platformConnection: 'src/plane/position-store.ts angular distance between skills',
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
    platformConnection: 'src/plane/arithmetic.ts angular addition',
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
    platformConnection: 'src/plane/arithmetic.ts angular addition',
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
    platformConnection: 'src/plane/signal-classification.ts beat-frequency sensitivity (HIGH CONSEQUENCE)',
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
    platformConnection: 'src/plane/chords.ts terminological (chord name mapping)',
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
    platformConnection: 'src/plane/signal-classification.ts structural parallel',
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
      'src/plane/observer-bridge.ts velocity clamping — boundary conditions → angular velocity bound (HIGH CONSEQUENCE)',
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
    platformConnection: 'src/plane/signal-classification.ts classifySignals (Fourier → signal decomposition)',
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
    platformConnection: 'src/plane/signal-classification.ts 12 signal categories as Z₁₂ structural parallel',
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
    platformConnection: 'src/plane/types.ts MATURITY_THRESHOLD convergence',
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
    platformConnection: 'src/plane/types.ts SkillPosition coordinate vs. discrete label design',
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
    platformConnection: 'src/plane/observer-bridge.ts angular velocity as discrete derivative',
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
    platformConnection: 'src/plane/observer-bridge.ts radius growth as discrete Riemann sum',
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
    platformConnection: 'src/plane/observer-bridge.ts skill position oscillation dynamics',
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
