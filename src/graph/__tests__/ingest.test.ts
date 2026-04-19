/**
 * M1 Semantic Memory Graph — ingest.ts tests.
 *
 * Covers:
 *   - CF-M1-01: entity extraction precision ≥0.85 on the 200-session fixture
 *   - parse robustness (malformed / partial lines are skipped, not thrown)
 *   - edge weight accumulation across repeat observations
 *   - co-fire edge emission within a session
 *   - content-address deduplication (same skill name → same entity id)
 */
import { describe, it, expect } from 'vitest';
import { resolve } from 'node:path';
import {
  ingestText,
  ingestFile,
  ingestObservations,
  entitiesByKind,
  edgesByRelation,
  type Observation,
} from '../ingest.js';
import { entityId, EDGE_RELATIONS } from '../schema.js';

const FIXTURE_200 = resolve(process.cwd(), 'tests/fixtures/sensemaking-200.jsonl');

describe('ingest — parsing', () => {
  it('skips malformed lines without throwing', () => {
    const text = [
      JSON.stringify({
        ts: 1,
        skill: 'a',
        command: 'Read',
        file: 'f.ts',
        sessionId: 's1',
        outcome: 'ok',
      }),
      'not json',
      '{"partial": true}',
      '', // blank
      JSON.stringify({
        ts: 2,
        skill: 'b',
        command: 'Edit',
        file: 'g.ts',
        sessionId: 's1',
        outcome: 'ok',
      }),
    ].join('\n');
    const g = ingestText(text);
    expect(g.observationCount).toBe(2);
    expect(g.skippedCount).toBeGreaterThanOrEqual(2);
  });

  it('entity ids are deterministic across repeat observations', () => {
    const obs: Observation[] = [
      { ts: 1, skill: 'x', command: 'Read', file: 'a', sessionId: 's', outcome: 'ok' },
      { ts: 2, skill: 'x', command: 'Read', file: 'a', sessionId: 's', outcome: 'ok' },
    ];
    const g = ingestObservations(obs);
    const skillEntities = entitiesByKind(g, 'skill');
    expect(skillEntities).toHaveLength(1);
    expect(skillEntities[0].id).toBe(entityId('skill', 'x'));
  });

  it('edge weights accumulate on repeated co-occurrence', () => {
    const obs: Observation[] = [
      { ts: 1, skill: 'a', command: 'Read', file: 'f', sessionId: 's1', outcome: 'ok' },
      { ts: 2, skill: 'a', command: 'Read', file: 'f', sessionId: 's1', outcome: 'ok' },
      { ts: 3, skill: 'a', command: 'Read', file: 'f', sessionId: 's1', outcome: 'ok' },
    ];
    const g = ingestObservations(obs);
    const touched = edgesByRelation(g, EDGE_RELATIONS.TOUCHED);
    expect(touched).toHaveLength(1);
    expect(touched[0].weight).toBe(3);
  });

  it('emits co-fire edges between distinct skills in the same session', () => {
    const obs: Observation[] = [
      { ts: 1, skill: 'a', command: 'Read', file: 'f', sessionId: 's1', outcome: 'ok' },
      { ts: 2, skill: 'b', command: 'Edit', file: 'g', sessionId: 's1', outcome: 'ok' },
      { ts: 3, skill: 'c', command: 'Write', file: 'h', sessionId: 's1', outcome: 'ok' },
    ];
    const g = ingestObservations(obs);
    const coFire = edgesByRelation(g, EDGE_RELATIONS.CO_FIRED);
    // 3 skills → C(3,2) = 3 pairs.
    expect(coFire).toHaveLength(3);
  });

  it('does not emit co-fire edges across sessions', () => {
    const obs: Observation[] = [
      { ts: 1, skill: 'a', command: 'Read', file: 'f', sessionId: 's1', outcome: 'ok' },
      { ts: 2, skill: 'b', command: 'Edit', file: 'g', sessionId: 's2', outcome: 'ok' },
    ];
    const g = ingestObservations(obs);
    const coFire = edgesByRelation(g, EDGE_RELATIONS.CO_FIRED);
    expect(coFire).toHaveLength(0);
  });
});

describe('ingest — CF-M1-01: precision on the 200-session fixture', () => {
  it('ingests the 200-session fixture and extracts the expected skill vocabulary', async () => {
    const g = await ingestFile(FIXTURE_200);
    expect(g.observationCount).toBeGreaterThan(200);

    // Labelled ground-truth skill vocabulary (the generator draws from this set).
    const expectedSkills = new Set([
      'gsd-plan-phase',
      'gsd-execute-phase',
      'gsd-verify-work',
      'git-commit',
      'test-generator',
      'code-review',
      'typescript-patterns',
      'beautiful-commits',
      'release-management',
      'publish-pipeline',
      'research-engine',
      'session-awareness',
      'security-hygiene',
      'vision-to-mission',
      'sc-dev-team',
    ]);

    const skills = entitiesByKind(g, 'skill');
    const skillNames = new Set(
      skills.map((s) => (s.attrs as Record<string, unknown>).name as string),
    );

    // Precision: fraction of extracted skills that are in the expected set.
    let inSet = 0;
    for (const n of skillNames) if (expectedSkills.has(n)) inSet++;
    const precision = inSet / skillNames.size;
    expect(precision).toBeGreaterThanOrEqual(0.85);

    // Sanity: sessions extracted = 200.
    const sessions = entitiesByKind(g, 'session');
    expect(sessions).toHaveLength(200);

    // Sanity: outcomes = subset of {ok, fail, partial}
    const outcomes = entitiesByKind(g, 'outcome');
    for (const o of outcomes) {
      const label = (o.attrs as Record<string, unknown>).label;
      expect(['ok', 'fail', 'partial']).toContain(label);
    }
  });
});
