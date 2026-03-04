/**
 * Tier 1: Edge — Raspberry Pi, edge devices, always-on lightweight inference.
 */

import type { HardwareTier } from '../types.js';

export const edgeTier: HardwareTier = {
  id: 'edge',
  level: 1,
  name: 'Edge',
  description: 'Lightweight edge devices for always-on inference with small models. Low power, passive cooling, ARM-based SBCs.',
  meshRole: 'edge-inference',
  capabilities: {
    maxModelParams: '4B',
    vramRange: '0-2GB',
    inferenceLatency: 'high',
    alwaysOn: true,
    gpuAccelerated: false,
  },
  examples: [
    { name: 'Raspberry Pi 5', specs: '8GB RAM, ARM Cortex-A76, 2.4GHz quad-core', bestFor: 'Always-on classification, sensor aggregation, edge routing' },
    { name: 'Orange Pi 5', specs: '16GB RAM, RK3588S, Mali-G610 MP4', bestFor: 'Lightweight NLP, local whisper transcription' },
    { name: 'NVIDIA Jetson Nano', specs: '4GB RAM, 128-core Maxwell GPU', bestFor: 'Edge ML inference, computer vision' },
  ],
  safetyNotes: [
    'Monitor operating temperature — passive cooling may be insufficient under sustained inference load',
    'Use quality power supplies rated for the device — undervoltage causes SD card corruption',
  ],
};
