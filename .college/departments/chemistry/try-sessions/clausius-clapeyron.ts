/**
 * Clausius-Clapeyron try-session -- saturation vapor pressure and the 7%/K rule.
 *
 * Walk a learner from a pressure-cooker observation to the de_s/dT equation,
 * then to the atmospheric water-holding-capacity rule and the ice/water gap
 * that powers the Wegener-Bergeron-Findeisen process.
 *
 * @module departments/chemistry/try-sessions/clausius-clapeyron
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const clausiusClapeyronSession: TrySessionDefinition = {
  id: 'chemistry-clausius-clapeyron-first-steps',
  title: 'Clausius-Clapeyron: Why a Warmer Atmosphere Holds More Water',
  description:
    'A guided first pass through the saturation-vapor-pressure relation -- ' +
    'from a kitchen pressure cooker, through the de_s/dT equation, to the ' +
    '7%/K water-holding rule and the ice/water gap that drives cloud ' +
    'microphysics.',
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Boil a pot of water with the lid off, then a pressure cooker with the lid on. In your own words, why does the pressure cooker reach a higher temperature without the water evaporating away? Read about phase equilibrium: what is the saturation vapor pressure e_s(T)?',
      expectedOutcome:
        'You articulate that e_s(T) is the equilibrium vapor pressure above a flat water surface at temperature T. The pressure cooker raises the total pressure above atmospheric; boiling only happens when e_s(T) matches the external pressure, so T_boil climbs.',
      hint: 'At 1 atm, water boils at 100 °C because e_s(373 K) ~ 1 atm. Raise the pressure, raise the boiling point.',
      conceptsExplored: ['chemistry-clausius-clapeyron', 'chem-reaction-types'],
    },
    {
      instruction:
        'Write the Clausius-Clapeyron differential form: de_s/dT = L_v * e_s / (R_v * T^2). Separate variables and integrate from a reference state (T_0 = 273.15 K, e_0 = 611.2 Pa) to a general T, assuming L_v ~ 2.5e6 J/kg is roughly constant. What functional form do you get?',
      expectedOutcome:
        'You derive e_s(T) = e_0 * exp((L_v / R_v) * (1/T_0 - 1/T)). This is an exponential -- the celebrated exponential scaling of atmospheric moisture with temperature.',
      hint: 'Divide both sides by e_s, integrate: d(ln e_s) = (L_v / R_v) * dT / T^2 = -(L_v / R_v) * d(1/T).',
      conceptsExplored: ['chemistry-clausius-clapeyron', 'math-exponential-decay'],
    },
    {
      instruction:
        'Plug in T = 283 K, then T = 293 K, and compute e_s at both. What is the fractional increase per degree? Compare to the widely-cited "7%/K water-holding-capacity" rule.',
      expectedOutcome:
        'You obtain roughly e_s(293) / e_s(283) ~ 1.9, i.e. ~7%/K averaged over the 10 K interval. The rule is the linearised form of the exponential over typical atmospheric temperatures (270-310 K).',
      hint: 'd ln e_s / dT = L_v / (R_v T^2). At T = 288 K, that is about 0.07 per K.',
      conceptsExplored: ['chemistry-clausius-clapeyron', 'math-exponential-decay'],
    },
    {
      instruction:
        'Extreme-precipitation literature invokes Clausius-Clapeyron scaling: a warmer atmosphere can hold more water vapor, so saturated updrafts release more rain. Read about CC-scaling: is observed rainfall intensity actually tracking 7%/K, or something else?',
      expectedOutcome:
        'You learn that short-duration extreme rainfall often shows super-CC scaling (2x to 3x CC) because convective dynamics amplify the thermodynamic signal. CC is the thermodynamic floor; convective feedbacks can push past it.',
      hint: 'Westra et al. 2014 Reviews of Geophysics: hourly-scale extremes in some regions scale at 10-14%/K, beyond pure CC.',
      conceptsExplored: ['chemistry-clausius-clapeyron'],
    },
    {
      instruction:
        'Now consider a subzero temperature, e.g. T = 261 K (-12 °C). Compute e_s over supercooled water and e_s,ice over ice. They are DIFFERENT because L_s (sublimation) > L_v (vaporisation). Where is the gap largest?',
      expectedOutcome:
        'You find e_s,water(261) > e_s,ice(261). The gap is near 10% at -12 °C -- the maximum-gap temperature. This sets the thermodynamic engine for the Wegener-Bergeron-Findeisen process: vapor diffuses from supercooled droplets (higher e_s) to ice crystals (lower e_s).',
      hint: 'At 0 °C the gap is zero; at very cold T (below -40 °C) both e_s are tiny; the maximum relative gap sits around -12 °C.',
      conceptsExplored: ['chemistry-clausius-clapeyron', 'chemistry-kohler-theory'],
    },
    {
      instruction:
        'Connect to clouds: the WBF process (mixed-phase cloud glaciation) is what makes most mid-latitude rain. Sketch the energy path: vapor -> supercooled droplet -> ice crystal -> precipitation. Why does Clausius-Clapeyron make this sequence favorable?',
      expectedOutcome:
        'You explain that because e_s,water > e_s,ice in the mixed-phase regime, a parcel that is saturated wrt water is supersaturated wrt ice -- so ice crystals grow while droplets evaporate. The whole WBF mechanism rides on the CC-derived vapor-pressure gap.',
      hint: 'Lohmann 2016 Chapter 4: the ice-water gap IS the thermodynamic driver of mid-latitude precipitation.',
      conceptsExplored: ['chemistry-clausius-clapeyron'],
    },
    {
      instruction:
        'Close by placing Clausius-Clapeyron on the complex plane of experience: it is a concrete, applied thermodynamic law (positive real axis, medium complexity). State one line that captures why Clausius-Clapeyron is the single most-cited climate relation.',
      expectedOutcome:
        'You state something like: "de_s/dT = L_v e_s / (R_v T^2) forces atmospheric water vapor to rise ~7%/K with warming -- the exponential feedback that frames every modern extreme-precipitation argument."',
      hint: 'Clausius 1850 and Clapeyron 1834 pre-date IPCC by a century and a half; the equation survives every refinement.',
      conceptsExplored: ['chemistry-clausius-clapeyron', 'math-exponential-decay'],
    },
  ],
};
