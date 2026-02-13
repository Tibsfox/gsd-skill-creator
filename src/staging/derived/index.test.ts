/**
 * Tests for derived knowledge module barrel index.
 *
 * @module staging/derived/index.test
 */

import { describe, it, expect } from 'vitest';
import type { LineageEntry } from '../../types/observation.js';

describe('derived barrel index', () => {
  it('exports checkDerived', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.checkDerived).toBe('function');
  });

  it('exports buildProvenanceChain and getInheritedTier', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.buildProvenanceChain).toBe('function');
    expect(typeof mod.getInheritedTier).toBe('function');
  });

  it('exports checkPatternFidelity', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.checkPatternFidelity).toBe('function');
  });

  it('exports detectScopeDrift, extractSkillScope, extractObservedScope', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.detectScopeDrift).toBe('function');
    expect(typeof mod.extractSkillScope).toBe('function');
    expect(typeof mod.extractObservedScope).toBe('function');
  });

  it('exports checkTrainingCoherence', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.checkTrainingCoherence).toBe('function');
  });

  it('exports detectCopyingSignals', async () => {
    const mod = await import('./index.js');
    expect(typeof mod.detectCopyingSignals).toBe('function');
  });

  it('exports type constants', async () => {
    const mod = await import('./index.js');
    expect(mod.FAMILIARITY_TIERS).toHaveLength(4);
    expect(mod.DERIVED_CHECK_SEVERITIES).toHaveLength(3);
  });

  it('integration: full derived check through barrel API', async () => {
    const { checkDerived } = await import('./index.js');

    const result = checkDerived({
      artifactId: 'skill:test-derived',
      lineageEntries: [
        {
          artifactId: 'obs:session-1',
          artifactType: 'observation',
          stage: 'capture',
          inputs: [],
          outputs: ['skill:test-derived'],
          metadata: { familiarityTier: 'home' },
          timestamp: new Date().toISOString(),
        } as LineageEntry,
        {
          artifactId: 'skill:test-derived',
          artifactType: 'candidate',
          stage: 'detection',
          inputs: ['obs:session-1'],
          outputs: [],
          metadata: { familiarityTier: 'home' },
          timestamp: new Date().toISOString(),
        } as LineageEntry,
      ],
      skillBody: '## Testing\nRun `npm test` and `npx vitest` for testing.\n## Vitest Config\nEdit `vitest.config.ts` and run `npx vitest` in Bash.',
      observationEvidence: {
        observedCommands: ['npm test', 'npx vitest'],
        observedFiles: ['vitest.config.ts'],
        observedTools: ['Bash'],
        observedPatterns: ['testing workflow'],
      },
      skillScope: ['npm', 'vitest', 'testing'],
      observedScope: ['npm', 'vitest', 'testing', 'bash'],
    });

    expect(result.passed).toBe(true);
    expect(result.provenance.nodes.length).toBe(2);
    expect(result.provenance.inheritedTier).toBe('home');
    expect(result.phantomFindings).toEqual([]);
    expect(result.scopeDriftFindings).toEqual([]);
    expect(result.coherenceFindings).toEqual([]);
    expect(result.copyingFindings).toEqual([]);
  });
});
