/**
 * Ice Nucleation Modes try-session -- homogeneous + 4 heterogeneous modes.
 *
 * Walk a learner from the observation that pure water can be supercooled
 * far below 0 °C, through the four heterogeneous nucleation modes, to
 * the INP/CCN scarcity asymmetry that powers the WBF process.
 *
 * @module departments/materials/try-sessions/ice-nucleation-modes
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const iceNucleationModesSession: TrySessionDefinition = {
  id: 'materials-ice-nucleation-modes-first-steps',
  title: 'Ice Nucleation: Five Ways a Crystal Can Be Born',
  description:
    'A guided first pass through ice nucleation -- from the supercooling ' +
    'limit of pure water, through the four heterogeneous modes (deposition, ' +
    'condensation, immersion, contact), to the INP-vs-CCN scarcity ratio ' +
    'that makes mixed-phase clouds precipitate.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Put a bottle of unopened purified water in a freezer at -15 °C for 2 hours. Take it out gently and flick it. What do you observe? Read about homogeneous nucleation: why does pure water stay liquid far below 0 °C?',
      expectedOutcome:
        'You see the water freeze from a single impact point outward in seconds -- supercooled water waiting to nucleate. You articulate that homogeneous nucleation of pure water requires roughly -38 °C supercooling in the atmosphere; the energy barrier to spontaneously assemble an ice embryo is too high above that.',
      hint: 'In lab cloud chambers, homogeneous freezing of cloud droplets sets in sharply near -38 to -40 °C. Above that, you need a helper particle.',
      conceptsExplored: ['materials-ice-nucleation-modes'],
    },
    {
      instruction:
        'Read about the four heterogeneous nucleation modes: deposition, condensation freezing, immersion freezing, contact freezing. In your own words, describe the order of operations in each: at what stage does the INP meet the water (vapor-first, droplet-first, or collision)?',
      expectedOutcome:
        'You articulate: (1) Deposition -- vapor -> solid directly onto an INP. (2) Condensation freezing -- vapor condenses onto a hygroscopic INP, which then freezes as the droplet cools. (3) Immersion -- INP already inside a supercooled droplet triggers freezing. (4) Contact -- an INP collides with a droplet surface and triggers freezing on contact.',
      hint: 'Each mode activates over a different temperature/RH envelope. Immersion dominates in real mixed-phase clouds; deposition is more important in cirrus.',
      conceptsExplored: ['materials-ice-nucleation-modes', 'chem-reaction-types'],
    },
    {
      instruction:
        'Now think about what makes a surface a good INP: the classic story is "lattice matching" -- a crystalline surface whose spacing resembles ice Ih. K-feldspar, a common component of mineral dust, is the runaway winner per surface area. Why is surface chemistry, not bulk material, the key?',
      expectedOutcome:
        'You explain that nucleation is a surface process: only a small patch of the INP surface needs to template the ice embryo. K-feldspar exposes a high-energy (100) face whose basal-plane spacing matches ice well; soot and kaolinite are much weaker per area. The material composition matters only because it determines the crystallography of the exposed surface.',
      hint: 'Atkinson et al. 2013 (Nature) showed K-feldspar dust dominates global INP abundance in the -10 to -30 °C band, despite being a minority of dust by mass.',
      conceptsExplored: ['materials-ice-nucleation-modes', 'chem-reaction-types'],
    },
    {
      instruction:
        'Biological INPs are a different beast. Pseudomonas syringae (a plant pathogen) and related bacteria express ice-nucleation active (INA) proteins that can trigger freezing as warm as -2 °C. Why do bacteria do this -- what is the ecological advantage? And what does it mean for atmospheric chemistry?',
      expectedOutcome:
        'You explain that bacteria use INA proteins to freeze plants and rupture cell walls, releasing nutrients. Atmospheric consequence: bio-INPs dominate the warmest-temperature INP population. A fraction of rain over agricultural regions may trace back to bacterial nucleation activity -- the "bioprecipitation" hypothesis (Sands et al. 1982, Morris et al. 2014).',
      hint: 'Snowmax, used in commercial ski-resort snow guns, is freeze-dried Pseudomonas syringae cell walls -- the same INA protein, deployed at industrial scale.',
      conceptsExplored: ['materials-ice-nucleation-modes'],
    },
    {
      instruction:
        'Estimate atmospheric INP concentrations: a clean boundary-layer cloud has ~100 CCN/cm^3 but only ~0.001 to 0.01 INP/cm^3 at -15 °C. The ratio is roughly 10^4:1. Why does this scarcity matter for mixed-phase cloud precipitation? Relate to WBF.',
      expectedOutcome:
        'You articulate that because INPs are ~10^4 times rarer than CCN, each ice crystal has ~10^4 supercooled droplets in its neighborhood. The vapor-pressure gap e_s^w - e_s^i lets one crystal consume thousands of droplets worth of water -- this INP/CCN asymmetry is precisely what makes the WBF process efficient enough to produce precipitation.',
      hint: 'If every droplet had its own INP, WBF would stall: no mass asymmetry to drive the vapor gradient. Scarcity is a feature, not a bug.',
      conceptsExplored: ['materials-ice-nucleation-modes', 'materials-wbf-mixed-phase'],
    },
    {
      instruction:
        'Read about the standard INP spectrum parametrisations: Vali 1985 cumulative-spectrum framework, DeMott 2010 temperature-dependent empirical fit, Niemand 2012 ns(T) approach. What do these parametrisations predict, and what are their limits?',
      expectedOutcome:
        'You explain that parametrisations like DeMott 2010 give N_INP(T) in 1/m^3 as a function of temperature and dust-particle number concentration. They reproduce mean behaviour well but miss mineralogical variation (K-feldspar vs kaolinite), humidity dependence in the deposition regime, and biological INP contribution at warm subzero temperatures. Pruppacher & Klett 2010 textbook summarises the full landscape.',
      hint: 'The dominant uncertainty in mixed-phase cloud simulation is INP concentration, not droplet physics. Two models with the same CCN but different INP parametrisations can differ by 30% in precipitation.',
      conceptsExplored: ['materials-ice-nucleation-modes'],
    },
    {
      instruction:
        'Close by placing ice nucleation on the complex plane of experience: it is a concrete surface-chemistry phenomenon with high complexity (five distinct modes, each with its own temperature/RH envelope). State one line that captures why nucleation mode-diversity is the defining challenge in cold-cloud microphysics.',
      expectedOutcome:
        'You state something like: "Ice nucleation = one homogeneous mode + four heterogeneous modes (deposition, condensation, immersion, contact), each with its own INP-mineralogy envelope. INPs are ~10^4 rarer than CCN, and that scarcity is what makes WBF turn mid-latitude clouds into precipitation."',
      hint: 'Every snowflake that has ever fallen traces its lineage to a specific INP surface -- K-feldspar dust, volcanic ash, soot, or Pseudomonas.',
      conceptsExplored: ['materials-ice-nucleation-modes', 'materials-wbf-mixed-phase'],
    },
  ],
};
