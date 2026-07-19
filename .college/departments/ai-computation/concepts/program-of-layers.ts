/**
 * Program-of-Layers concept — ai-computation (June-2026 additional-scan batch B, T2).
 *
 * Source: arXiv:2606.06574 (2026).
 *
 * @module departments/ai-computation/concepts/program-of-layers
 */

import type { RosettaConcept } from '../../../rosetta-core/types.js';

const theta = 5 * 2 * Math.PI / 29;
const radius = 0.93;
const real = radius * Math.cos(theta);
const imaginary = radius * Math.sin(theta);

export const programOfLayers: RosettaConcept = {
  id: 'ai-computation-program-of-layers',
  name: 'Program-of-Layers',
  domain: 'ai-computation',
  description: 'Program-of-Layers (PoLar) reframes a pretrained transformer\'s fixed forward pass as just one execution path among many: its layers are treated as reusable modules that can be dynamically skipped or looped on a per-input basis, forming a custom "program of layers" without any weight retraining. arXiv:2606.06574 (2026) reveals that this flexible dynamic execution exists broadly and training-free in already-pretrained LLMs — for most inputs a substantially shorter program reaches the same or better accuracy, and inputs the original model gets wrong can be corrected by an alternative program using fewer layers, implying that inference admits multiple valid latent computations beyond the standard depth-ordered pass. To exploit this in practice, the authors add a lightweight PoLar prediction network that emits, per input, the sequence of layer skips and repeats to run; on mathematical-reasoning benchmarks it consistently beats both standard inference and prior dynamic-depth methods, often while executing fewer layers, with gains that persist under out-of-distribution evaluation. Distinct from Test-Time Training, which adapts the model by updating parameters at inference time: PoLar leaves every weight frozen and instead reprograms the control flow over unchanged modules, so the adaptation is a routing decision rather than a gradient step. The conclusion is that fixed-depth execution captures only a narrow slice of an LLM\'s latent reasoning capacity. For agent systems this argues for treating layer depth as a controllable, input-conditioned budget rather than a constant: a cheap predictor can trade compute for accuracy dynamically, escalating depth on hard reasoning steps and collapsing it on easy ones, which turns per-token inference cost into a tunable knob inside an autonomous loop.',
  panels: new Map(),
  relationships: [
    {
      type: 'analogy',
      targetId: 'ai-computation-test-time-training',
      description: 'Both are inference-time adaptation mechanisms, but Test-Time Training updates weights per input whereas Program-of-Layers keeps weights frozen and only reprograms which layers execute — adaptation by routing rather than by gradient.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-task-specific-knowledge-localization',
      description: 'PoLar\'s finding that individual layers can be skipped or looped per input operationalizes layer-level knowledge localization: it shows computation is modular enough that the useful subset of layers varies by task, complementing static localization of where knowledge lives.',
    },
    {
      type: 'cross-reference',
      targetId: 'ai-computation-latent-world-model',
      description: 'The claim that fixed-depth inference captures only a narrow subset of an LLM\'s latent reasoning supports the view that richer latent computation exists inside the network than any single forward pass exposes.',
    },
  ],
  complexPlanePosition: {
    real,
    imaginary,
    magnitude: Math.sqrt(real * real + imaginary * imaginary),
    angle: Math.atan2(imaginary, real),
  },
};
