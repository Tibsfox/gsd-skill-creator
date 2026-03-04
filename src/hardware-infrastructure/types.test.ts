import { describe, it, expect } from 'vitest';
import {
  HardwareTierLevelSchema,
  MeshRoleSchema,
  TierCapabilitiesSchema,
  HardwareExampleSchema,
  HardwareTierSchema,
  NodeProfileSchema,
} from './types.js';

describe('hardware infrastructure types', () => {
  it('validates tier levels 1-5', () => {
    for (const level of [1, 2, 3, 4, 5]) {
      expect(HardwareTierLevelSchema.safeParse(level).success).toBe(true);
    }
  });

  it('rejects tier level 0 and 6', () => {
    expect(HardwareTierLevelSchema.safeParse(0).success).toBe(false);
    expect(HardwareTierLevelSchema.safeParse(6).success).toBe(false);
  });

  it('validates all mesh roles', () => {
    for (const role of ['edge-inference', 'local-inference', 'heavy-inference', 'storage-serving', 'cloud-reasoning']) {
      expect(MeshRoleSchema.safeParse(role).success).toBe(true);
    }
  });

  it('validates TierCapabilities', () => {
    const caps = {
      maxModelParams: '4B',
      vramRange: '0-2GB',
      inferenceLatency: 'high' as const,
      alwaysOn: true,
      gpuAccelerated: false,
    };
    expect(TierCapabilitiesSchema.safeParse(caps).success).toBe(true);
  });

  it('validates HardwareExample', () => {
    const example = {
      name: 'Raspberry Pi 5',
      specs: '8GB RAM, ARM Cortex-A76',
      bestFor: 'Always-on edge inference with small models',
    };
    expect(HardwareExampleSchema.safeParse(example).success).toBe(true);
  });

  it('validates a complete HardwareTier', () => {
    const tier = {
      id: 'edge',
      level: 1 as const,
      name: 'Edge',
      description: 'Lightweight edge devices for always-on inference',
      meshRole: 'edge-inference' as const,
      capabilities: {
        maxModelParams: '4B',
        inferenceLatency: 'high' as const,
        alwaysOn: true,
        gpuAccelerated: false,
      },
      examples: [
        { name: 'Raspberry Pi 5', specs: '8GB RAM', bestFor: 'Edge inference' },
        { name: 'Orange Pi', specs: '4GB RAM', bestFor: 'Sensor aggregation' },
      ],
      safetyNotes: ['Monitor operating temperature — passive cooling may be insufficient under sustained load'],
    };
    expect(HardwareTierSchema.safeParse(tier).success).toBe(true);
  });

  it('rejects tier with less than 2 examples', () => {
    const tier = {
      id: 'edge',
      level: 1,
      name: 'Edge',
      description: 'Edge devices',
      meshRole: 'edge-inference',
      capabilities: { maxModelParams: '4B', inferenceLatency: 'high', alwaysOn: true, gpuAccelerated: false },
      examples: [{ name: 'Pi', specs: 'ARM', bestFor: 'Testing' }],
      safetyNotes: ['Be careful'],
    };
    expect(HardwareTierSchema.safeParse(tier).success).toBe(false);
  });

  it('rejects tier with no safety notes', () => {
    const tier = {
      id: 'edge',
      level: 1,
      name: 'Edge',
      description: 'Edge devices',
      meshRole: 'edge-inference',
      capabilities: { maxModelParams: '4B', inferenceLatency: 'high', alwaysOn: true, gpuAccelerated: false },
      examples: [
        { name: 'Pi 5', specs: 'ARM', bestFor: 'Edge' },
        { name: 'Pi 4', specs: 'ARM', bestFor: 'Edge' },
      ],
      safetyNotes: [],
    };
    expect(HardwareTierSchema.safeParse(tier).success).toBe(false);
  });

  it('validates NodeProfile', () => {
    const profile = {
      tierId: 'edge',
      meshRole: 'edge-inference' as const,
      recommendedModels: ['phi-2', 'tinyllama'],
      passRateExpectation: 0.6,
      costPerToken: 0,
    };
    expect(NodeProfileSchema.safeParse(profile).success).toBe(true);
  });

  it('rejects NodeProfile with invalid pass rate', () => {
    const profile = {
      tierId: 'edge',
      meshRole: 'edge-inference',
      recommendedModels: [],
      passRateExpectation: 1.5,
    };
    expect(NodeProfileSchema.safeParse(profile).success).toBe(false);
  });
});
