/**
 * Mesh node profiles mapping hardware tiers to expected performance.
 */

import type { NodeProfile } from '../types.js';

export const nodeProfiles: NodeProfile[] = [
  {
    tierId: 'edge',
    meshRole: 'edge-inference',
    recommendedModels: ['phi-2', 'tinyllama-1.1b', 'gemma-2b'],
    passRateExpectation: 0.55,
    costPerToken: 0,
  },
  {
    tierId: 'desktop',
    meshRole: 'local-inference',
    recommendedModels: ['llama-3-8b', 'mistral-7b', 'codellama-13b'],
    passRateExpectation: 0.72,
    costPerToken: 0,
  },
  {
    tierId: 'workstation',
    meshRole: 'heavy-inference',
    recommendedModels: ['llama-3-70b', 'mixtral-8x7b', 'codestral-22b'],
    passRateExpectation: 0.85,
    costPerToken: 0,
  },
  {
    tierId: 'server',
    meshRole: 'storage-serving',
    recommendedModels: [],
    passRateExpectation: 0,
  },
  {
    tierId: 'cloud',
    meshRole: 'cloud-reasoning',
    recommendedModels: ['claude-opus-4-6', 'claude-sonnet-4-6', 'gpt-4o'],
    passRateExpectation: 0.95,
    costPerToken: 0.015,
  },
];
