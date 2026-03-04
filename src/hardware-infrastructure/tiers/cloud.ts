/**
 * Tier 5: Cloud — Cloud API services for highest-capability reasoning.
 */

import type { HardwareTier } from '../types.js';

export const cloudTier: HardwareTier = {
  id: 'cloud',
  level: 5,
  name: 'Cloud',
  description: 'Cloud API services (Claude, GPT-4, etc.) for highest-capability reasoning, grading, and complex tasks.',
  meshRole: 'cloud-reasoning',
  capabilities: {
    maxModelParams: 'Unlimited',
    inferenceLatency: 'medium',
    alwaysOn: true,
    gpuAccelerated: true,
  },
  examples: [
    { name: 'Claude API (Anthropic)', specs: 'Opus/Sonnet/Haiku tiers, 200K context', bestFor: 'Complex reasoning, code generation, grading, architectural decisions' },
    { name: 'OpenAI GPT-4 API', specs: 'GPT-4/4o tiers, 128K context', bestFor: 'Multi-modal tasks, general reasoning, tool use' },
  ],
  safetyNotes: [
    'Implement rate limiting and cost monitoring — cloud API costs scale with usage',
    'Never send sensitive data without reviewing the providers data handling policy',
  ],
};
