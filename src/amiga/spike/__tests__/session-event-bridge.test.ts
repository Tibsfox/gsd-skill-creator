/**
 * Spike regression: locks the SessionObservation -> AMIGA seam.
 *
 * Deterministic and platform-agnostic on purpose -- it builds an in-memory
 * TranscriptSession (no disk, no ~/.claude reads, no fs/path) so it stays green
 * on all three now-load-bearing CI OS legs. The runner
 * (tools/spike-amiga-revive.mjs) is what reads real transcripts; this test
 * proves the bridge + the dormant src/amiga consumers agree on the contract.
 */

import { describe, it, expect } from 'vitest';

import { SessionEventBridge } from '../session-event-bridge.js';
import type { TranscriptSession } from '../session-event-bridge.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';
import { LedgerEntryPayloadSchema } from '../../icd/icd-02.js';
import { SkillCandidateDetector } from '../../meta-mission/skill-candidate-detector.js';
import { InvocationRecorder } from '../../ce1/invocation-recorder.js';
import { AttributionLedger } from '../../ce1/attribution-ledger.js';
import { WeightingEngine } from '../../ce1/weighting-engine.js';

/** A small but realistic ordered tool stream (mixed tools, repeated bigrams). */
function sampleSession(): TranscriptSession {
  const order = ['Bash', 'Read', 'Edit', 'Bash', 'Edit', 'Read', 'Bash', 'Write', 'Edit', 'Bash'];
  const startMs = Date.parse('2026-05-28T10:00:00.000Z');
  return {
    sessionId: 'test-session-0001',
    startMs,
    endMs: startMs + 60_000,
    tools: order.map((tool) => ({ tool })),
  };
}

describe('SessionEventBridge (amiga revive spike seam)', () => {
  const bridge = new SessionEventBridge();
  const session = sampleSession();

  it('mints a mission log with telemetry bookends and one LEDGER_ENTRY per tool-use', () => {
    const log = bridge.toMissionLog(session, 1);
    expect(log[0].type).toBe('TELEMETRY_UPDATE');
    expect(log[0].payload.phase).toBe('BRIEFING');
    expect(log[log.length - 1].type).toBe('TELEMETRY_UPDATE');
    expect(log[log.length - 1].payload.phase).toBe('COMPLETION');
    const ledger = log.filter((e) => e.type === 'LEDGER_ENTRY');
    expect(ledger.length).toBe(session.tools.length);
  });

  it('produces envelopes that pass EventEnvelopeSchema and payloads that pass ICD-02', () => {
    const log = bridge.toMissionLog(session, 1);
    for (const env of log) {
      expect(EventEnvelopeSchema.safeParse(env).success).toBe(true);
    }
    for (const env of log.filter((e) => e.type === 'LEDGER_ENTRY')) {
      expect(LedgerEntryPayloadSchema.safeParse(env.payload).success).toBe(true);
    }
  });

  it('uses a MissionIDSchema-valid mission id derived from the session start', () => {
    const log = bridge.toMissionLog(session, 7);
    const mid = String((log.find((e) => e.type === 'LEDGER_ENTRY')!.payload as Record<string, unknown>).mission_id);
    expect(mid).toBe('mission-2026-05-28-007');
  });

  it('feeds the dormant SkillCandidateDetector to at least one candidate (mission log)', () => {
    const log = bridge.toMissionLog(session, 1);
    const detector = new SkillCandidateDetector();
    detector.enrichWithAttribution(SessionEventBridge.buildDraft(log));
    const result = detector.analyze(log);
    expect(result.has_candidates).toBe(true);
    // attribution_cluster fires because distinct tool-contributors span adjacent phases.
    expect(result.candidates.some((c) => c.detection_method === 'attribution_cluster')).toBe(true);
    // every evidence id traces back to a real event in the log.
    const ids = new Set(log.map((e) => e.id));
    for (const c of result.candidates) {
      for (const ev of c.evidence) expect(ids.has(ev)).toBe(true);
    }
  });

  it('surfaces real tool-workflow cycles from the tool-sequence view', () => {
    const seqLog = bridge.toToolSequenceLog(session, 1);
    const result = new SkillCandidateDetector().analyze(seqLog);
    expect(result.has_candidates).toBe(true);
    // e.g. bash-to-edit / edit-to-bash bigrams repeat in the sample stream.
    expect(result.candidates.every((c) => c.detection_method === 'sequence_repetition')).toBe(true);
    expect(result.candidates.every((c) => /^[a-z][a-z0-9-]+$/.test(c.name))).toBe(true);
  });

  it('records CE-1 attribution and computes a normalized weight vector', () => {
    const log = bridge.toMissionLog(session, 1);
    const mid = String((log.find((e) => e.type === 'LEDGER_ENTRY')!.payload as Record<string, unknown>).mission_id);

    const attribution = new AttributionLedger();
    const recorder = new InvocationRecorder({ ledger: attribution });
    recorder.start();
    for (const env of log) recorder.handleEvent(env);

    const stats = recorder.getStats();
    expect(stats.ledgerEntriesCaptured).toBe(session.tools.length);
    expect(stats.errors).toBe(0);

    const weights = new WeightingEngine().calculateWeights(attribution.query({ mission_id: mid }));
    expect(weights.weights.length).toBeGreaterThan(0);
    const sum = weights.weights.reduce((acc, w) => acc + w.weight, 0);
    expect(sum).toBeCloseTo(1.0, 6);
    // bash is the most-used tool in the sample, so it should carry the top weight.
    expect(weights.weights[0].contributorId).toBe('contrib-tool-bash');
  });
});
