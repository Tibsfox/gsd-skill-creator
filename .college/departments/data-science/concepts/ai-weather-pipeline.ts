/**
 * AI Weather Pipeline concept -- GraphCast → AIFS progression.
 *
 * Scientific ML at scale: the 2022-2026 progression.
 * FourCastNet (NVIDIA 2022), Pangu-Weather (Huawei 2023), GraphCast
 * (DeepMind 2023), FengWu/FuXi (2023), AIFS operational (ECMWF 2025),
 * GenCast (DeepMind 2024) -- a four-year arc of ML systems matching
 * or exceeding physics-based NWP on standard metrics.
 *
 * @module departments/data-science/concepts/ai-weather-pipeline
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

// theta ~15*2pi/19, radius ~0.60 (applied engineering progression)
const theta = 15 * 2 * Math.PI / 19;
const radius = 0.60;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const aiWeatherPipeline: RosettaConcept = {
  id: 'data-science-ai-weather-pipeline',
  name: 'AI Weather Pipeline',
  domain: 'data-science',
  description: 'The 2022-2026 machine-learning weather-prediction progression, all ' +
    'trained on the ECMWF ERA5 reanalysis (~four decades of hourly global ' +
    'atmospheric state at 0.25°). FourCastNet (NVIDIA 2022) was the first ' +
    'IFS-scale ML model; Pangu-Weather (Huawei, Nature 2023) introduced the ' +
    '3D Earth-Specific Transformer with 24-hour forecasts in ~1.4 seconds; ' +
    'GraphCast (DeepMind, Science 2023) is a graph neural network on an ' +
    'icosahedral multimesh producing 10-day forecasts in under a minute and ' +
    'beating HRES on 90% of 1,380 verification targets; FengWu and FuXi ' +
    '(2023) push skillful lead times past 10 days; AIFS went operational at ' +
    'ECMWF on 25 February 2025, with AIFS ENS (51 members) on 1 July 2025. ' +
    'GenCast (DeepMind, Nature 2024) is a diffusion ensemble on the sphere. ' +
    'Weaknesses remain: AI models underestimate 99th-percentile precipitation, ' +
    'and all depend on ERA5 (classical NWP) for training.',
  panels: new Map([
    ['python', {
      panelId: 'python',
      explanation: 'Python ML-weather stacks (pytorch + jax + xarray + ECMWF-API) load ERA5 reanalysis into Dataset objects, then train FourCastNet / Pangu / GraphCast-style architectures on (state_t, state_{t+6h}) pairs. ' +
        'Notebook workflows iterate with DataLoader batches, log skill-score decay via Weights & Biases, and benchmark against HRES using scikit-learn metric utilities. ' +
        'Inference runs on single-GPU Triton servers in seconds. ' +
        'See Lam et al. 2023.',
    }],
    ['cpp', {
      panelId: 'cpp',
      explanation: 'C++ AI-inference servers (TensorRT, ONNX Runtime, Triton) host GraphCast / AIFS models as templated InferenceSession<Engine> graph-NN engines with fused multi-head-attention kernels, INT8-quantised edge features, and CUDA-graph capture for sub-second 10-day rollouts. ' +
        'constexpr Icosahedral multimesh tables feed SIMD message-passing reductions across the 40,962-node sphere. ' +
        'See Lam et al. 2023.',
    }],
    ['unison', {
      panelId: 'unison',
      explanation: 'Unison treats model checkpoints and training pipelines as content-addressed values: each 37M-parameter GraphCast weight tensor hashes to a unique identifier, and the training dataflow (ERA5 shard -> augment -> loss -> gradient-step) is a Merkle-DAG of ability-tracked functions. ' +
        'Any forecast is reproducible from its input-data hash + model hash -- reproducibility is built into identity. ' +
        'See Lam et al. 2023.',
    }],
  ]),
  relationships: [
    {
      type: 'cross-reference',
      targetId: 'data-science-data-assimilation-4dvar',
      description: 'AI weather models are downstream of 4D-Var analyses: they learn the ERA5 manifold produced by classical data assimilation',
    },
    {
      type: 'dependency',
      targetId: 'math-logarithmic-scales',
      description: 'Forecast-skill-score decay with lead time is expressed on logarithmic scales; benchmark comparisons use log-domain metrics',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
