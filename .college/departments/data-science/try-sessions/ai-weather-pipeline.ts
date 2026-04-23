/**
 * AI Weather Pipeline try-session -- GraphCast → AIFS progression.
 *
 * Walk a learner from the 2022 FourCastNet announcement, through Pangu-Weather
 * (Nature 2023), GraphCast (Science 2023), FengWu/FuXi, ECMWF AIFS operational
 * 2025, and GenCast diffusion ensembles, to the subtle fact that every ML
 * model is trained on ERA5 (classical 4D-Var) and inherits its biases.
 *
 * @module departments/data-science/try-sessions/ai-weather-pipeline
 */

import type { TrySessionDefinition } from '../../../college/try-session-runner.js';

export const aiWeatherPipelineSession: TrySessionDefinition = {
  id: 'data-science-ai-weather-pipeline-first-steps',
  title: 'AI Weather Pipeline: The 2022-2026 ML Forecasting Progression',
  description:
    'A guided first pass through the ML weather-prediction progression ' +
    '-- from FourCastNet (NVIDIA 2022), Pangu-Weather (Huawei 2023), ' +
    'GraphCast (DeepMind 2023), FengWu/FuXi (2023), ECMWF AIFS ' +
    'operational 2025, GenCast diffusion ensembles, to why every ML ' +
    'model is downstream of ERA5 and 4D-Var.',
  estimatedMinutes: 22,
  prerequisites: [],
  steps: [
    {
      instruction:
        'Open the ECMWF Forecast Charts and find a current HRES (high-resolution physics-based) 10-day forecast. Now find a GraphCast or AIFS forecast for the same initial time. Compare. What is striking about the two forecasts, and about their compute requirements?',
      expectedOutcome:
        'You articulate that the ML forecast looks qualitatively similar to HRES (same cyclone positions, similar jet structure) but was produced in under a minute on a single GPU, versus multiple hours on a 1,000+ node supercomputer for HRES. ML weather has matched physics-based NWP skill on 90% of standard verification metrics at roughly 1/1000 the inference cost.',
      hint: 'This compute gap is the reason ECMWF went operational with AIFS in February 2025 -- the economics of ensemble forecasting change completely when inference is free.',
      conceptsExplored: ['data-science-ai-weather-pipeline'],
    },
    {
      instruction:
        'Read about FourCastNet (Pathak et al. 2022), the first IFS-scale ML weather model. It uses the Adaptive Fourier Neural Operator architecture on 0.25° ERA5. What was the key 2022 claim, and why was the community skeptical?',
      expectedOutcome:
        'You explain that FourCastNet achieved IFS-comparable 6-hour forecasts on global ERA5 with an order-of-magnitude faster inference, using a transformer architecture over Fourier-modal grid tokens. Skepticism: the community worried about out-of-distribution extremes, tail behavior, long-lead-time drift, and whether the model was just interpolating ERA5 climatology rather than capturing dynamics.',
      hint: 'FourCastNet was the opening shot. The skepticism was reasonable but ultimately resolved empirically: by 2023 three independent groups had confirmed the result.',
      conceptsExplored: ['data-science-ai-weather-pipeline'],
    },
    {
      instruction:
        'Now read about Pangu-Weather (Bi et al. Nature 2023). It introduces the 3D Earth-Specific Transformer with hierarchical temporal aggregation (1h, 3h, 6h, 24h models chained). What is novel about the architecture, and what does "Earth-Specific" mean?',
      expectedOutcome:
        'You explain that Pangu-Weather embeds Earth geometry directly into attention masks -- spherical coordinates, pole-aware tokenization, explicit vertical-stratification biases -- rather than treating the globe as a flat 2D image. The hierarchical time-scale chaining avoids compounding error in long forecasts by using the best model for each lead-time increment.',
      hint: 'Pangu\'s 24-hour model is only called for 24-hour forecast increments; the 1-hour model handles short-range. This is a form of multi-resolution temporal reasoning.',
      conceptsExplored: ['data-science-ai-weather-pipeline'],
    },
    {
      instruction:
        'Read about GraphCast (Lam et al. Science 2023). It is a graph neural network on an icosahedral multimesh -- 40,962 nodes, with message passing across 6 mesh refinement levels simultaneously. What does multimesh message passing capture that a single-resolution transformer misses?',
      expectedOutcome:
        'You explain that multimesh message passing propagates information at multiple scales in parallel: the fine mesh carries local dynamics (frontal structure, convective instability), the coarse mesh carries planetary-scale teleconnections (Rossby waves, MJO). A single attention layer can simultaneously route a local cold front and a hemispheric wave train. GraphCast beats HRES on 90% of 1,380 verification targets in 10-day forecasts produced in under a minute.',
      hint: 'The icosahedral mesh eliminates the pole singularity of lat-lon grids -- critical for global forecasts, where a standard 2D attention over a flattened sphere distorts near the poles.',
      conceptsExplored: ['data-science-ai-weather-pipeline', 'math-logarithmic-scales'],
    },
    {
      instruction:
        'Now the operational transition: ECMWF AIFS went operational on 25 February 2025 (deterministic); AIFS ENS (51-member ensemble) on 1 July 2025. Meanwhile GenCast (Price et al. Nature 2024) is a diffusion ensemble on the sphere. What does operational-at-ECMWF actually mean, and what does a diffusion ensemble buy you versus a deterministic model?',
      expectedOutcome:
        'You articulate that operational means running every 6 hours on ECMWF\'s HPC with strict SLAs (availability, forecast delivery deadlines, reproducibility), and being the product that 150+ national meteorological services actually use for aviation, shipping, and severe-weather warnings. A diffusion ensemble samples from the forecast distribution (not just the mean), enabling calibrated uncertainty and probabilistic extreme-event warnings that deterministic models cannot produce.',
      hint: 'Operationalization is the hard mile: benchmark wins on ERA5 test sets are easy compared to robust 24/7/365 delivery with fallback modes and bit-for-bit reproducibility.',
      conceptsExplored: ['data-science-ai-weather-pipeline'],
    },
    {
      instruction:
        'Now the quiet fact that undercuts everything: every ML weather model is trained on ERA5, which is a 4D-Var reanalysis. The ML models learn the ERA5 manifold, not raw physics. What does this mean for out-of-distribution events, extreme precipitation, and the long-term future of the field?',
      expectedOutcome:
        'You reason: ML models underestimate 99th-percentile precipitation (documented in GraphCast/Pangu evaluations) because ERA5 itself underestimates extremes -- the underlying IFS + 4D-Var smooths tail events. ML models inherit this bias exactly. The path forward either (a) trains on raw observations + radar + satellite (vastly harder), (b) uses hybrid ML-physics approaches, or (c) accepts the bias and does downstream bias-correction.',
      hint: 'This is the defining open problem of AI weather in 2026: are we learning physics, or learning a 4D-Var-shaped reanalysis? The honest answer right now is "both, and we cannot yet separate them."',
      conceptsExplored: ['data-science-ai-weather-pipeline', 'data-science-data-assimilation-4dvar'],
    },
    {
      instruction:
        'Close by placing the AI weather pipeline on the complex plane of experience: it is a high-concreteness, medium-complexity applied-engineering concept at the crossroads of scientific ML, atmospheric dynamics, and operational meteorology. State one line that captures why the 2022-2026 progression is a generational shift.',
      expectedOutcome:
        'You state something like: "In four years the field went from IFS being the unambiguous best global forecast model to AIFS and GraphCast matching or beating IFS at roughly 1/1000 the inference cost, trained on 40 years of 4D-Var reanalysis. This is the largest compute-efficiency gain in the history of numerical weather prediction, and it fundamentally changes the economics of ensemble forecasting, climate downscaling, and reanalysis production."',
      hint: 'The same four-year arc took classical NWP from 1950 (Charney-Fjørtoft-von Neumann 1-day barotropic forecasts) to roughly 1975 (operational 5-day forecasts). ML compressed that timeline ten-fold.',
      conceptsExplored: ['data-science-ai-weather-pipeline', 'data-science-data-assimilation-4dvar'],
    },
  ],
};
