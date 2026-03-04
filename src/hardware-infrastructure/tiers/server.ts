/**
 * Tier 4: Server — Rack servers, NAS, and storage infrastructure.
 */

import type { HardwareTier } from '../types.js';

export const serverTier: HardwareTier = {
  id: 'server',
  level: 4,
  name: 'Server',
  description: 'Rack-mounted servers and NAS for model storage, data serving, and infrastructure services.',
  meshRole: 'storage-serving',
  capabilities: {
    maxModelParams: 'N/A',
    vramRange: 'N/A',
    inferenceLatency: 'low',
    alwaysOn: true,
    gpuAccelerated: false,
  },
  examples: [
    { name: 'Synology RS3621xs+', specs: '12-bay, 64GB ECC RAM, 10GbE', bestFor: 'Model weight storage, dataset serving, backup' },
    { name: 'Custom ZFS RAIDZ2 Server', specs: '128TB raw, dual Xeon, ECC RAM', bestFor: 'High-availability model repository, checkpoint storage' },
  ],
  safetyNotes: [
    'Use ECC memory for data integrity — silent bit flips corrupt model weights',
    'Implement UPS with graceful shutdown — RAIDZ2 rebuild after power loss is slow and risky',
    'Monitor disk SMART data — replace drives proactively before failure',
  ],
};
