/**
 * K41 Cascade try-session -- Kolmogorov 1941 energy cascade and the -5/3 law.
 *
 * Walk a learner from Richardson's 1922 "big whirls have little whirls"
 * poem to the dimensional-analysis derivation of E(k) ~ k^(-5/3).
 *
 * @module departments/physics/try-sessions/k41-cascade
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const k41CascadeSession: TrySessionDefinition = {
  id: 'physics-k41-cascade-first-steps',
  title: 'K41 Cascade: The -5/3 Law That Describes Every Turbulent Flow',
  description:
    'A guided first pass through the Kolmogorov 1941 energy cascade -- from the ' +
    'Richardson intuition, through the dimensional-analysis derivation of the ' +
    '-5/3 spectrum, to the modern multifractal corrections.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Read Richardson\'s 1922 couplet: "Big whirls have little whirls that feed on their velocity, / and little whirls have lesser whirls and so on to viscosity." In your own words, describe the physical picture: what moves energy from large scales to small?',
      expectedOutcome:
        'You articulate an energy cascade: large eddies inject energy, break up into smaller eddies, which break up again, until the smallest scales dissipate via viscosity. The path is mostly one-way: injection (big) -> dissipation (small).',
      hint: 'Energy is injected at the integral scale L (stirring), cascades through an inertial range, and dissipates at the Kolmogorov scale eta.',
      conceptsExplored: ['physics-k41-cascade', 'math-fractal-geometry'],
    },
    {
      instruction:
        'Dimensional analysis: the only relevant quantities in the inertial subrange are the wavenumber k (1/m) and the dissipation rate epsilon (m^2/s^3). Combine them to form an energy spectrum E(k) with dimensions m^3/s^2. What is the unique combination?',
      expectedOutcome:
        'You derive E(k) = C_K * epsilon^(2/3) * k^(-5/3), with C_K dimensionless (~1.5 from experiment). The -5/3 is forced by dimensions once you assume universality in the inertial range.',
      hint: 'Dimensions: [E] = m^3/s^2, [epsilon] = m^2/s^3, [k] = 1/m. Solve a*2 + b*(-1) = 3 for the length dimension, etc.',
      conceptsExplored: ['physics-k41-cascade', 'math-logarithmic-scales'],
    },
    {
      instruction:
        'Compute the Kolmogorov length scale eta = (nu^3 / epsilon)^(1/4). For a stirred bathtub (nu_water = 1e-6 m^2/s, epsilon ~ 0.01 m^2/s^3), what is eta? What is the Reynolds number at scale eta?',
      expectedOutcome:
        'eta ~ (1e-18 / 1e-2)^(1/4) = (1e-16)^(1/4) = 1e-4 m = 0.1 mm. At this scale Re = u_eta * eta / nu = 1. Kolmogorov defines eta as the scale at which Re drops to unity.',
      hint: 'u_eta = (nu * epsilon)^(1/4) = (1e-6 * 1e-2)^(1/4) = (1e-8)^(1/4) = 1e-2 m/s.',
      conceptsExplored: ['physics-k41-cascade', 'physics-reynolds-similarity'],
    },
    {
      instruction:
        'Simulate (or read about) a decaying-turbulence DNS. Plot log(E(k)) vs log(k). The inertial subrange spans many decades of k. Fit a line: does the slope match -5/3?',
      expectedOutcome:
        'You see a ~5-decade window where E(k) obeys a power law with slope close to -5/3. Beyond the dissipation scale k_eta ~ 1/eta the spectrum drops exponentially.',
      hint: 'Laboratory experiments (Comte-Bellot 1971 grid turbulence) agree with -5/3 to within a few percent. The Kolmogorov constant C_K ~ 1.5 is universal.',
      conceptsExplored: ['physics-k41-cascade'],
    },
    {
      instruction:
        'Now address intermittency: the true slope observed is not exactly -5/3 but -5/3 - mu (with mu ~ 0.03 for the second-order structure function). Where does this correction come from?',
      expectedOutcome:
        'You articulate that dissipation is not uniform -- it concentrates on a fractal subset. The multifractal formalism (Frisch, Parisi) explains mu as the deviation from pure self-similarity. K41 is the leading order.',
      hint: 'Intermittency = rare extreme events dominate high-order moments. It is a small correction to the leading-order K41 picture.',
      conceptsExplored: ['physics-k41-cascade', 'math-fractal-geometry'],
    },
    {
      instruction:
        'Connect to clouds: cumulus turbulence has Re ~ 10^8 and an inertial range spanning ~8 decades. Why does the K41 cascade matter for cloud microphysics (droplet collisions, rainfall)?',
      expectedOutcome:
        'You explain that cloud droplets are advected by small-scale turbulence; their collision rate depends on the relative velocity spectrum at droplet-separation scales, which K41 predicts. Rain initiation depends on the cascade.',
      hint: 'Shaw 2003 Annual Review of Fluid Mechanics: turbulent collision-coalescence is the K41 mechanism at work inside cumulus towers.',
      conceptsExplored: ['physics-k41-cascade'],
    },
    {
      instruction:
        'Close by writing the -5/3 law as a log-log relation on a single line, and explain why K41 is a first-order fact about every turbulent flow you will encounter.',
      expectedOutcome:
        'You state log E = const + (2/3) log epsilon - (5/3) log k. You articulate that K41 is universal in the inertial subrange -- every high-Re flow from bathtubs to hurricanes to protogalactic jets obeys it.',
      hint: 'Universality was Kolmogorov\'s key move: the small scales forget everything about the forcing except epsilon.',
      conceptsExplored: ['physics-k41-cascade', 'math-logarithmic-scales'],
    },
  ],
};
