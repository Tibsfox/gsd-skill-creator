/**
 * WBF Mixed-Phase try-session -- the Wegener-Bergeron-Findeisen process.
 *
 * Walk a learner from a freezer-condensation observation, through the
 * vapor-pressure gap between supercooled water and ice, to the -12 °C
 * peak efficiency band that makes WBF the dominant mid-latitude
 * precipitation pathway.
 *
 * @module departments/materials/try-sessions/wbf-mixed-phase
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const wbfMixedPhaseSession: TrySessionDefinition = {
  id: 'materials-wbf-mixed-phase-first-steps',
  title: 'WBF: How Ice Crystals Eat Their Supercooled Neighbors',
  description:
    'A guided first pass through the Wegener-Bergeron-Findeisen process -- ' +
    'from a kitchen freezer observation, through the e_s^w vs e_s^i gap, ' +
    'to the -12 °C peak band that drives most mid-latitude precipitation.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Open a freezer and look for frost on packaged food. The surrounding air is below 0 °C, yet ice keeps building up. In your own words, why does frost form on the cold surface even when the air is nominally "dry"? Read about saturation vapor pressure over ice vs water: what is e_s^w(T) vs e_s^i(T)?',
      expectedOutcome:
        'You articulate that saturation vapor pressure over ice is lower than over liquid water at the same subzero temperature. Any vapor pressure in the freezer above e_s^i(T) is supersaturated wrt ice and deposits as frost -- even when it is subsaturated wrt liquid water.',
      hint: 'At -12 °C, e_s^w ~ 2.44 hPa but e_s^i ~ 2.17 hPa. The ~10% gap is the entire engine.',
      conceptsExplored: ['materials-wbf-mixed-phase', 'chemistry-clausius-clapeyron'],
    },
    {
      instruction:
        'Write down the vapor-pressure inequality that defines the WBF regime: in the 0 to -38 °C mixed-phase band, e_s^w(T) > e_s^i(T). Why does the gap arise? Relate it to the difference L_s > L_v in the Clausius-Clapeyron derivation.',
      expectedOutcome:
        'You identify that L_s (sublimation, ~2.83e6 J/kg) > L_v (vaporisation, ~2.5e6 J/kg). Integrating d(ln e_s) / dT = L / (R_v T^2) with the larger L_s produces a steeper curve, so e_s^i rises slower than e_s^w. The two curves meet at T = 0 °C and diverge below.',
      hint: 'The latent-heat difference L_s - L_v ~ 3.3e5 J/kg is the latent heat of fusion -- the thermodynamic origin of the gap.',
      conceptsExplored: ['materials-wbf-mixed-phase', 'chemistry-clausius-clapeyron'],
    },
    {
      instruction:
        'Plot (e_s^w - e_s^i) / e_s^w across T = 0 to -38 °C. Where is the relative gap largest? This is the "peak WBF band" -- the temperature where ice crystals grow fastest at the expense of supercooled droplets.',
      expectedOutcome:
        'You find the relative gap peaks near T = -12 °C at about 10-12%, then falls toward both endpoints. At 0 °C the gap vanishes; at -38 °C all droplets freeze homogeneously anyway. The -12 °C peak is why dendritic plate crystals dominate that temperature band in real clouds.',
      hint: 'Hallett-Mossop ice multiplication is strongest in the -3 to -8 °C band; pure deposition (WBF) peaks colder at -12 to -18 °C.',
      conceptsExplored: ['materials-wbf-mixed-phase'],
    },
    {
      instruction:
        'Set up a mixed-phase parcel: 100 droplets/cm^3 of 10 um liquid water + 1 ice crystal/L at T = -15 °C. What happens over 15 minutes? Walk through the mass-transfer physics: vapor diffuses FROM the droplets TO the ice crystal.',
      expectedOutcome:
        'You describe that the parcel is at e = e_s^w (saturated wrt water) but supersaturated wrt ice by ~10%. Vapor diffuses onto the ice crystal; e drops slightly; droplets evaporate to re-supply vapor. In ~10-15 minutes the ice crystal has grown by orders of magnitude while droplets have shrunk. This is the glaciation timescale.',
      hint: 'The asymmetry is key: ~100 droplets per ice crystal. One crystal can consume 100+ droplets worth of water. INP scarcity relative to CCN makes the ratio work.',
      conceptsExplored: ['materials-wbf-mixed-phase', 'materials-ice-nucleation-modes'],
    },
    {
      instruction:
        'Connect to real clouds: mid-latitude stratiform clouds typically glaciate via WBF, producing snow that melts to rain below the freezing level. Trace the precipitation path: water vapor -> supercooled droplet -> ice crystal -> snowflake -> raindrop. Why is WBF the dominant mid-latitude precipitation mechanism?',
      expectedOutcome:
        'You articulate that collision-coalescence needs droplets > 20 um to be efficient, and mid-latitude stratiform clouds do not grow droplets that large. WBF circumvents the coalescence bottleneck: ice crystals grow fast by deposition, fall, collect supercooled droplets (riming), and become graupel or snowflakes that melt on descent. Rogers & Yau 1989 is the textbook.',
      hint: 'Tropical warm rain uses collision-coalescence; mid-latitude cold rain uses WBF. The 0 °C isotherm height separates the two regimes.',
      conceptsExplored: ['materials-wbf-mixed-phase'],
    },
    {
      instruction:
        'Read or skim Wegener 1911 (Thermodynamik der Atmosphäre) and Bergeron 1933 (5th IUGG Assembly). Wegener proposed the vapor-pressure asymmetry; Bergeron connected it to the precipitation mechanism; Findeisen added the experimental base in the late 1930s. What is the core insight that makes their 1910s-1930s reasoning still textbook correct?',
      expectedOutcome:
        'You articulate that the trio identified the thermodynamic signature (e_s^w > e_s^i) of mixed-phase clouds before instruments could resolve ice vs liquid in a cloud directly. The physics is a two-species Clausius-Clapeyron consequence -- the mechanism is robust and has survived every modern microphysics scheme.',
      hint: 'Findeisen in Prague worked on the experimental verification before his wartime disappearance in 1945. The WBF label honors all three.',
      conceptsExplored: ['materials-wbf-mixed-phase'],
    },
    {
      instruction:
        'Close by placing WBF on the complex plane of experience: it is an applied phase-transition process at the boundary of thermodynamics and materials chemistry (medium concreteness, medium complexity). State one line that captures why WBF is the single most-important cold-cloud precipitation process on Earth.',
      expectedOutcome:
        'You state something like: "WBF: e_s^w(T) > e_s^i(T) in the mixed-phase band drives one-way vapor transfer from 100 supercooled droplets to every ice crystal -- glaciating mid-latitude clouds in ~10 minutes and feeding most of the rain that falls north of 30°."',
      hint: 'Every snowstorm you have been caught in traces its mass back through the WBF pathway.',
      conceptsExplored: ['materials-wbf-mixed-phase', 'materials-ice-nucleation-modes'],
    },
  ],
};
