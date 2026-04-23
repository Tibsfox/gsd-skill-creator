/**
 * Köhler Theory concept -- cloud droplet activation on CCN.
 *
 * Atmospheric chemistry: curvature + solute equilibrium.
 * Hilding Köhler (Uppsala, 1936) combined the Kelvin curvature term
 * with the Raoult solute term to produce the characteristic critical
 * supersaturation curve for droplet activation on cloud condensation nuclei.
 *
 * @module departments/chemistry/concepts/kohler-theory
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~7*2pi/19, radius ~0.65
const theta = 7 * 2 * Math.PI / 19;
const radius = 0.65;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const kohlerTheory: RosettaConcept = {
  id: 'chemistry-kohler-theory',
  name: 'Köhler Theory',
  domain: 'chemistry',
  description: 'Hilding Köhler\'s 1936 theory of cloud droplet activation. ' +
    'The equilibrium saturation ratio S = e/e_s on a droplet of radius r ' +
    'formed on a soluble cloud condensation nucleus combines a Kelvin ' +
    '(curvature) term that raises vapor pressure for small drops and a ' +
    'Raoult (solute) term that lowers it. Together they produce a single ' +
    'maximum -- the critical supersaturation S* at critical radius r*. ' +
    'Below r* the droplet is stable haze; above r* it is activated and ' +
    'grows without bound as a cloud droplet. Atmospheric CCN concentrations ' +
    'range 100-1000 per cm³, from clean maritime to polluted continental air.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python (numpy + scipy.optimize) evaluates S(r) = a/r - b/r^3 across a log-spaced radius grid, finds the maximum with brentq to locate S*, r*, and plots the characteristic Köhler curve with matplotlib. ' +
        'PyMieScatt or CLAMS parametrise kappa-Köhler for multi-component aerosol; xarray broadcasts activation diagnostics across 4D model output. ' +
        'See Köhler 1936.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ aerosol-microphysics solvers (HAM-M7, MAM7) compute the Kelvin term 2 sigma / (R_v rho_w T r) and the Raoult term inline in a fused kernel, then solve d r / d t from activated droplets via RAII-managed Runge-Kutta steppers. ' +
        'Templated scalar/SIMD paths serve both per-parcel and vectorised regimes. ' +
        'See Köhler 1936.',
    }],
    ['java', {
      panelId: 'java',
      explanation: 'Java atmospheric-chemistry frameworks (GEOS-Chem Java drivers, Bioclipse aerosol plug-ins) wrap Köhler calculations behind a KohlerActivation service with strongly-typed UnitOf<Radius>, UnitOf<Supersaturation>, and an immutable AerosolComposition value type covering the van\'t Hoff factor and molar mass. ' +
        'JMX metrics expose activated fraction per CCN population. ' +
        'See Köhler 1936.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'chemistry-clausius-clapeyron',
      description: 'Köhler theory sets the activation threshold on top of the Clausius-Clapeyron saturation vapor pressure baseline',
    },
    {
      type: 'dependency',
      targetId: 'chem-acids-bases',
      description: 'The Raoult solute term uses van\'t Hoff factors for ionic dissociation, the same chemistry that governs solution acidity',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
