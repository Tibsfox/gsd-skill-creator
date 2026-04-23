/**
 * Vorticity Stretching concept -- the 3D-only mechanism.
 *
 * Fluid dynamics: the asymmetry between 2D and 3D Navier-Stokes.
 * Vorticity ω = ∇ × u evolves by Dω/Dt = (ω·∇)u + ν∇²ω; the vortex-stretching
 * term (ω·∇)u is generically non-zero in 3D but vanishes identically in 2D.
 *
 * @module departments/physics/concepts/vorticity-stretching
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~4*2pi/19, radius ~0.70
const theta = 4 * 2 * Math.PI / 19;
const radius = 0.70;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const vorticityStretching: RosettaConcept = {
  id: 'physics-vorticity-stretching',
  name: 'Vorticity Stretching',
  domain: 'physics',
  description: 'Vorticity ω = ∇ × u is solenoidal (∇·ω = 0). The vorticity equation ' +
    'Dω/Dt = (ω·∇)u + ν∇²u contains a vortex-stretching term (ω·∇)u that is ' +
    'generically non-zero in 3D but vanishes identically in 2D because every ' +
    'vortex line is perpendicular to the flow plane. This asymmetry is the ' +
    'single most important fact in 21st-century fluid mathematics: 2D ' +
    'Navier-Stokes is globally regular (Ladyzhenskaya, 1960s); 3D ' +
    'Navier-Stokes regularity is the Clay Millennium open problem. The ' +
    'Beale-Kato-Majda criterion makes this explicit: control of ' +
    'L¹([0,T]; L∞) of |ω| is equivalent to classical regularity on [0,T].',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python evaluates omega = numpy.cross(grad, u) on a regular grid, then computes the vortex-stretching term (omega . grad) u via numpy.einsum over (i,j) indices. ' +
        'xarray dask chunks the 3D field so the stretching budget is computed out-of-core from ERA5. ' +
        'In 2D the stretching term vanishes identically; the diagnostic makes the asymmetry visible. ' +
        'See Leray 1934.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ CFD kernels fuse the curl and stretching operators into a single cache-resident stencil, reading u from an aligned std::vector and writing omega in place. ' +
        'Templates specialize on dimension so the 3D kernel keeps the (omega . grad) u term while a 2D instantiation compiles it away. ' +
        'OpenMP + MPI partition the k-plane for strong scaling on HPC clusters. ' +
        'See Ladyzhenskaya 1969.',
    }],
    ['fortran', {
      panelId: 'fortran',
      explanation: 'Fortran fluid codes (NEK5000, OpenFOAM legacy F77 kernels) encode the vorticity equation as nested DO loops computing D_omega/Dt with explicit index arithmetic. ' +
        'COMMON blocks hold omega(i,j,k,3) with column-major kstride; the stretching term (omega . grad) u is a separate SUBROUTINE. ' +
        'Legacy codes preserve the exact form Leray gave in 1934. ' +
        'See Leray 1934.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'physics-reynolds-similarity',
      description: 'Vortex stretching becomes dynamically dominant at high Reynolds number as viscous dissipation recedes',
    },
    {
      type: 'dependency',
      targetId: 'math-trig-functions',
      description: 'Vorticity is defined via the curl operator, expressed through the cross-product structure of trig functions on basis vectors',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
