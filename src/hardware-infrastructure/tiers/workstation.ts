/**
 * Tier 3: Workstation — Multi-GPU workstations for heavy batch inference.
 */

import type { HardwareTier } from '../types.js';

export const workstationTier: HardwareTier = {
  id: 'workstation',
  level: 3,
  name: 'Workstation',
  description: 'Multi-GPU workstations for heavy inference, batch processing, and large model hosting.',
  meshRole: 'heavy-inference',
  capabilities: {
    maxModelParams: '70B',
    vramRange: '24-96GB',
    inferenceLatency: 'low',
    alwaysOn: false,
    gpuAccelerated: true,
  },
  examples: [
    { name: 'Dual RTX 4090 Workstation', specs: '48GB VRAM total, 128GB RAM, Threadripper', bestFor: 'Running 70B models quantized, fine-tuning, batch grading' },
    { name: 'Mac Pro M2 Ultra', specs: '192GB unified memory, 76-core GPU', bestFor: 'Large model inference without quantization, creative production' },
  ],
  safetyNotes: [
    'Multi-GPU setups require adequate power delivery — use 1000W+ PSU with proper cable management',
    'Monitor GPU temperatures individually — thermal throttling on one card affects the whole pipeline',
    'Ensure proper grounding — static discharge can damage GPU memory modules',
  ],
};
