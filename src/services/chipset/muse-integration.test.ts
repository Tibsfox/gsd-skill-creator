import { describe, it, expect } from 'vitest';
import { createMuseSystem, consultWithDisclosure } from './muse-integration.js';
import type { MuseId } from './muse-schema-validator.js';
import type { ForkRequest } from './muse-forking.js';
import type { WillowContext } from './willow-types.js';

const FOXY_CFG = {
  name: 'foxy', version: '1.0.0', museType: 'system', totalBudget: 0.15,
  orientation: { angle: 1.2566, magnitude: 0.8 },
  vocabulary: ['cartography', 'narrative arc', 'creative direction'],
  voice: { tone: 'warm-creative', style: 'narrative', signature: 'maps and stories' },
  activationPatterns: ['creative|vision|story'], composableWith: ['sam', 'cedar'],
};

const LEX_CFG = {
  name: 'lex', version: '1.0.0', museType: 'system', totalBudget: 0.15,
  orientation: { angle: 0.0873, magnitude: 0.9 },
  vocabulary: ['execution discipline', 'pipeline', 'verification'],
  voice: { tone: 'precise-disciplined', style: 'technical', signature: 'measure twice' },
  activationPatterns: ['plan|execute|verify'], composableWith: ['hemlock', 'cedar'],
};

const CEDAR_CFG = {
  name: 'cedar', version: '1.0.0', museType: 'system', totalBudget: 0.1,
  orientation: { angle: 0, magnitude: 0 },
  vocabulary: ['timeline', 'integrity', 'observation'],
  voice: { tone: 'measured-observant', style: 'chronicle', signature: 'the record shows' },
  activationPatterns: ['record|history|timeline'], composableWith: ['foxy', 'lex'],
};

describe('MuseSystem Integration', () => {
  it('creates a complete muse system from configs', () => {
    const system = createMuseSystem([FOXY_CFG, LEX_CFG]);
    expect(system.registry.allMuses()).toHaveLength(2);
    expect(system.forker).toBeDefined();
    expect(system.cedar).toBeDefined();
    expect(system.willow).toBeDefined();
  });

  it('end-to-end: consult muses and get disclosure-wrapped output', () => {
    const system = createMuseSystem([FOXY_CFG, LEX_CFG]);
    const request: ForkRequest = {
      context: 'Designing a new feature',
      muses: ['foxy', 'lex'] as MuseId[],
      question: 'What approach should we take?',
      mergeStrategy: 'comparison',
    };
    const willowCtx: WillowContext = {
      userDepth: 'scan',
      sessionCount: 10,
      lastSeen: '2026-03-03T00:00:00Z',
      preferredStyle: null,
    };

    const result = consultWithDisclosure(system, request, willowCtx);
    expect(result.level).toBe('scan');
    expect(result.content).toBeTruthy();
    expect(result.content.length).toBeLessThanOrEqual(500);
  });

  it('cedar records consultation in timeline', () => {
    const system = createMuseSystem([FOXY_CFG, LEX_CFG]);
    const request: ForkRequest = {
      context: 'Test context',
      muses: ['foxy'] as MuseId[],
      question: 'Test?',
      mergeStrategy: 'strongest',
    };
    const willowCtx: WillowContext = {
      userDepth: 'glance',
      sessionCount: 1,
      lastSeen: null,
      preferredStyle: null,
    };

    consultWithDisclosure(system, request, willowCtx);
    const entries = system.cedar.allEntries();
    expect(entries.length).toBeGreaterThan(0);
    expect(entries[0].content).toContain('foxy');
  });

  it('plane engine activations feed into forker', () => {
    const system = createMuseSystem([FOXY_CFG, LEX_CFG]);
    const musePositions = new Map<MuseId, { angle: number; magnitude: number }>();
    for (const muse of system.registry.allMuses()) {
      musePositions.set(muse.id, {
        angle: Math.atan2(muse.planePosition.imaginary, muse.planePosition.real),
        magnitude: Math.sqrt(muse.planePosition.real ** 2 + muse.planePosition.imaginary ** 2),
      });
    }
    const activations = system.plane.rankForContext(musePositions, { real: 0.7, imaginary: 0.3 });
    expect(activations.length).toBe(2);
    const topMuses = activations.map(a => a.museId);
    const result = system.forker.consult({
      context: 'Test',
      muses: topMuses,
      question: 'What?',
      mergeStrategy: 'synthesis',
    });
    expect(result.perspectives).toHaveLength(2);
  });

  it('visibility engine filters before willow renders', () => {
    const system = createMuseSystem([FOXY_CFG, LEX_CFG]);
    const decisions = system.visibility.decide({
      userInput: 'ask foxy about this',
      taskDescription: 'creative direction',
      activeMuses: [{ museId: 'foxy' as MuseId, score: 0.9, reason: 'test' }],
      conversationDepth: 3,
    });
    expect(decisions).toHaveLength(1);
    expect(decisions[0].level).toBe('direct-invocation');
  });

  it('sandbox validates cartridge trust before access', () => {
    const system = createMuseSystem([FOXY_CFG]);
    const policy = system.sandbox.policyForTrust('quarantine', '/test/bundle');
    expect(system.sandbox.canRead(policy, '/test/bundle/manifest.json')).toBe(true);
    expect(system.sandbox.canRead(policy, '/etc/passwd')).toBe(false);
  });

  it('cartridge validation and navigation work end-to-end', () => {
    const system = createMuseSystem([FOXY_CFG]);
    const manifest = {
      name: 'test', version: '1.0.0', author: 'tester', description: 'Test cartridge',
      trust: 'quarantine' as const, muses: ['foxy' as MuseId], deepMap: 'map.json',
      story: 'story.md', chipset: 'chipset.yaml', dependencies: [], tags: ['test'],
    };
    const result = system.cartridge.validateManifest(manifest);
    expect(result.valid).toBe(true);
  });

  it('glance disclosure limits output for new users', () => {
    const system = createMuseSystem([FOXY_CFG, LEX_CFG]);
    const result = consultWithDisclosure(
      system,
      { context: 'Test', muses: ['foxy', 'lex'] as MuseId[], question: 'Test?', mergeStrategy: 'comparison' },
      { userDepth: 'glance', sessionCount: 1, lastSeen: null, preferredStyle: null },
    );
    expect(result.level).toBe('glance');
    expect(result.content.length).toBeLessThanOrEqual(80);
  });
});
