/**
 * Millennium Problem Catalogue try-session -- first hands-on contact with the Clay prize problems.
 *
 * Walk a learner through the seven Millennium Problems: what each asks, which one is solved,
 * how Fefferman's formal Navier-Stokes statement works, and how the catalogue sits alongside
 * other open-problem indices.
 *
 * @module departments/mathematics/try-sessions/millennium-problem-catalogue
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const millenniumProblemCatalogueSession: TrySessionDefinition = {
  id: 'math-millennium-problem-catalogue-first-steps',
  title: 'The Seven Clay Millennium Prize Problems',
  description:
    'A guided first pass through the seven Clay Millennium Problems: read each canonical ' +
    'statement, identify Poincaré as the one solved, and study Fefferman\'s formal Navier-Stokes ' +
    'conjectures.',
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Visit claymath.org/millennium-problems. List the seven problems with one-sentence summaries of each.',
      expectedOutcome:
        'You write: (1) Riemann Hypothesis, (2) P vs NP, (3) Navier-Stokes existence and smoothness, (4) Yang-Mills existence and mass gap, (5) Birch and Swinnerton-Dyer, (6) Hodge Conjecture, (7) Poincaré Conjecture (solved).',
      hint: 'The catalogue is canonical: seven problems, each with its own official statement page.',
      conceptsExplored: ['math-millennium-problem-catalogue', 'math-complex-numbers'],
    },
    {
      instruction:
        'Read the story of Poincaré\'s resolution: Perelman\'s three arXiv preprints (2002-2003) applied Hamilton\'s Ricci flow with surgery. Why did Perelman decline both the 2006 Fields Medal and the 2010 Clay prize?',
      expectedOutcome:
        'You understand that Perelman cited objections to the ethics of the mathematical community and the priority disputes around the resolution. He stepped away from formal recognition while the proof remained public.',
      hint: 'Perelman gave several interviews explaining his reasoning. The short answer: he did not want to be a face of the community as it was.',
      conceptsExplored: ['math-millennium-problem-catalogue'],
    },
    {
      instruction:
        'Open Fefferman\'s official Navier-Stokes problem description (claymath.org/wp-content/uploads/2022/06/navierstokes.pdf). Read the four conjectures (A, B, C, D). Which pair is on R^3 and which pair is on the three-torus?',
      expectedOutcome:
        'You identify: A and B are on R^3 (whole space), C and D on the three-torus T^3 (periodic). A and C assert global smoothness, B and D assert breakdown.',
      hint: 'Fefferman splits the problem by domain (R^3 vs T^3) and by conclusion (existence vs breakdown).',
      conceptsExplored: ['math-millennium-problem-catalogue'],
    },
    {
      instruction:
        'Fefferman\'s conjecture A asks: given smooth divergence-free initial data with bounded energy in R^3, does a smooth solution exist for all time? This is exactly the global-regularity Millennium statement. Why is the divergence-free condition essential?',
      expectedOutcome:
        'You explain that incompressible Navier-Stokes requires div(u) = 0 to preserve incompressibility. Without it, the equations do not model a real fluid.',
      hint: 'Incompressibility is the physical constraint; it forces a pressure term via the projection onto divergence-free fields.',
      conceptsExplored: ['math-millennium-problem-catalogue'],
    },
    {
      instruction:
        'Read the connection between conjecture B (breakdown on R^3) and the Merle-Raphaël-Rodnianski-Szeftel 2019 compressible implosion papers. What did MRRS establish? Why does it not resolve conjecture B?',
      expectedOutcome:
        'You understand that MRRS proved finite-time blow-up for the COMPRESSIBLE Navier-Stokes equations from smooth finite-energy data. Conjecture B is for INCOMPRESSIBLE NS. The two remain separate; MRRS is not a proof of B.',
      hint: 'Compressibility changes the equation. The Millennium prize still stands because the incompressible case is open.',
      conceptsExplored: ['math-millennium-problem-catalogue', 'math-blow-up-dynamics'],
    },
    {
      instruction:
        'Compare the Millennium catalogue to the Erdős index. How are they different kinds of registries of open problems?',
      expectedOutcome:
        'You articulate: Millennium = seven canonical problems, huge prize per problem, highly selective, curated by Clay. Erdős = 1,100+ problems, usually no prize or small prizes, comprehensive, curated by Bloom / Tao. Different granularity, different ambition.',
      hint: 'Millennium is Linnaean-rank; Erdős is a field guide.',
      conceptsExplored: ['math-millennium-problem-catalogue', 'math-erdos-problem-index'],
    },
    {
      instruction:
        'Close by writing one sentence locating the catalogue on the complex plane: theta near 2pi (end of the ring), radius 0.85. Why is this placement natural?',
      expectedOutcome:
        'You articulate that the catalogue sits at the canonical problem-registry end of the 19-concept ring, near its neighbour math-erdos-problem-index, both at high radius because their content is deeply mathematical even when their form is a list.',
      hint: 'The complex-plane ring places catalogues together at the "problem-curation" end.',
      conceptsExplored: ['math-millennium-problem-catalogue'],
    },
  ],
};
