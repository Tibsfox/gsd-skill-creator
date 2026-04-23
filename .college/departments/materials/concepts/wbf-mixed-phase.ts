/**
 * WBF Mixed-Phase concept -- Wegener-Bergeron-Findeisen process.
 *
 * Phase-transition materials: ice vs liquid in mixed-phase clouds.
 * In the 0 to -38 °C band where supercooled liquid and ice coexist,
 * the vapor-pressure gap e_s^w > e_s^i drives one-way mass transfer
 * from liquid droplets to ice crystals.
 *
 * @module departments/materials/concepts/wbf-mixed-phase
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~8*2pi/19, radius ~0.55
const theta = 8 * 2 * Math.PI / 19;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const wbfMixedPhase: RosettaConcept = {
  id: 'materials-wbf-mixed-phase',
  name: 'WBF Mixed-Phase Process',
  domain: 'materials',
  description: 'The Wegener-Bergeron-Findeisen process, proposed by Alfred Wegener ' +
    '(1911), developed by Tor Bergeron (1933), and put on experimental footing ' +
    'by Walter Findeisen. In mixed-phase clouds in the 0 to -38 °C band where ' +
    'supercooled liquid water and ice crystals coexist, the saturation vapor ' +
    'pressure over ice is lower than over liquid water; ice crystals therefore ' +
    'grow by deposition while liquid droplets evaporate. The vapor-pressure ' +
    'differential peaks near -12 °C, the most efficient ice-growth band in ' +
    'the mid-latitudes. Together with collision-coalescence, WBF is the ' +
    'dominant precipitation pathway in mid- and high-latitude clouds.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python cloud-physics stacks (PyMPDATA, WRF-python, atmospheric-chemistry notebooks) evaluate the e_s^w vs e_s^i gap on an xarray temperature grid, then use numpy broadcasting to diagnose WBF-active voxels (supersaturated wrt ice, subsaturated wrt water). ' +
        'metpy.calc.saturation_mixing_ratio and scipy.integrate.solve_ivp carry ice-crystal mass-growth rates through a parcel history. ' +
        'See Wegener 1911.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ mixed-phase microphysics kernels (Morrison-Milbrandt, Predicted Particle Properties P3) integrate ice-crystal deposition and droplet evaporation via fused RAII-managed steppers. ' +
        'constexpr e_s^w(T) and e_s^i(T) tables feed a templated deposition-rate functor that vectorises across grid cells; the vapor-pressure gap peak near -12 °C drops out of the SIMD reduction. ' +
        'See Wegener 1911.',
    }],
    ['java', {
      panelId: 'java',
      explanation: 'Java enterprise climate frameworks (CMAQ Java drivers, GEOS-Chem wrappers, Bioclipse aerosol plug-ins) expose a WbfProcess service with strongly-typed UnitOf<VaporPressure>, UnitOf<Temperature>, and an immutable MixedPhaseState value class holding liquid mass, ice mass, and saturation ratios. ' +
        'JMX metrics emit ice-growth rate and glaciation timescale per parcel. ' +
        'See Wegener 1911.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'chemistry-clausius-clapeyron',
      description: 'The ice-water vapor-pressure gap that drives WBF is a direct Clausius-Clapeyron consequence at subzero temperatures',
    },
    {
      type: 'dependency',
      targetId: 'chem-acids-bases',
      description: 'WBF involves solute chemistry on supercooled droplets; ionic composition modifies freezing onset',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
