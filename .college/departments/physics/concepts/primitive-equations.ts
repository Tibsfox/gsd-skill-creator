/**
 * Primitive Equations concept -- NWP backbone on the rotating sphere.
 *
 * Atmospheric physics: 5-group prognostic system.
 * Three momentum equations (Newton + Coriolis), mass continuity,
 * thermodynamic energy, equation of state, and moisture continuity
 * constitute the primitive-equation system that has been the NWP
 * backbone since Bjerknes's 1904 manifesto.
 *
 * @module departments/physics/concepts/primitive-equations
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~12*2pi/19, radius ~0.80
const theta = 12 * 2 * Math.PI / 19;
const radius = 0.80;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const primitiveEquations: RosettaConcept = {
  id: 'physics-primitive-equations',
  name: 'Primitive Equations',
  domain: 'physics',
  description: 'The coupled nonlinear PDE system on a rotating sphere that has been ' +
    'the backbone of NWP since Vilhelm Bjerknes\'s 1904 manifesto. Five ' +
    'prognostic groups: three momentum equations with Coriolis ' +
    '(Dv/Dt = -2Ω×v - (1/ρ)∇p + g + F_fric), mass continuity, ' +
    'thermodynamic energy (first law), equation of state (ideal gas), and ' +
    'moisture continuity for water vapor plus one or more condensate species. ' +
    'At resolutions coarser than about 10 km the hydrostatic approximation ' +
    '∂p/∂z = -ρg is invoked; convection-permitting 1-4 km models retain the ' +
    'full vertical momentum equation (non-hydrostatic).',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python (xarray + dask) ingests ECMWF primitive-equation output on hybrid-sigma levels and evaluates each prognostic budget (momentum, continuity, thermo, moisture) with chunked tensor ops. ' +
        'NetCDF dimensions match the PE structure so Coriolis 2*omega*sin(phi) broadcasts cleanly across (time, level, lat, lon). ' +
        'Notebooks verify the Bjerknes closed system by residual diagnostics. ' +
        'See Bjerknes 1904.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ NWP cores (GEOS, MPAS) template the primitive-equation kernel on horizontal-grid topology (latlon or icosahedral) and run explicit time stepping with RAII-owned boundary halos. ' +
        'SIMD-friendly SoA layouts keep the pressure gradient and Coriolis terms vectorizable on modern CPUs. ' +
        'The hydrostatic switch is a compile-time template parameter, not a runtime branch. ' +
        'See Bjerknes 1904.',
    }],
    ['fortran', {
      panelId: 'fortran',
      explanation: 'Fortran is the native tongue of the primitive equations: IFS, WRF, NEMO, and ICON all declare REAL(KIND=8) :: u(nlon,nlat,nlev), v(...), t(...) in COMMON blocks and run spherical-harmonic transforms via LAPACK. ' +
        'Coriolis terms live in SUBROUTINE cor_coupling; the hydrostatic closure uses explicit k-column loops. ' +
        'Bjerknes 1904 PE still runs in 2026 production. ' +
        'See Bjerknes 1904.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'physics-vorticity-stretching',
      description: 'The primitive equations inherit the vorticity-stretching mechanism from the underlying Navier-Stokes substrate',
    },
    {
      type: 'dependency',
      targetId: 'math-trig-functions',
      description: 'Coriolis rotation and spherical-harmonic basis both use trig functions over the rotating sphere',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
