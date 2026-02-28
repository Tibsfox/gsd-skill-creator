/**
 * TDD tests for MFE observation feed.
 *
 * Tests capture, hash, persistence, and query of problem-solving episodes.
 *
 * @module integration/observation-feed.test
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import type { DomainId, PlanePosition, CompositionStep } from '../core/types/mfe-types.js';

// Will be implemented in observation-feed.ts
import {
  createObservationFeed,
  type ObservationFeed,
  type ObservationInput,
} from './observation-feed.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePosition(real = 0.5, imaginary = -0.3): PlanePosition {
  return { real, imaginary };
}

function makeStep(n: number): CompositionStep {
  return {
    stepNumber: n,
    primitive: `perception-primitive-${n}`,
    action: `apply step ${n}`,
    justification: `because of axiom ${n}`,
    inputType: 'number',
    outputType: 'number',
    verificationStatus: 'passed',
  };
}

function makeInput(overrides: Partial<ObservationInput> = {}): ObservationInput {
  return {
    problemDescription: 'Calculate the hypotenuse of a right triangle',
    planePosition: makePosition(),
    domainsActivated: ['perception'] as DomainId[],
    primitivesUsed: ['perception-pythagorean-theorem'],
    compositionPath: [makeStep(1)],
    verificationResult: 'passed',
    userFeedback: 'positive',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ObservationFeed', () => {
  let tmpDir: string;
  let feed: ObservationFeed;

  beforeEach(async () => {
    tmpDir = await mkdtemp(join(tmpdir(), 'obs-feed-'));
  });

  afterEach(async () => {
    await rm(tmpDir, { recursive: true, force: true });
  });

  // =========================================================================
  // 1. Problem hash generation
  // =========================================================================

  describe('Problem hash generation', () => {
    beforeEach(() => {
      feed = createObservationFeed({
        outputPath: join(tmpDir, 'observations.jsonl'),
      });
    });

    it('produces deterministic hash for same input + position', async () => {
      const obs1 = await feed.record(makeInput());
      const obs2 = await feed.record(makeInput());
      expect(obs1.problemHash).toBe(obs2.problemHash);
    });

    it('produces different hashes for different inputs', async () => {
      const obs1 = await feed.record(makeInput());
      const obs2 = await feed.record(
        makeInput({ problemDescription: 'Find the area of a circle' }),
      );
      expect(obs1.problemHash).not.toBe(obs2.problemHash);
    });

    it('produces a non-empty hex string', async () => {
      const obs = await feed.record(makeInput());
      expect(obs.problemHash).toBeTruthy();
      expect(obs.problemHash.length).toBeGreaterThan(0);
      // Hex string pattern
      expect(obs.problemHash).toMatch(/^[0-9a-f]+$/);
    });

    it('is idempotent across calls', async () => {
      const obs1 = await feed.record(makeInput());
      const obs2 = await feed.record(makeInput());
      const obs3 = await feed.record(makeInput());
      expect(obs1.problemHash).toBe(obs2.problemHash);
      expect(obs2.problemHash).toBe(obs3.problemHash);
    });
  });

  // =========================================================================
  // 2. Observation recording
  // =========================================================================

  describe('Observation recording', () => {
    beforeEach(() => {
      feed = createObservationFeed({
        outputPath: join(tmpDir, 'observations.jsonl'),
      });
    });

    it('returns an MFEObservation with all fields populated', async () => {
      const obs = await feed.record(makeInput());
      expect(obs.problemHash).toBeTruthy();
      expect(obs.planePosition).toEqual(makePosition());
      expect(obs.domainsActivated).toEqual(['perception']);
      expect(obs.primitivesUsed).toEqual(['perception-pythagorean-theorem']);
      expect(obs.compositionPath).toHaveLength(1);
      expect(obs.verificationResult).toBe('passed');
      expect(obs.userFeedback).toBe('positive');
      expect(obs.timestamp).toBeTruthy();
      expect(obs.sessionId).toBeTruthy();
    });

    it('rejects empty primitivesUsed array', async () => {
      await expect(
        feed.record(makeInput({ primitivesUsed: [] })),
      ).rejects.toThrow(/primitivesUsed/i);
    });

    it('rejects empty domainsActivated array', async () => {
      await expect(
        feed.record(makeInput({ domainsActivated: [] as DomainId[] })),
      ).rejects.toThrow(/domainsActivated/i);
    });

    it('rejects invalid verificationResult values', async () => {
      await expect(
        feed.record(
          makeInput({ verificationResult: 'invalid' as never }),
        ),
      ).rejects.toThrow(/verificationResult/i);
    });

    it('populates timestamp as ISO 8601 and sessionId', async () => {
      const obs = await feed.record(makeInput());
      // ISO 8601 pattern: YYYY-MM-DDTHH:MM:SS.sssZ
      expect(obs.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
      expect(obs.sessionId).toBeTruthy();
      expect(typeof obs.sessionId).toBe('string');
    });
  });

  // =========================================================================
  // 3. Persistence
  // =========================================================================

  describe('Persistence', () => {
    it('appends observation as single-line JSON to JSONL path', async () => {
      const outPath = join(tmpDir, 'observations.jsonl');
      feed = createObservationFeed({ outputPath: outPath });

      await feed.record(makeInput());
      const content = await readFile(outPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(1);

      const parsed = JSON.parse(lines[0]);
      expect(parsed.problemHash).toBeTruthy();
      expect(parsed.planePosition).toEqual(makePosition());
    });

    it('produces one line per record call (append-only)', async () => {
      const outPath = join(tmpDir, 'observations.jsonl');
      feed = createObservationFeed({ outputPath: outPath });

      await feed.record(makeInput());
      await feed.record(makeInput({ problemDescription: 'Find area' }));
      await feed.record(makeInput({ problemDescription: 'Solve integral' }));

      const content = await readFile(outPath, 'utf-8');
      const lines = content.trim().split('\n');
      expect(lines).toHaveLength(3);

      // Each line is valid JSON
      for (const line of lines) {
        expect(() => JSON.parse(line)).not.toThrow();
      }
    });

    it('creates directory if it does not exist', async () => {
      const deepPath = join(tmpDir, 'nested', 'dir', 'observations.jsonl');
      feed = createObservationFeed({ outputPath: deepPath });

      await feed.record(makeInput());
      const content = await readFile(deepPath, 'utf-8');
      expect(content.trim()).toBeTruthy();
    });
  });

  // =========================================================================
  // 4. Query
  // =========================================================================

  describe('Query', () => {
    beforeEach(() => {
      feed = createObservationFeed({
        outputPath: join(tmpDir, 'observations.jsonl'),
      });
    });

    it('getObservations returns all recorded observations', async () => {
      await feed.record(makeInput());
      await feed.record(makeInput({ problemDescription: 'Find area' }));

      const all = await feed.getObservations();
      expect(all).toHaveLength(2);
    });

    it('getObservationsByHash filters by problem hash', async () => {
      const obs1 = await feed.record(makeInput());
      await feed.record(makeInput({ problemDescription: 'Find area' }));
      await feed.record(makeInput()); // Same hash as obs1

      const filtered = await feed.getObservationsByHash(obs1.problemHash);
      expect(filtered).toHaveLength(2);
      for (const obs of filtered) {
        expect(obs.problemHash).toBe(obs1.problemHash);
      }
    });
  });
});
