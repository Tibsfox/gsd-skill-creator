/**
 * Ice Nucleation Modes concept -- homogeneous + 4 heterogeneous modes.
 *
 * Materials / surface chemistry: ice nucleating particles (INPs).
 * Deposition, condensation freezing, immersion freezing, and contact
 * freezing are the four heterogeneous nucleation modes; pure water
 * freezes homogeneously only below -38 °C.
 *
 * @module departments/materials/concepts/ice-nucleation-modes
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~9*2pi/19, radius ~0.50 (most concrete)
const theta = 9 * 2 * Math.PI / 19;
const radius = 0.50;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const iceNucleationModes: RosettaConcept = {
  id: 'materials-ice-nucleation-modes',
  name: 'Ice Nucleation Modes',
  domain: 'materials',
  description: 'Homogeneous nucleation is spontaneous freezing of pure water; in the ' +
    'atmosphere it requires supercooling to roughly -38 °C. Heterogeneous ' +
    'nucleation via an ice nucleating particle (INP) has four modes: ' +
    'deposition (vapor directly onto a solid INP), condensation freezing ' +
    '(vapor condenses onto a hygroscopic INP then freezes), immersion freezing ' +
    '(INP already embedded in a supercooled droplet triggers crystallisation), ' +
    'and contact freezing (INP collides with a droplet). Common INPs include ' +
    'mineral dust (especially K-feldspar), soot, volcanic ash, and biological ' +
    'particles -- pollen, fungal spores, and Pseudomonas syringae, whose INA ' +
    'proteins can trigger freezing as warm as -2 °C. INPs are typically 10⁴× ' +
    'rarer than CCN, the asymmetry that lets WBF work.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python ice-nucleation stacks (PyICE, atmospheric-chemistry notebooks) parametrise INP spectra via the DeMott 2010 or Niemand 2012 empirical fits, then apply numpy broadcasting to diagnose active modes (deposition vs immersion vs contact) across xarray temperature + RH fields. ' +
        'scipy.stats lognorm captures dust and biological INP size distributions; pandas joins INA-protein data from field campaigns. ' +
        'See Pruppacher & Klett 2010.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ LAMMPS-style molecular-dynamics kernels simulate lattice matching between a candidate INP surface (K-feldspar, kaolinite) and the ice Ih basal plane; heavy SIMD inner loops compute pair potentials across 10^5 atom systems. ' +
        'Production cloud models (P3, Morrison) instead use a templated IceNucleation functor that switches mode (deposition / condensation / immersion / contact) via constexpr dispatch. ' +
        'See Pruppacher & Klett 2010.',
    }],
    ['java', {
      panelId: 'java',
      explanation: 'Java atmospheric-chemistry wrappers (CMAQ Java drivers, GEOS-Chem, Bioclipse) expose an IceNucleatingParticle value class with strongly-typed UnitOf<Temperature>, UnitOf<RelativeHumidity>, and an INPMode enum covering the four heterogeneous modes plus homogeneous freezing. ' +
        'A NucleationService dispatches mode-specific rate functions; JMX metrics emit ice-crystal production rate per parcel. ' +
        'See Pruppacher & Klett 2010.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'materials-wbf-mixed-phase',
      description: 'INP scarcity relative to CCN is the asymmetry that makes the WBF process efficient',
    },
    {
      type: 'dependency',
      targetId: 'chem-reaction-types',
      description: 'Heterogeneous nucleation is a surface-chemistry phenomenon -- lattice matching between INP and ice structure',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
