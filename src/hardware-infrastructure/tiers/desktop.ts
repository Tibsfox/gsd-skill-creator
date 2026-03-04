/**
 * Tier 2: Desktop — Consumer desktops and gaming rigs for interactive inference.
 */

import type { HardwareTier } from '../types.js';

export const desktopTier: HardwareTier = {
  id: 'desktop',
  level: 2,
  name: 'Desktop',
  description: 'Consumer desktops and gaming PCs with discrete GPUs for interactive local inference with medium models.',
  meshRole: 'local-inference',
  capabilities: {
    maxModelParams: '13B',
    vramRange: '8-16GB',
    inferenceLatency: 'medium',
    alwaysOn: false,
    gpuAccelerated: true,
  },
  examples: [
    { name: 'Gaming PC with RTX 4070', specs: '12GB VRAM, 32GB RAM, Ryzen 7', bestFor: 'Interactive 7B-13B model inference, code completion' },
    { name: 'Mac Studio M2 Max', specs: '32GB unified memory, 30-core GPU', bestFor: 'Unified memory enables larger model loading, creative workflows' },
  ],
  safetyNotes: [
    'Ensure adequate case ventilation — sustained GPU inference generates significant heat',
    'Use a UPS for power protection — sudden power loss during model loading can corrupt weights',
  ],
};
