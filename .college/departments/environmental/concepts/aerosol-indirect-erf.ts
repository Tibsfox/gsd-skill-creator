/**
 * Aerosol Indirect ERF concept -- IPCC AR6 forcing from aerosol-cloud interactions.
 *
 * Climate science: the largest single uncertainty in AR6 forcing.
 * Twomey (1977) showed polluted clouds are brighter; Albrecht (1989)
 * showed they persist longer. IPCC AR6 WG1 assesses ERF_aci at
 * -1.0 [-1.7, -0.3] W/m² with medium confidence.
 *
 * @module departments/environmental/concepts/aerosol-indirect-erf
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~10*2pi/19, radius ~0.70
const theta = 10 * 2 * Math.PI / 19;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const aerosolIndirectErf: RosettaConcept = {
  id: 'environmental-aerosol-indirect-erf',
  name: 'Aerosol Indirect ERF',
  domain: 'environmental',
  description: 'Effective radiative forcing from aerosol-cloud interactions. ' +
    'The Twomey effect (first indirect, 1977): more CCN at fixed liquid-water ' +
    'content produces more droplets of smaller mean radius, raising shortwave ' +
    'reflectance -- polluted clouds are brighter. The Albrecht effect (second ' +
    'indirect, 1989): smaller droplets coalesce less efficiently, suppressing ' +
    'precipitation and lengthening cloud lifetime. IPCC AR6 WG1 Chapter 7 ' +
    '(2021) assesses ERF_aci = -1.0 W/m² with a very-likely range of -1.7 ' +
    'to -0.3 W/m², medium confidence. The factor-of-five width of this ' +
    'interval remains the largest single uncertainty in the AR6 effective-' +
    'radiative-forcing budget.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python climate-analysis stacks (xarray + cfgrib + ECMWF-API) load AR6 WG1 Chapter 7 ERF fields and CMIP6 aerosol runs into Dataset objects, then diagnose the Twomey albedo perturbation via numpy broadcasting over (cloud droplet number, liquid-water path) pairs. ' +
        'Notebook workflows (cartopy for maps, scipy.stats for CI bands) reproduce the -1.0 [-1.7, -0.3] W/m² budget directly from ensemble ERF diagnostics. ' +
        'See IPCC AR6 WG1 Chapter 7.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ regional climate models (RegCM, WRF-Chem C++ cores) integrate the Twomey-Albrecht radiative transfer via fused RAII-managed tile kernels that vectorise across (CCN, droplet radius) grids. ' +
        'constexpr lookup tables for Mie extinction feed a templated ShortwaveReflectance functor; SIMD reductions yield per-column ERF_aci that feed back into the radiation driver. ' +
        'See IPCC AR6 WG1 Chapter 7.',
    }],
    ['natural', {
      panelId: 'natural',
      explanation: 'Polluted clouds are brighter clouds. When anthropogenic sulfate and organic aerosols raise the cloud-condensation-nuclei count at fixed liquid-water content, the same water divides into more, smaller droplets -- more surface area per volume, more sunlight reflected back to space (Twomey 1977). ' +
        'Smaller droplets also coalesce less efficiently, so clouds rain less and persist longer (Albrecht 1989). ' +
        'See IPCC AR6 WG1 Chapter 7.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'chemistry-kohler-theory',
      description: 'ERF_aci is a macroscopic average over Köhler-activated droplet populations',
    },
    {
      type: 'dependency',
      targetId: 'math-ratios-proportions',
      description: 'ERF is expressed as a ratio (W per m²); the indirect effect scales with CCN concentration ratios',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
