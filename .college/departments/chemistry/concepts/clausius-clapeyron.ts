/**
 * Clausius-Clapeyron concept -- saturation vapor pressure scaling.
 *
 * Thermodynamics: phase transitions.
 * de_s/dT = L_v e_s / (R_v T²) -- saturation vapor pressure rises
 * exponentially with temperature, giving the canonical ~7%/K
 * water-holding-capacity rule for the atmosphere.
 *
 * @module departments/chemistry/concepts/clausius-clapeyron
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~6*2pi/19, radius ~0.60 (applied thermodynamic law)
const theta = 6 * 2 * Math.PI / 19;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const clausiusClapeyron: RosettaConcept = {
  id: 'chemistry-clausius-clapeyron',
  name: 'Clausius-Clapeyron Relation',
  domain: 'chemistry',
  description: 'de_s/dT = L_v e_s / (R_v T²) -- saturation vapor pressure over ' +
    'a flat water surface rises exponentially with temperature, where ' +
    'L_v ≈ 2.5×10⁶ J/kg is the latent heat of vaporisation and R_v = ' +
    '461.5 J/(kg·K). Integrated, atmospheric water-holding capacity rises ' +
    'about 7% per degree Celsius of warming -- the single most cited ' +
    'consequence of the relation, underpinning modern extreme-precipitation ' +
    'reasoning. A critical subtlety for cloud microphysics: e_s over ice is ' +
    'lower than over water at the same subzero temperature, with the maximum ' +
    'gap near -12 °C -- the thermodynamic engine of the WBF process.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python (numpy + scipy.constants) evaluates e_s(T) = 611.2 Pa * exp((L_v / R_v) * (1/273.15 - 1/T)) over a temperature grid, then pandas/xarray broadcasts the 7%/K scaling across ERA5 humidity fields. ' +
        'Thermo libraries (cantera, CoolProp, metpy.calc.saturation_vapor_pressure) wrap the Magnus and Bolton parametrisations for production use. ' +
        'See Clausius 1850.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ atmospheric solvers inline a constexpr e_s(T) via the Tetens or Bolton approximation, call it inside tight microphysics kernels, and couple it to condensation rates through a fused multiply-add loop. ' +
        'Templated scalar/vector overloads serve both per-cell and SIMD paths; CFD frameworks (OpenFOAM thermophysical) expose it via a polymorphic IEquationOfState interface. ' +
        'See Clausius 1850.',
    }],
    ['java', {
      panelId: 'java',
      explanation: 'Java cheminformatics (ChemAxon, OpenBabel Java bindings) and enterprise climate wrappers (CMAQ, GEOS-Chem Java drivers) represent saturation vapor pressure via a strongly-typed UnitOf<Pressure> over UnitOf<Temperature>, enforcing kelvin-vs-celsius safety at compile time. ' +
        'A SaturationVaporPressureCalculator service caches L_v / R_v and emits JMX metrics on the 7%/K rise. ' +
        'See Clausius 1850.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-exponential-decay',
      description: 'Saturation vapor pressure grows exponentially with temperature -- the inverse of the exponential-decay profile',
    },
    {
      type: 'dependency',
      targetId: 'chem-reaction-types',
      description: 'Phase transitions between water and vapor are the chemistry substrate the relation describes',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
