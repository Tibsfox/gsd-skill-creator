/**
 * Aerosol Indirect ERF try-session -- cloud-aerosol radiative forcing.
 *
 * Walk a learner from the observation that polluted clouds look brighter,
 * through the Twomey (first indirect) and Albrecht (second indirect)
 * effects, to the AR6 WG1 Chapter 7 ERF_aci budget and why the
 * factor-of-five uncertainty is the largest single term in AR6 forcing.
 *
 * @module departments/environmental/try-sessions/aerosol-indirect-erf
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const aerosolIndirectErfSession: TrySessionDefinition = {
  id: 'environmental-aerosol-indirect-erf-first-steps',
  title: 'Aerosol Indirect ERF: Why Polluted Clouds Are Brighter',
  description:
    'A guided first pass through the aerosol indirect effect -- from a ' +
    'ship-track satellite image, through the Twomey albedo and Albrecht ' +
    'lifetime mechanisms, to the AR6 WG1 Chapter 7 ERF_aci budget of ' +
    '-1.0 [-1.7, -0.3] W/m² and its factor-of-five uncertainty.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Open NASA Worldview or the MODIS image gallery and search for "ship tracks". Find one of the classic images: bright linear cloud streaks tracing ship emissions through an otherwise uniform marine stratocumulus deck. What are you looking at? Why are the tracks brighter?',
      expectedOutcome:
        'You articulate that ship exhaust injects cloud-condensation nuclei (CCN) -- sulfate particles from bunker fuel -- into the stratocumulus below. At fixed liquid-water content, more CCN means more droplets of smaller radius; the total droplet cross-section rises, so shortwave reflectance rises. The ship tracks are brighter because they are more polluted.',
      hint: 'Ship tracks are the cleanest natural experiment we have for aerosol-cloud interactions: a clear before/after line at the ship position, with known sulfur content from fuel manifests.',
      conceptsExplored: ['environmental-aerosol-indirect-erf', 'chemistry-kohler-theory'],
    },
    {
      instruction:
        'Write down the Twomey (1977) first indirect effect equation: at fixed liquid water path L, droplet number concentration N relates to effective radius r_e via L ∝ N · r_e^3. If you double N, what happens to r_e, and what happens to cloud optical depth τ ∝ L / r_e?',
      expectedOutcome:
        'You show that doubling N at fixed L shrinks r_e by a factor of 2^(1/3) ≈ 1.26; τ therefore grows by the same factor. More CCN at fixed water = more numerous, smaller droplets = higher optical depth = brighter cloud. This is the cleanest cloud-albedo perturbation you can write down.',
      hint: 'The Twomey calculation needs only mass conservation (L fixed) and the geometric cross-section of spheres. No radiative-transfer sophistication required to see the sign.',
      conceptsExplored: ['environmental-aerosol-indirect-erf', 'math-ratios-proportions'],
    },
    {
      instruction:
        'Now read about the Albrecht (1989) second indirect (lifetime) effect. Smaller droplets are slower to collide and coalesce into raindrops (terminal-velocity scaling). What does this do to cloud lifetime and total cloud cover in a polluted marine boundary layer?',
      expectedOutcome:
        'You explain that polluted clouds drizzle less, so their water stays aloft longer; they persist through more of the daylight hours and cover a larger fractional area. The Albrecht effect adds to the Twomey brightening -- not only are polluted clouds more reflective per unit area, but there is more of them for more of the time.',
      hint: 'Coalescence efficiency is a steep function of droplet radius: at r_e < 14 µm, warm rain shuts off. Polluted stratocumulus often sits below this threshold.',
      conceptsExplored: ['environmental-aerosol-indirect-erf'],
    },
    {
      instruction:
        'Pull up IPCC AR6 WG1 Chapter 7 Figure 7.6 (or the Table 7.8 summary row). ERF_aci is assessed at -1.0 W/m² with a very-likely range of -1.7 to -0.3 W/m², medium confidence. Why is the interval so wide -- a factor of 5 between the most-negative and least-negative bounds? Where does the uncertainty enter?',
      expectedOutcome:
        'You identify the main culprits: CCN activation parametrisations (Köhler theory averaged over realistic aerosol chemistry), adjusted cloud responses (susceptibility of liquid-water path to aerosol), and incomplete observational constraints below the satellite retrieval floor. Each contributes ~0.3-0.5 W/m² uncertainty.',
      hint: 'AR6 cites ERF_aci as the largest single uncertainty in the effective-radiative-forcing budget. Reducing it to ±0.2 W/m² is the grand challenge of cloud-aerosol research.',
      conceptsExplored: ['environmental-aerosol-indirect-erf'],
    },
    {
      instruction:
        'Trace the chain from emission to forcing: anthropogenic SO2 -> H2SO4 -> sulfate aerosol -> CCN -> droplet number N -> effective radius r_e -> optical depth τ -> top-of-atmosphere shortwave flux -> ERF_aci. Which link has the sharpest observational constraint, and which is still a modeling choice?',
      expectedOutcome:
        'You articulate that satellite AOD (aerosol optical depth) is well-observed; r_e and τ retrievals are reasonable; N from satellite is indirect (cloud-top brightness + r_e inversion); the AOD -> N chain crosses Köhler activation physics and is the softest link. The emission -> AOD end is well-known; the AOD -> N bridge carries the bulk of the uncertainty.',
      hint: 'This is why "aerosol-cloud interaction experts" publish so many competing ERF_aci estimates: everyone agrees on the ends of the chain; the activation middle is open.',
      conceptsExplored: ['environmental-aerosol-indirect-erf', 'chemistry-kohler-theory'],
    },
    {
      instruction:
        'Think about geoengineering and the 2020 IMO low-sulfur shipping rule. The IMO rule cut marine SO2 emissions by ~80%, so CCN over shipping lanes dropped. If you believe ERF_aci, what does the IMO rule predict for ocean brightness and global temperature? Is there evidence of it already?',
      expectedOutcome:
        'You reason: fewer CCN -> larger droplets, lower τ, darker marine stratocumulus, less shortwave reflection, more warming. 2023-2024 hot anomaly in North Atlantic / North Pacific marine temperatures has been partly attributed to this mechanism (Hansen et al. 2023 preprint; open debate). This is the cleanest real-world ERF_aci signal in decades.',
      hint: 'Marine cloud brightening proposals (Latham 1990) would intentionally run the Twomey effect in reverse: spray sea-salt aerosol to brighten specific ocean regions. The IMO rule is the inadvertent reverse experiment.',
      conceptsExplored: ['environmental-aerosol-indirect-erf'],
    },
    {
      instruction:
        'Close by placing aerosol indirect ERF on the complex plane of experience: it is a medium-concreteness, high-complexity concept at the crossroads of radiative transfer, cloud microphysics, and aerosol chemistry. State one line that captures why ERF_aci is the defining uncertainty of 21st-century climate forcing.',
      expectedOutcome:
        'You state something like: "ERF_aci = Twomey brightening + Albrecht lifetime lengthening averaged over every polluted cloud on Earth -- AR6 gives -1.0 [-1.7, -0.3] W/m², and that factor-of-five interval is the single largest term in the AR6 forcing budget. Narrowing it is the field\'s biggest open problem."',
      hint: 'Every aerosol-emission scenario you read about -- IMO rules, coal phase-outs, biomass-burning trends -- feeds directly through this mechanism into the atmosphere\'s radiation budget.',
      conceptsExplored: ['environmental-aerosol-indirect-erf', 'environmental-wmo-cloud-taxonomy'],
    },
  ],
};
