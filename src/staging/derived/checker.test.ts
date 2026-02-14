/**
 * Tests for unified derived knowledge checker.
 *
 * @module staging/derived/checker.test
 */

import { describe, it, expect } from 'vitest';
import { checkDerived } from './checker.js';
import type { DerivedCheckInput } from './checker.js';
import type { LineageEntry } from '../../types/observation.js';
import type { ObservationEvidence } from './pattern-fidelity.js';

/**
 * Helper to build a minimal DerivedCheckInput with defaults.
 */
function makeInput(overrides: Partial<DerivedCheckInput> = {}): DerivedCheckInput {
  return {
    artifactId: 'skill:test-checker',
    lineageEntries: [
      {
        artifactId: 'obs:session-1',
        artifactType: 'observation',
        stage: 'capture',
        inputs: [],
        outputs: ['skill:test-checker'],
        metadata: { familiarityTier: 'home' },
        timestamp: new Date().toISOString(),
      } as LineageEntry,
      {
        artifactId: 'skill:test-checker',
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
    ...overrides,
  };
}

describe('checkDerived', () => {
  it('returns passing result when all checks pass', () => {
    const input = makeInput();
    const result = checkDerived(input);

    expect(result.passed).toBe(true);
    expect(result.artifactId).toBe('skill:test-checker');
    expect(result.phantomFindings).toEqual([]);
    expect(result.scopeDriftFindings).toEqual([]);
    expect(result.coherenceFindings).toEqual([]);
    expect(result.copyingFindings).toEqual([]);
    expect(result.provenance.nodes.length).toBe(2);
  });

  it('returns failing result when phantom content detected', () => {
    const input = makeInput({
      // Skill body references completely unseen tools/commands
      skillBody: '## Docker Setup\nRun `docker compose up` to start services.\n## Kubernetes\nDeploy with `kubectl apply -f manifest.yaml`.',
      observationEvidence: {
        observedCommands: ['npm test'],
        observedFiles: ['package.json'],
        observedTools: ['Bash'],
        observedPatterns: ['testing'],
      },
    });

    const result = checkDerived(input);

    expect(result.passed).toBe(false);
    expect(result.phantomFindings.length).toBeGreaterThan(0);
    expect(result.phantomFindings[0].type).toBe('phantom');
  });

  it('returns failing result when scope drift detected', () => {
    const input = makeInput({
      // Skill claims coverage of many things not observed
      skillScope: ['docker', 'kubernetes', 'terraform', 'aws', 'npm', 'vitest'],
      observedScope: ['npm', 'vitest'],
    });

    const result = checkDerived(input);

    expect(result.passed).toBe(false);
    expect(result.scopeDriftFindings.length).toBeGreaterThan(0);
    expect(result.scopeDriftFindings[0].type).toBe('scope-drift');
    expect(result.scopeDriftFindings[0].driftRatio).toBeGreaterThan(0.3);
  });

  it('returns failing result when training pairs have anomalies', () => {
    const input = makeInput({
      trainingPairs: [
        { input: 'How do I run tests?', output: 'Run npm test in the project root.' },
        { input: 'How do I lint code?', output: 'Run npm run lint to check for issues.' },
        { input: 'How do I deploy?', output: 'Run npm run deploy to push to production server.' },
        {
          input: 'How do I run tests?',
          output: 'How do I run tests?', // Copy-paste: too similar
        },
      ],
    });

    const result = checkDerived(input);

    expect(result.passed).toBe(false);
    expect(result.coherenceFindings.length).toBeGreaterThan(0);
    expect(result.coherenceFindings[0].type).toBe('coherence');
  });

  it('returns failing result when copying detected', () => {
    const longText = 'This is a comprehensive guide to deploying applications with Docker containers in production environments, including orchestration with Kubernetes and monitoring with Prometheus and Grafana dashboards.';
    const input = makeInput({
      skillBody: `## Deployment\n${longText}\n## Notes\nAlways verify before pushing.`,
      referenceTexts: [longText],
    });

    const result = checkDerived(input);

    expect(result.passed).toBe(false);
    expect(result.copyingFindings.length).toBeGreaterThan(0);
    expect(result.copyingFindings[0].type).toBe('copying');
  });

  it('passed is true when only info-level findings exist', () => {
    // Scope drift with low ratio (<=0.3) produces info-level findings.
    // 1 out of 5 items unsupported = 0.2 drift ratio = info severity.
    const input = makeInput({
      skillScope: ['npm', 'vitest', 'testing', 'bash', 'eslint'],
      observedScope: ['npm', 'vitest', 'testing', 'bash'],
    });

    const result = checkDerived(input);

    // Should have a scope drift finding with info severity
    expect(result.scopeDriftFindings.length).toBe(1);
    expect(result.scopeDriftFindings[0].severity).toBe('info');

    // No critical or warning findings anywhere
    const allFindings = [
      ...result.phantomFindings,
      ...result.scopeDriftFindings,
      ...result.coherenceFindings,
      ...result.copyingFindings,
    ];
    const hasCriticalOrWarning = allFindings.some(
      f => f.severity === 'critical' || f.severity === 'warning',
    );
    expect(hasCriticalOrWarning).toBe(false);

    // passed should be true since only info findings exist
    expect(result.passed).toBe(true);
  });

  it('provenance chain is populated from lineage entries', () => {
    const input = makeInput();
    const result = checkDerived(input);

    expect(result.provenance.nodes.length).toBe(2);
    expect(result.provenance.artifactId).toBe('skill:test-checker');
    expect(result.provenance.inheritedTier).toBe('home');

    // Root node (observation) should be first
    expect(result.provenance.nodes[0].artifactId).toBe('obs:session-1');
    expect(result.provenance.nodes[0].tier).toBe('home');

    // Leaf node (candidate) should be last
    expect(result.provenance.nodes[1].artifactId).toBe('skill:test-checker');
  });

  it('skips training coherence when no training pairs provided', () => {
    const input = makeInput();
    // No trainingPairs property set (undefined)
    delete (input as unknown as Record<string, unknown>).trainingPairs;

    const result = checkDerived(input);

    expect(result.coherenceFindings).toEqual([]);
  });

  it('skips copying detection when no reference texts provided', () => {
    const input = makeInput();
    // No referenceTexts property set (undefined)
    delete (input as unknown as Record<string, unknown>).referenceTexts;

    const result = checkDerived(input);

    expect(result.copyingFindings).toEqual([]);
  });

  it('aggregates findings from all checkers', () => {
    const longRefText = 'This is a comprehensive guide to deploying applications with Docker containers in production environments, including orchestration with Kubernetes and monitoring with Prometheus and Grafana dashboards.';

    const input = makeInput({
      // Phantom: unseen commands in skill body
      skillBody: `## Docker Setup\nRun \`docker compose up\` for containers.\n## Kubernetes\nDeploy with \`kubectl apply\`.\n## Testing\nRun \`npm test\` for tests.`,
      observationEvidence: {
        observedCommands: ['npm test'],
        observedFiles: ['package.json'],
        observedTools: ['Bash'],
        observedPatterns: ['testing workflow'],
      },
      // Scope drift: many unsupported items
      skillScope: ['docker', 'kubernetes', 'terraform', 'npm'],
      observedScope: ['npm'],
      // Training pair anomaly
      trainingPairs: [
        { input: 'How do I test?', output: 'Run npm test.' },
        { input: 'How do I lint?', output: 'Run npm lint.' },
        { input: 'How do I build?', output: 'Run npm build.' },
        { input: 'How do I test?', output: 'How do I test?' }, // copy-paste
      ],
      // Copying: verbatim match
      referenceTexts: [longRefText],
    });

    const result = checkDerived(input);

    expect(result.passed).toBe(false);

    // Should have findings from multiple checkers
    const findingCategories = [
      result.phantomFindings.length > 0,
      result.scopeDriftFindings.length > 0,
      result.coherenceFindings.length > 0,
    ];

    // At least 2 different finding categories should be populated
    const populatedCategories = findingCategories.filter(Boolean).length;
    expect(populatedCategories).toBeGreaterThanOrEqual(2);
  });
});
