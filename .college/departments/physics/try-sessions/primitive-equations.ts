/**
 * Primitive Equations try-session -- the NWP backbone on the rotating sphere.
 *
 * Walk a learner from Bjerknes's 1904 manifesto through the five prognostic
 * groups to the hydrostatic vs non-hydrostatic distinction.
 *
 * @module departments/physics/try-sessions/primitive-equations
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const primitiveEquationsSession: TrySessionDefinition = {
  id: 'physics-primitive-equations-first-steps',
  title: 'Primitive Equations: The Atmospheric Model Behind Every Forecast',
  description:
    'A guided first pass through the primitive-equation system -- from the Bjerknes ' +
    '1904 weather-prediction manifesto through the five coupled prognostic groups ' +
    'to the hydrostatic closure that defines global vs convection-permitting models.',
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Read the Bjerknes 1904 proposal: weather forecasting is an initial-value problem for a closed set of physical equations, given the current state of the atmosphere. What makes this the founding act of numerical weather prediction?',
      expectedOutcome:
        'You articulate that Bjerknes transformed forecasting from prognostication into deterministic physics: a closed system of PDEs plus initial data gives a unique future state, subject only to numerical integration accuracy.',
      hint: 'Bjerknes listed seven variables: pressure, temperature, density, humidity, and three velocity components. He counted seven equations to close the system.',
      conceptsExplored: ['physics-primitive-equations'],
    },
    {
      instruction:
        'List the five prognostic groups of the primitive-equation system: (1) three momentum equations with Coriolis, (2) mass continuity, (3) thermodynamic energy (first law), (4) equation of state (ideal gas), (5) moisture continuity. For each, identify the physics it encodes.',
      expectedOutcome:
        'You can name: momentum = Newton\'s second law plus rotation; continuity = mass conservation; thermodynamics = first law in meteorological form; state = ideal gas p = rho R T; moisture = water vapor conservation plus phase changes.',
      hint: 'Five groups because water has both transport (continuity) and phase change (source/sink). The system is coupled and nonlinear.',
      conceptsExplored: ['physics-primitive-equations'],
    },
    {
      instruction:
        'Write the horizontal momentum equation in vector form: D_v/D_t = -2*Omega x v - (1/rho)*grad(p) + g + F_friction. Identify each term: which is inertial, which is Coriolis, which is pressure gradient, which is gravity, which is friction?',
      expectedOutcome:
        'You match: D_v/D_t = material derivative (inertial); -2*Omega x v = Coriolis force from Earth rotation; -(1/rho)*grad(p) = pressure gradient; g = gravity; F_friction = subgrid mixing / turbulent stress.',
      hint: 'Coriolis parameter f = 2*Omega*sin(phi). At 45 degrees latitude, f ~ 1e-4 /s -- the timescale for inertial oscillations.',
      conceptsExplored: ['physics-primitive-equations', 'math-trig-functions'],
    },
    {
      instruction:
        'Introduce the hydrostatic approximation: at horizontal scales >> vertical scales (synoptic, >= 10 km), the vertical momentum equation reduces to d_p/d_z = -rho*g. Why is this valid for global models but not for convection-permitting models at 1-4 km resolution?',
      expectedOutcome:
        'You explain that hydrostatic balance is an asymptotic result valid when vertical accelerations are small compared to gravity. In deep convection (thunderstorms) updrafts reach 10-20 m/s and the approximation fails; non-hydrostatic models retain the full vertical equation.',
      hint: 'IFS runs at 9 km hydrostatic (as of 2026). WRF at 3 km is non-hydrostatic. The boundary is near 10 km horizontal resolution.',
      conceptsExplored: ['physics-primitive-equations', 'physics-vorticity-stretching'],
    },
    {
      instruction:
        'Look up the ECMWF Integrated Forecast System (IFS) spectral transform: horizontal fields are expanded in spherical harmonics Y_l^m, vertical coordinates use hybrid-sigma levels. Why does a spectral formulation suit the primitive equations on a sphere?',
      expectedOutcome:
        'You articulate that Y_l^m diagonalizes the horizontal Laplacian, so the wave-propagation spectral transform steps are fast and numerically dispersive-free on the sphere. Hybrid-sigma follows terrain near the surface and pressure aloft.',
      hint: 'The triangular truncation T1279 (~9 km) is standard for IFS HRES. Spherical harmonics are the Fourier basis on the sphere.',
      conceptsExplored: ['physics-primitive-equations', 'math-trig-functions'],
    },
    {
      instruction:
        'Read about the quiet revolution (Bauer, Thorpe, Brunet 2015): forecast skill has improved by roughly 1 day per decade for the last 40 years, largely because primitive-equation solvers got better (physics, resolution, data assimilation, AI). Contrast the PE-based IFS with the new AI emulators (GraphCast, Pangu, AIFS).',
      expectedOutcome:
        'You understand that AI weather models are trained to emulate the PE solution on ERA5 data; they are not replacements but accelerators. The primitive equations remain the ground truth against which AI forecasts are verified.',
      hint: 'GraphCast 2023: trained on ERA5, 0.25 deg, beats IFS on 90% of variables at lead times of 3-10 days with 1000x less compute.',
      conceptsExplored: ['physics-primitive-equations'],
    },
    {
      instruction:
        'Close with the complex-plane position: primitive equations sit at radius ~0.80, theta ~12*2pi/19. Why is the PE system placed in the abstract half-plane (theta > pi/2)? Contrast with Reynolds similarity (radius 0.55) and K41 cascade (0.75).',
      expectedOutcome:
        'You explain that the PE system is an abstract coupled-PDE model that governs every atmospheric simulation; it is more abstract than the concrete Re ratio but less abstract than the fully mathematical soliton-resolution conjecture. Its radius 0.80 reflects both its centrality and its sophistication.',
      hint: 'PE is theory + engineering backbone. Re is formula + engineering rule of thumb. Solitons are pure analysis. Hence the radii order.',
      conceptsExplored: ['physics-primitive-equations', 'physics-vorticity-stretching'],
    },
  ],
};
