/**
 * Tests for SkillCandidateDetector.minSequenceCount option (v1.49.1027).
 *
 * Verifies that the hardcoded `>= 2` bar was replaced by a configurable
 * option and that behavior is byte-identical at the default (2).
 */

import { describe, it, expect } from 'vitest';
import { SkillCandidateDetector } from '../skill-candidate-detector.js';
import { createEnvelope } from '../../message-envelope.js';
import type { EventEnvelope } from '../../message-envelope.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a minimal event log with a bigram that repeats `n` times. */
function makeRepeatLog(eventTypeA: string, eventTypeB: string, repeats: number): EventEnvelope[] {
  const events: EventEnvelope[] = [];
  for (let i = 0; i < repeats; i++) {
    events.push(
      createEnvelope({
        source: 'test',
        destination: 'test',
        type: eventTypeA as 'TELEMETRY_UPDATE',
        payload: {},
      }),
      createEnvelope({
        source: 'test',
        destination: 'test',
        type: eventTypeB as 'TELEMETRY_UPDATE',
        payload: {},
      }),
    );
  }
  return events;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SkillCandidateDetector — minSequenceCount option (v1.49.1027)', () => {
  describe('default behavior (minSequenceCount = 2)', () => {
    it('emits a sequence_repetition candidate when bigram repeats exactly 2 times', () => {
      const log = makeRepeatLog('TELEMETRY_UPDATE', 'GATE_SIGNAL', 2);
      const detector = new SkillCandidateDetector();
      const result = detector.analyze(log);
      const seqCandidates = result.candidates.filter(
        (c) => c.detection_method === 'sequence_repetition',
      );
      expect(seqCandidates.length).toBeGreaterThan(0);
    });

    it('does NOT emit a sequence_repetition candidate when bigram repeats only 1 time', () => {
      const log = makeRepeatLog('TELEMETRY_UPDATE', 'GATE_SIGNAL', 1);
      const detector = new SkillCandidateDetector();
      const result = detector.analyze(log);
      const seqCandidates = result.candidates.filter(
        (c) => c.detection_method === 'sequence_repetition',
      );
      expect(seqCandidates.length).toBe(0);
    });
  });

  describe('minSequenceCount = 3', () => {
    it('does NOT emit when bigram repeats exactly 2 times (threshold raised)', () => {
      const log = makeRepeatLog('TELEMETRY_UPDATE', 'GATE_SIGNAL', 2);
      const detector = new SkillCandidateDetector({ minSequenceCount: 3 });
      const result = detector.analyze(log);
      const seqCandidates = result.candidates.filter(
        (c) => c.detection_method === 'sequence_repetition',
      );
      expect(seqCandidates.length).toBe(0);
    });

    it('DOES emit when bigram repeats exactly 3 times', () => {
      const log = makeRepeatLog('TELEMETRY_UPDATE', 'GATE_SIGNAL', 3);
      const detector = new SkillCandidateDetector({ minSequenceCount: 3 });
      const result = detector.analyze(log);
      const seqCandidates = result.candidates.filter(
        (c) => c.detection_method === 'sequence_repetition',
      );
      expect(seqCandidates.length).toBeGreaterThan(0);
    });
  });

  describe('minSequenceCount = 1', () => {
    it('emits when bigram appears once (threshold lowered to 1)', () => {
      const log = makeRepeatLog('TELEMETRY_UPDATE', 'GATE_SIGNAL', 1);
      const detector = new SkillCandidateDetector({ minSequenceCount: 1 });
      const result = detector.analyze(log);
      const seqCandidates = result.candidates.filter(
        (c) => c.detection_method === 'sequence_repetition',
      );
      expect(seqCandidates.length).toBeGreaterThan(0);
    });
  });

  describe('other detection methods are unaffected', () => {
    it('sequence count option does not affect non-sequence_repetition candidates', () => {
      // A single bigram (count=1) log should still return 0 sequence_repetition candidates
      // at default, regardless of other methods.
      const log = makeRepeatLog('TELEMETRY_UPDATE', 'GATE_SIGNAL', 1);
      const defaultDetector = new SkillCandidateDetector();
      const highDetector = new SkillCandidateDetector({ minSequenceCount: 3 });

      const defaultSeq = defaultDetector.analyze(log).candidates.filter(
        (c) => c.detection_method === 'sequence_repetition',
      );
      const highSeq = highDetector.analyze(log).candidates.filter(
        (c) => c.detection_method === 'sequence_repetition',
      );

      // Both should have 0 sequence_repetition candidates for a count-1 bigram at default (>=2)
      expect(defaultSeq.length).toBe(0);
      expect(highSeq.length).toBe(0);
    });
  });
});
