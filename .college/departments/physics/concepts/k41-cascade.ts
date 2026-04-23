/**
 * K41 Cascade concept -- Kolmogorov 1941 turbulence theory.
 *
 * Fluid dynamics: energy cascade and the -5/3 spectrum.
 * Kolmogorov's 1941 dimensional-analysis argument fixes the energy spectrum
 * E(k) = C_K ε^(2/3) k^(-5/3) in the inertial subrange, with dissipation
 * scale η = (ν³/ε)^(1/4).
 *
 * @module departments/physics/concepts/k41-cascade
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~5*2pi/19, radius ~0.75
const theta = 5 * 2 * Math.PI / 19;
const radius = 0.75;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const k41Cascade: RosettaConcept = {
  id: 'physics-k41-cascade',
  name: 'K41 Energy Cascade',
  domain: 'physics',
  description: 'Kolmogorov 1941: at high Reynolds number, small-scale turbulence ' +
    'statistics are universal, depending only on kinematic viscosity ν and ' +
    'mean dissipation rate ε. Dimensional analysis fixes the Kolmogorov ' +
    'length η = (ν³/ε)^(1/4), time scale τ_η = (ν/ε)^(1/2), and velocity ' +
    'u_η = (νε)^(1/4) -- η is the scale at which Re = 1. In the inertial ' +
    'subrange the energy spectrum obeys the celebrated -5/3 law ' +
    'E(k) = C_K ε^(2/3) k^(-5/3) with C_K ≈ 1.5. K41 dresses Richardson\'s ' +
    '1922 cascade in dimensional clothing -- a first-order fact about every ' +
    'cloud, jet, and plume.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python (numpy + scipy.signal.welch) computes the power spectral density of a velocity time series, then log-log plots E(k) against k to reveal the -5/3 slope. ' +
        'xarray broadcasts the dissipation rate epsilon across a 4D ERA5 grid; matplotlib dashes the k^(-5/3) reference line at C_K ~ 1.5. ' +
        'Intermittency corrections modify the pure K41 slope in the far tail. ' +
        'See Kolmogorov 1941.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ turbulence solvers call FFTW (RAII-wrapped plans) to transform the velocity field, bin |u_hat(k)|^2 into shell averages, and fit the -5/3 slope via a templated least-squares kernel. ' +
        'Cache-blocked FFT passes keep the N log N kernel memory-bound instead of compute-bound. ' +
        'MPI + OpenMP scale the cascade diagnostic across HPC clusters. ' +
        'See Kolmogorov 1941.',
    }],
    ['fortran', {
      panelId: 'fortran',
      explanation: 'Fortran direct-numerical-simulation codes (Pencil, SpectralDNS) declare COMPLEX(KIND=8) :: uhat(nx,ny,nz,3) and run column-major DO loops for shell binning. ' +
        'The -5/3 scaling is verified by log-log regression over the inertial subrange, with eta = (nu**3/epsilon)**(1./4.) bounding the dissipation range. ' +
        'IFS spectral transforms inherit this 1941 dimensional template. ' +
        'See Kolmogorov 1941.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'math-fractal-geometry',
      description: 'The K41 cascade has a fractal / multifractal character, with intermittency corrections probing self-similarity at small scales',
    },
    {
      type: 'dependency',
      targetId: 'math-logarithmic-scales',
      description: 'The -5/3 spectrum is expressed and verified on log-log axes; logarithmic scaling is inherent to the cascade',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
