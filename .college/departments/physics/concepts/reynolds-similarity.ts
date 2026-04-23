/**
 * Reynolds Similarity concept -- Re = ρuL/μ dimensionless ratio.
 *
 * Fluid dynamics: laminar-turbulent transition.
 * The Reynolds number compresses the ratio of inertial to viscous forces
 * into a single dimensionless scalar that controls the character of flow.
 *
 * @module departments/physics/concepts/reynolds-similarity
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~3*2pi/19, radius ~0.55 (concrete engineering)
const theta = 3 * 2 * Math.PI / 19;
const radius = 0.55;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const reynoldsSimilarity: RosettaConcept = {
  id: 'physics-reynolds-similarity',
  name: 'Reynolds Similarity',
  domain: 'physics',
  description: 'Re = ρuL/μ = uL/ν -- the dimensionless ratio of inertial to viscous ' +
    'forces. Osborne Reynolds introduced the parameter in 1883 pipe-flow ' +
    'experiments; Sommerfeld named it in 1908. In pipe flow the classical ' +
    'transition thresholds are Re < 2,300 laminar, 2,300-2,900 transitional, ' +
    '> 2,900 fully turbulent. Every engineering scale-up -- wind tunnels, ' +
    'HVAC ducts, water columns above tide flats -- lives or dies by Reynolds ' +
    'similarity. In nonlinear-dynamics terms, Re is the natural bifurcation ' +
    'parameter into chaos.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python computes Re = rho*u*L/mu with numpy scalars or xarray broadcasts; ERA5 fields fan out Re(x, y, z, t) across the grid in one vectorized call. ' +
        'Transition is decided by boolean masks (Re < 2300 laminar; Re > 2900 turbulent); matplotlib draws the classical log-log threshold line. ' +
        'Dimensionless similarity collapses families of flows onto a single curve. ' +
        'See Reynolds 1883.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ CFD solvers bake Re into a const double passed to a hot inner loop; MPI decomposes the domain so each rank evaluates Re(x_i) on its subgrid without branch divergence. ' +
        'Cache-aware ordering keeps rho, u, L, mu in an SoA layout so SIMD lanes fill cleanly. ' +
        'Compile-time templating specializes kernels on Re regime to avoid runtime branching. ' +
        'See Reynolds 1883.',
    }],
    ['fortran', {
      panelId: 'fortran',
      explanation: 'Fortran legacy CFD codes (NASA overflow, NEMO ocean) declare REAL(KIND=8) :: Re and run column-major DO loops over k,j,i to compute dimensionless similarity. ' +
        'BLAS/LAPACK routines then reduce Re fields to spectral coefficients. ' +
        'The 1883-rooted formula Re = rho*u*L/mu is unchanged in 40+ years of IFS production code. ' +
        'See Reynolds 1883.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-ratios-proportions',
      description: 'Reynolds number is a canonical dimensionless similarity ratio, the engineering workhorse of the ratios concept',
    },
    {
      type: 'dependency',
      targetId: 'phys-motion-kinematics',
      description: 'Reynolds similarity presumes a kinematic description of flow with characteristic speed and length scales',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
