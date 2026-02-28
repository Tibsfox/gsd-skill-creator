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
