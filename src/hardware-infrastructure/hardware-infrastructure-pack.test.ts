import { describe, it, expect } from 'vitest';
import { hardwareInfrastructurePack } from './hardware-infrastructure-pack.js';
import { electronicsEnrichment } from './college/electronics-enrichment.js';
import { engineeringEnrichment } from './college/engineering-enrichment.js';

describe('HardwareInfrastructurePack', () => {
  it('exports all 5 tiers', () => {
    expect(hardwareInfrastructurePack.tiers.length).toBe(5);
  });

  it('tiers have correct levels 1-5', () => {
    const levels = hardwareInfrastructurePack.tiers.map((t) => t.level).sort();
    expect(levels).toEqual([1, 2, 3, 4, 5]);
  });

  it('each tier has at least 2 hardware examples', () => {
    for (const tier of hardwareInfrastructurePack.tiers) {
      expect(tier.examples.length, `tier ${tier.name} has ${tier.examples.length} examples`).toBeGreaterThanOrEqual(2);
    }
  });

  it('each tier has at least 1 safety note', () => {
    for (const tier of hardwareInfrastructurePack.tiers) {
      expect(tier.safetyNotes.length, `tier ${tier.name} has ${tier.safetyNotes.length} safety notes`).toBeGreaterThanOrEqual(1);
    }
  });

  it('getTier returns correct tier by level', () => {
    const edge = hardwareInfrastructurePack.getTier(1);
    expect(edge.id).toBe('edge');
    expect(edge.meshRole).toBe('edge-inference');
  });

  it('getByMeshRole filters correctly', () => {
    const heavy = hardwareInfrastructurePack.getByMeshRole('heavy-inference');
    expect(heavy.length).toBe(1);
    expect(heavy[0].level).toBe(3);
  });

  it('has 5 node profiles', () => {
    expect(hardwareInfrastructurePack.profiles.length).toBe(5);
  });

  it('node profiles have valid pass rate expectations', () => {
    for (const p of hardwareInfrastructurePack.profiles) {
      expect(p.passRateExpectation).toBeGreaterThanOrEqual(0);
      expect(p.passRateExpectation).toBeLessThanOrEqual(1);
    }
  });

  it('getProfile returns profile by tier ID', () => {
    const profile = hardwareInfrastructurePack.getProfile('cloud');
    expect(profile).toBeDefined();
    expect(profile!.meshRole).toBe('cloud-reasoning');
  });

  it('matchHardware classifies Raspberry Pi as edge', () => {
    const result = hardwareInfrastructurePack.matchHardware({
      gpuAccelerated: false,
      alwaysOn: true,
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe('edge');
  });

  it('matchHardware classifies RTX 4070 as desktop', () => {
    const result = hardwareInfrastructurePack.matchHardware({
      gpuAccelerated: true,
      vramRange: '12GB',
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe('desktop');
  });

  it('matchHardware classifies cloud as unlimited', () => {
    const result = hardwareInfrastructurePack.matchHardware({
      maxModelParams: 'Unlimited',
    });
    expect(result).toBeDefined();
    expect(result!.id).toBe('cloud');
  });
});

describe('College Enrichment', () => {
  it('electronics enrichment adds Hardware Infrastructure wing', () => {
    expect(electronicsEnrichment.department).toBe('electronics');
    expect(electronicsEnrichment.wing).toBe('Hardware Infrastructure & Mesh Nodes');
  });

  it('engineering enrichment adds Distributed Systems wing', () => {
    expect(engineeringEnrichment.department).toBe('engineering');
    expect(engineeringEnrichment.wing).toBe('Distributed Systems Infrastructure');
  });
});
