/**
 * Köhler Theory try-session -- droplet activation on cloud condensation nuclei.
 *
 * Walk a learner from the cloud-chamber observation of droplet activation,
 * through the competition between Kelvin curvature and Raoult solute terms,
 * to the critical supersaturation curve that governs every warm-cloud droplet.
 *
 * @module departments/chemistry/try-sessions/kohler-theory
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const kohlerTheorySession: TrySessionDefinition = {
  id: 'chemistry-kohler-theory-first-steps',
  title: 'Köhler Theory: How Soluble Nuclei Give Birth to Cloud Droplets',
  description:
    'A guided first pass through the Köhler 1936 activation theory -- from ' +
    'the cloud-chamber observation of droplet birth, through the Kelvin + ' +
    'Raoult competition, to the critical supersaturation curve that shapes ' +
    'every warm cloud.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Watch a classroom cloud-chamber demo (or read one up): a sealed jar is seeded with smoke, then the air is supersaturated by pulling a partial vacuum. A fog appears almost instantly. In your own words, why does the fog need the smoke to appear? What role do soluble particles play?',
      expectedOutcome:
        'You articulate that pure supersaturated vapor does not spontaneously form droplets -- the energy barrier to homogeneous nucleation is too high at atmospheric supersaturations (a few percent). Soluble particles (CCN) lower the barrier by providing a pre-existing surface plus a solute to reduce vapor pressure.',
      hint: 'Homogeneous nucleation needs ~300% supersaturation. Real clouds sit at 0.1-1% supersaturation. CCN bridge the gap.',
      conceptsExplored: ['chemistry-kohler-theory', 'chemistry-clausius-clapeyron'],
    },
    {
      instruction:
        'Write the two Köhler terms: Kelvin (curvature) a/r that RAISES e over a curved drop, and Raoult (solute) -b/r^3 that LOWERS e on a solution drop. What are the physical interpretations of a and b?',
      expectedOutcome:
        'You identify a = 2 sigma / (R_v rho_w T) ~ 1.5 nm-scale (surface-tension term), and b proportional to i * m_s * M_w / (M_s * rho_w) ~ 10^-21 m^3 (solute mass, molar mass, van\'t Hoff factor i for dissociation). The competition governs activation.',
      hint: 'Kelvin dominates at small r (1/r), Raoult dominates at very small r (1/r^3). Together they produce a single maximum S*.',
      conceptsExplored: ['chemistry-kohler-theory', 'chem-acids-bases'],
    },
    {
      instruction:
        'Plot S(r) = 1 + a/r - b/r^3 over r = 10 nm to 10 um (log scale) for a typical sulfate CCN (dry radius 50 nm, i = 3). Identify the peak: this is the critical supersaturation S* at critical radius r*. What do the two regimes r < r* and r > r* mean physically?',
      expectedOutcome:
        'You see the curve rise sharply, peak at S* ~ 1.003 (0.3% supersaturation) near r* ~ 0.3 um, then slowly approach 1. r < r*: droplet is in stable haze equilibrium. r > r*: runaway growth -- the droplet is activated and becomes a cloud droplet.',
      hint: 'Larger CCN have lower S* (activate easier). A clean maritime cloud (few large CCN) activates at ~0.2% supersaturation; a polluted continental cloud (many small CCN) needs ~0.5%.',
      conceptsExplored: ['chemistry-kohler-theory'],
    },
    {
      instruction:
        'Now place a CCN spectrum (log-normal in dry radius, 500 particles/cm^3) into a rising parcel with updraft w = 1 m/s. As supersaturation climbs, CCN activate in order from largest to smallest. What fraction activates at the peak supersaturation?',
      expectedOutcome:
        'You articulate that the updraft and CCN spectrum together set a peak supersaturation; every CCN with S* below that peak becomes a cloud droplet. Typical warm cumulus: 200-500 droplets/cm^3 activate from the 500-CCN spectrum. The rest stay as haze.',
      hint: 'Twomey 1959 gave the closed-form activation parametrisation; Abdul-Razzak & Ghan 2000 is the modern GCM workhorse.',
      conceptsExplored: ['chemistry-kohler-theory'],
    },
    {
      instruction:
        'Connect to clouds: activated cloud droplet number concentration N_d controls cloud albedo (Twomey effect) and lifetime (Albrecht effect) -- the two "aerosol indirect effects" that dominate anthropogenic climate uncertainty. Sketch the causal chain CCN -> N_d -> cloud properties.',
      expectedOutcome:
        'You explain: more CCN -> more activated droplets N_d -> smaller droplets for fixed liquid water content -> higher albedo (Twomey) + suppressed precipitation -> longer cloud lifetime (Albrecht). The IPCC AR6 effective radiative forcing from aerosol-cloud interaction sits at -0.84 W/m^2 with large uncertainty.',
      hint: 'Lohmann 2016 Chapter 4 and AR6 Chapter 7: aerosol-cloud interaction remains the single largest uncertainty in effective radiative forcing.',
      conceptsExplored: ['chemistry-kohler-theory', 'chemistry-clausius-clapeyron'],
    },
    {
      instruction:
        'Köhler\'s 1936 paper was written when the link between CCN and cloud droplets was barely understood. Read or skim the abstract. What is the core insight that makes his analysis survive as the textbook framework nearly a century later?',
      expectedOutcome:
        'You articulate that Köhler combined the Kelvin (1870) curvature correction with Raoult (1887) solute law to produce a single closed-form criterion for droplet activation. The physics is simple, universal across CCN composition via the van\'t Hoff factor, and the curve shape does not change with refinements.',
      hint: 'Kappa-Köhler (Petters & Kreidenweis 2007) parametrises composition with a single kappa; the classical curve shape is unchanged.',
      conceptsExplored: ['chemistry-kohler-theory'],
    },
    {
      instruction:
        'Close by placing Köhler theory on the complex plane of experience: an applied thermodynamic-chemistry law at the boundary of fluid dynamics (medium abstraction, medium complexity). State one line that captures why Köhler 1936 is the foundation of warm-cloud microphysics.',
      expectedOutcome:
        'You state something like: "Köhler: S(r) = 1 + a/r - b/r^3 has a single maximum S* at r*; below r* the droplet rests as haze, above r* it grows without bound -- every cloud droplet on Earth begins on the wet side of this curve."',
      hint: 'The competition between Kelvin curvature and Raoult solute is the quiet engine under every maritime stratocumulus deck and every orographic cloud.',
      conceptsExplored: ['chemistry-kohler-theory', 'chemistry-clausius-clapeyron'],
    },
  ],
};
