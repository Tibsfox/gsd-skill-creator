/**
 * Reynolds Similarity try-session -- hands-on with the dimensionless ratio
 * that governs laminar-turbulent transition.
 *
 * Walk a learner from everyday observation (water pouring at different rates)
 * through the dimensional analysis to the bifurcation-parameter framing.
 *
 * @module departments/physics/try-sessions/reynolds-similarity
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const reynoldsSimilaritySession: TrySessionDefinition = {
  id: 'physics-reynolds-similarity-first-steps',
  title: 'Reynolds Similarity: The Number That Decides Laminar or Turbulent',
  description:
    'A guided first pass through the Reynolds number as a dimensionless ratio that ' +
    'compresses inertial-versus-viscous competition into one scalar, complete with ' +
    'a kitchen-sink experiment and the log-log transition thresholds.',
  estimatedMinutes: 20,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Turn on a kitchen faucet and adjust the flow from a slow trickle to a rushing stream. Watch the transition: at what flow rate does the smooth glassy column break into a chaotic, air-entraining torrent? Estimate rough u (speed) and L (stream diameter) for the trickle and the torrent.',
      expectedOutcome:
        'You see a clean qualitative transition and have rough numbers for speed and diameter in both regimes. You recognize the jump is not gradual -- there is a threshold.',
      hint: 'Speed is m/s, diameter is m. For a trickle think 0.1 m/s, diameter 3 mm; for a torrent think 1 m/s, diameter 1 cm.',
      conceptsExplored: ['physics-reynolds-similarity', 'phys-motion-kinematics'],
    },
    {
      instruction:
        'Compute Re = rho*u*L/mu for water (rho = 1000 kg/m^3, mu = 0.001 Pa*s) for both regimes. For the trickle: rho=1000, u=0.1, L=0.003, mu=0.001. For the torrent: rho=1000, u=1, L=0.01, mu=0.001. Which side of Re = 2300 does each land on?',
      expectedOutcome:
        'Trickle Re ~ 300 (laminar). Torrent Re ~ 10,000 (fully turbulent). The threshold you saw with your eyes matches the classical Reynolds threshold within an order of magnitude.',
      hint: 'Plug in: Re_trickle = 1000 * 0.1 * 0.003 / 0.001 = 300. Re_torrent = 1000 * 1 * 0.01 / 0.001 = 10,000.',
      conceptsExplored: ['physics-reynolds-similarity', 'math-ratios-proportions'],
    },
    {
      instruction:
        'Read the short history: Osborne Reynolds ran his 1883 pipe-flow experiments at Manchester, Sommerfeld named the number in 1908, and every wind-tunnel scale-up ever since relies on matching Re. Why does matching Re between a model and its full-scale target guarantee similar flow behavior?',
      expectedOutcome:
        'You can articulate dimensional similarity: if two flows share the same Re, their dimensionless Navier-Stokes solutions are the same. The model is a tiny photograph of the full-scale flow once you divide out units.',
      hint: 'Similarity is about collapsing curves. One dimensionless parameter = one regime.',
      conceptsExplored: ['physics-reynolds-similarity'],
    },
    {
      instruction:
        'Consult the classical pipe-flow diagram: a log-log plot of friction factor f vs Re. Identify the three regions: Re < 2300 laminar (smooth single curve), 2300 < Re < 2900 transitional (multi-valued), Re > 2900 fully turbulent (bands depending on roughness).',
      expectedOutcome:
        'You can sketch the Moody chart from memory and locate your kitchen faucet on it. The transition band is narrow and sensitive to disturbances.',
      hint: 'Re = 2300 is the textbook threshold for pipe flow. Other geometries (boundary layer, jet) have different critical Re.',
      conceptsExplored: ['physics-reynolds-similarity'],
    },
    {
      instruction:
        'Treat Re as a bifurcation parameter: as Re grows from 0 to infinity, what sequence of qualitatively different flow states does the system pass through? Name at least three.',
      expectedOutcome:
        'You list: Stokes flow (Re < 1, viscous dominated) -> steady laminar (Re up to 2300) -> periodic/vortex-shedding (intermediate Re around cylinder) -> fully turbulent (Re > 10^4). Re walks the system into chaos.',
      hint: 'For flow around a cylinder the textbook sequence is: creeping, steady-separated, Karman vortex street, fully turbulent wake.',
      conceptsExplored: ['physics-reynolds-similarity'],
    },
    {
      instruction:
        'Read the concept\'s complex-plane position (radius ~0.55, theta ~3*2pi/19). Why does Reynolds similarity live near the concrete engineering edge of the plane, rather than deep in the abstract?',
      expectedOutcome:
        'You articulate that Reynolds is a formula every engineer applies daily -- scale-up, HVAC sizing, tide-flat water columns -- so it earns a smaller radius than blow-up dynamics or soliton resolution.',
      hint: 'complexPlanePosition real axis = concrete-to-abstract. Re is a concrete tool.',
      conceptsExplored: ['physics-reynolds-similarity'],
    },
    {
      instruction:
        'Close by writing a one-line test: given rho, u, L, mu, return "laminar" / "transitional" / "turbulent". Implement it in your favorite language. Verify it against your kitchen-faucet numbers from step 1.',
      expectedOutcome:
        'Your function matches your qualitative observations. You have walked from phenomenon to formula to classifier in twenty minutes.',
      hint: 'def regime(rho, u, L, mu): Re = rho*u*L/mu; return "laminar" if Re < 2300 else "transitional" if Re < 2900 else "turbulent".',
      conceptsExplored: ['physics-reynolds-similarity', 'math-ratios-proportions'],
    },
  ],
};
