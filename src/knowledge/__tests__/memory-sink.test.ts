import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { MemoryService } from '../../memory/service.js';
import { LearningPatternDetector, type LearningPatternSuggestion } from '../learning-pattern-detector.js';
import { ObservationEmitter } from '../observation-hooks.js';
import { MemorySink, createMemorySink, patternToMemoryRecord } from '../memory-sink.js';
import type { LearnerObservation } from '../observation-types.js';

function completion(overrides: Partial<LearnerObservation> = {}): LearnerObservation {
  const base = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    learnerId: 'learner-1',
    packId: 'MATH-101',
    kind: 'activity_completion' as const,
    activityId: 'A1',
    moduleId: 'M1',
    durationMinutes: 30,
    completed: true,
  };
  return { ...base, ...overrides } as LearnerObservation;
}

/** 3 learners, 2 packs, consistent M1->M2->M3 sequence — a promotable pattern. */
function sequenceObservations(): LearnerObservation[] {
  const obs: LearnerObservation[] = [];
  const plan: Array<[string, string]> = [
    ['learner-1', 'MATH-101'],
    ['learner-2', 'MATH-101'],
    ['learner-3', 'SCI-101'],
  ];
  for (const [learnerId, packId] of plan) {
    for (const moduleId of ['M1', 'M2', 'M3']) {
      obs.push(completion({ learnerId, packId, moduleId, activityId: `${moduleId}-A1` }));
    }
  }
  return obs;
}

describe('patternToMemoryRecord', () => {
  const suggestion: LearningPatternSuggestion = {
    id: 'lp-sequence-m1-m2-m3',
    type: 'sequence',
    description: 'Learners follow module sequence: M1->M2->M3',
    packIds: ['MATH-101', 'SCI-101'],
    evidenceCount: 3,
    confidence: 1.0,
    details: { moduleSequence: ['M1', 'M2', 'M3'] },
    suggestedSkillName: 'sequence-pattern-m1-m2-m3',
    suggestedDescription: 'Skill to maintain consistent module ordering.',
    applicablePacks: ['MATH-101', 'SCI-101'],
  };

  it('maps a mined pattern to a lesson memory record', () => {
    const record = patternToMemoryRecord(suggestion);
    expect(record.type).toBe('lesson');
    expect(record.name).toBe('sequence-pattern-m1-m2-m3');
    expect(record.description).toBe('Skill to maintain consistent module ordering.');
    expect(record.provenance.scope).toBe('domain');
    expect(record.provenance.visibility).toBe('internal');
    expect(record.provenance.domains).toEqual(['MATH-101', 'SCI-101']);
    expect(record.temporalClass).toBe('durable');
    expect(record.tags).toContain('learning-pattern');
    expect(record.content).toContain('M1->M2->M3');
  });

  it('derives a stable id (idempotent) and valid UUID shape', () => {
    const a = patternToMemoryRecord(suggestion);
    const b = patternToMemoryRecord(suggestion);
    expect(a.id).toBe(b.id);
    expect(a.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('MemorySink', () => {
  let dir: string;
  let service: MemoryService;

  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), 'mem-sink-'));
    service = new MemoryService({ memoryDir: dir, indexFile: 'MEMORY.md' });
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('promotes a mined pattern into a retrievable lesson memory', async () => {
    const detector = new LearningPatternDetector({ minOccurrences: 3, minPacks: 2 });
    const sink = createMemorySink(service, detector);

    for (const obs of sequenceObservations()) sink.sink(obs);
    expect(sink.pending).toBe(9);

    const stored = await sink.flush();
    expect(stored.length).toBeGreaterThan(0);
    expect(stored[0].type).toBe('lesson');

    const response = await service.query('module ordering', { limit: 5 });
    expect(response.results.length).toBeGreaterThan(0);
    const lesson = response.results.find((r) => r.record.type === 'lesson');
    expect(lesson).toBeDefined();
    expect(lesson!.record.content).toContain('M1->M2->M3');
  });

  it('is idempotent — re-flushing the same buffer does not duplicate memories', async () => {
    const detector = new LearningPatternDetector({ minOccurrences: 3, minPacks: 2 });
    const sink = new MemorySink(service, detector);
    for (const obs of sequenceObservations()) sink.sink(obs);

    const first = await sink.flush();
    const second = await sink.flush();
    expect(second.map((r) => r.id).sort()).toEqual(first.map((r) => r.id).sort());

    const stats = await service.getStats();
    expect(stats.typeCounts.lesson).toBe(first.length);
  });

  it('registers as an ObservationSink on an ObservationEmitter without auto-writing', async () => {
    const detector = new LearningPatternDetector({ minOccurrences: 3, minPacks: 2 });
    const sink = createMemorySink(service, detector);
    const emitter = new ObservationEmitter();
    emitter.addSink(sink.sink);

    emitter.emitActivityCompletion({
      learnerId: 'learner-1',
      packId: 'MATH-101',
      activityId: 'A1',
      moduleId: 'M1',
      durationMinutes: 30,
      completed: true,
    });

    // Buffered, not yet persisted (no auto-flush): no memory written.
    expect(sink.pending).toBe(1);
    const stats = await service.getStats();
    expect(stats.typeCounts.lesson).toBe(0);
  });
});
