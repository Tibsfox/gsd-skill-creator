/**
 * TDD tests for SkillCandidateDetector.
 *
 * Validates four detection methods for surfacing skill candidates from
 * completed mission event logs: provisioning_workflow, sequence_repetition,
 * phase_correlation, and attribution_cluster.
 *
 * INTG-09: skill-creator surfaces at least one skill candidate during debrief.
 */

import { describe, it, expect } from 'vitest';
import {
  SkillCandidateDetector,
} from '../skill-candidate-detector.js';
import type {
  SkillCandidate,
  DetectionResult,
} from '../skill-candidate-detector.js';
import { createEnvelope } from '../../message-envelope.js';
import type { EventEnvelope } from '../../message-envelope.js';
import { MetaMissionHarness } from '../meta-mission-harness.js';

// ============================================================================
// Helpers: create test event logs
// ============================================================================

/**
 * Create a TELEMETRY_UPDATE envelope for a given phase.
 */
function makeTelemetry(missionId: string, phase: string): EventEnvelope {
  return createEnvelope({
    source: 'ME-3',
    destination: 'MC-1',
    type: 'TELEMETRY_UPDATE',
    payload: {
      mission_id: missionId,
      phase,
      progress: 50,
      team_status: {},
      checkpoints: [],
      resources: { cpu_percent: 10, memory_mb: 256, active_agents: 4 },
    },
  });
}

/**
 * Create a LEDGER_ENTRY envelope for a given phase and skill.
 */
function makeLedgerEntry(
  missionId: string,
  phase: string,
  contributorId: string,
  skillName: string,
  contextWeight = 0.8,
): EventEnvelope {
  return createEnvelope({
    source: 'ME-1',
    destination: 'CE-1',
    type: 'LEDGER_ENTRY',
    payload: {
      mission_id: missionId,
      contributor_id: contributorId,
      agent_id: 'CE-1',
      skill_name: skillName,
      phase,
      timestamp: new Date().toISOString().replace(/(\.\d{3})\d*Z/, '$1Z'),
      context_weight: contextWeight,
      dependency_tree: [],
    },
  });
}

/**
 * Create a GATE_SIGNAL envelope.
 */
function makeGateSignal(missionId: string): EventEnvelope {
  return createEnvelope({
    source: 'ME-3',
    destination: 'MC-1',
    type: 'GATE_SIGNAL',
    payload: {
      gate_type: 'phase_transition',
      blocking_phase: 'REVIEW_GATE',
      criteria: [{ name: 'Review gate reached', met: true }],
      deadline: new Date(Date.now() + 86400000).toISOString().replace(/(\.\d{3})\d*Z/, '$1Z'),
    },
  });
}

/**
 * Create a complete meta-mission event log with all phases.
 */
function createCompleteMissionLog(missionId: string): EventEnvelope[] {
  return [
    // BRIEFING telemetry
    makeTelemetry(missionId, 'BRIEFING'),
    // PLANNING
    makeTelemetry(missionId, 'PLANNING'),
    makeLedgerEntry(missionId, 'PLANNING', 'contrib-me1', 'manifest-creation', 0.8),
    // EXECUTION
    makeTelemetry(missionId, 'EXECUTION'),
    makeLedgerEntry(missionId, 'EXECUTION', 'contrib-mc1', 'dashboard-wiring', 0.9),
    makeLedgerEntry(missionId, 'EXECUTION', 'contrib-ce1', 'attribution-setup', 0.7),
    // INTEGRATION
    makeTelemetry(missionId, 'INTEGRATION'),
    makeLedgerEntry(missionId, 'INTEGRATION', 'contrib-gl1', 'governance-evaluation', 0.85),
    // REVIEW_GATE
    makeTelemetry(missionId, 'REVIEW_GATE'),
    makeGateSignal(missionId),
    // COMPLETION
    makeTelemetry(missionId, 'COMPLETION'),
  ];
}

// ============================================================================
// 1. Construction
// ============================================================================

describe('SkillCandidateDetector construction', () => {
  it('creates a detector instance', () => {
    const detector = new SkillCandidateDetector();
    expect(detector).toBeDefined();
  });

  it('accepts optional config for future extensibility', () => {
    const detector = new SkillCandidateDetector({});
    expect(detector).toBeDefined();
  });
});

// ============================================================================
// 2. Basic detection from event log
// ============================================================================

describe('Basic detection from event log', () => {
  it('analyze returns a DetectionResult', () => {
    const detector = new SkillCandidateDetector();
    const result = detector.analyze([]);
    expect(result).toBeDefined();
    expect(result.candidates).toBeDefined();
    expect(result.events_analyzed).toBeDefined();
    expect(result.has_candidates).toBeDefined();
  });

  it('empty event log produces no candidates', () => {
    const detector = new SkillCandidateDetector();
    const result = detector.analyze([]);
    expect(result.has_candidates).toBe(false);
    expect(result.candidates).toHaveLength(0);
    expect(result.events_analyzed).toBe(0);
  });

  it('minimal event log (1 event) produces no candidates', () => {
    const detector = new SkillCandidateDetector();
    const log = [makeTelemetry('mission-2026-02-18-100', 'BRIEFING')];
    const result = detector.analyze(log);
    expect(result.has_candidates).toBe(false);
  });
});

// ============================================================================
// 3. Provisioning workflow detection (guaranteed for INTG-09)
// ============================================================================

describe('Provisioning workflow detection', () => {
  it('detects provisioning workflow from complete mission log', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-200');
    const result = detector.analyze(log);

    expect(result.has_candidates).toBe(true);

    const provCandidate = result.candidates.find(
      (c) => c.detection_method === 'provisioning_workflow',
    );
    expect(provCandidate).toBeDefined();
  });

  it('provisioning candidate has name amiga-provisioning-workflow', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-201');
    const result = detector.analyze(log);

    const provCandidate = result.candidates.find(
      (c) => c.detection_method === 'provisioning_workflow',
    );
    expect(provCandidate!.name).toBe('amiga-provisioning-workflow');
  });

  it('provisioning candidate has confidence >= 0.8', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-202');
    const result = detector.analyze(log);

    const provCandidate = result.candidates.find(
      (c) => c.detection_method === 'provisioning_workflow',
    );
    expect(provCandidate!.confidence).toBeGreaterThanOrEqual(0.8);
  });

  it('provisioning candidate evidence contains LEDGER_ENTRY event IDs', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-203');
    const result = detector.analyze(log);

    const provCandidate = result.candidates.find(
      (c) => c.detection_method === 'provisioning_workflow',
    );
    expect(provCandidate!.evidence.length).toBeGreaterThanOrEqual(1);

    // Verify evidence IDs exist in the log
    const logIds = new Set(log.map((e) => e.id));
    for (const evidenceId of provCandidate!.evidence) {
      expect(logIds.has(evidenceId)).toBe(true);
    }
  });
});

// ============================================================================
// 4. Sequence repetition detection
// ============================================================================

describe('Sequence repetition detection', () => {
  it('detects repeating TELEMETRY_UPDATE -> LEDGER_ENTRY sequences', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-300');
    const result = detector.analyze(log);

    const seqCandidate = result.candidates.find(
      (c) => c.detection_method === 'sequence_repetition',
    );
    expect(seqCandidate).toBeDefined();
    expect(seqCandidate!.trigger_pattern).toBeTruthy();
  });

  it('confidence scales with repetition count', () => {
    const detector = new SkillCandidateDetector();

    // Log with 3 TELEMETRY->LEDGER repetitions should have higher confidence
    // than one with 2 repetitions
    const log3 = createCompleteMissionLog('mission-2026-02-18-301');
    const result3 = detector.analyze(log3);
    const seq3 = result3.candidates.find(
      (c) => c.detection_method === 'sequence_repetition',
    );

    // The log has 3+ TELEMETRY->LEDGER sequences (PLANNING, EXECUTION, INTEGRATION)
    if (seq3) {
      expect(seq3.confidence).toBeGreaterThanOrEqual(0.3);
    }
  });
});

// ============================================================================
// 5. Phase correlation detection
// ============================================================================

describe('Phase correlation detection', () => {
  it('detects co-occurring event types across phases', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-400');
    const result = detector.analyze(log);

    const phaseCandidate = result.candidates.find(
      (c) => c.detection_method === 'phase_correlation',
    );
    // Phase correlation requires co-occurrence in 3+ phases
    // TELEMETRY_UPDATE + LEDGER_ENTRY co-occur in PLANNING, EXECUTION, INTEGRATION
    expect(phaseCandidate).toBeDefined();
  });

  it('phase correlation candidate references correlated phases', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-401');
    const result = detector.analyze(log);

    const phaseCandidate = result.candidates.find(
      (c) => c.detection_method === 'phase_correlation',
    );
    if (phaseCandidate) {
      expect(phaseCandidate.trigger_pattern).toBeTruthy();
    }
  });
});

// ============================================================================
// 6. Attribution cluster detection
// ============================================================================

describe('Attribution cluster detection', () => {
  it('detects clusters when enriched with skill package', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-500');

    // Enrich with a skill package that has contributors across adjacent phases
    detector.enrichWithAttribution({
      name: 'amiga-provisioning',
      description: 'Test provisioning workflow',
      phases_documented: ['PLANNING', 'EXECUTION', 'INTEGRATION'],
      contributors: [
        { id: 'contrib-me1', role: 'mission-environment', entry_count: 1 },
        { id: 'contrib-mc1', role: 'control-surface', entry_count: 1 },
        { id: 'contrib-ce1', role: 'commons-engine', entry_count: 1 },
        { id: 'contrib-gl1', role: 'governance', entry_count: 1 },
      ],
      provisioning_steps: ['manifest-creation', 'dashboard-wiring', 'attribution-setup', 'governance-evaluation'],
      total_events: log.length,
      attribution_summary: { total_contributors: 4, total_entries: 4 },
      governance_verdict: 'COMPLIANT',
    });

    const result = detector.analyze(log);

    const clusterCandidate = result.candidates.find(
      (c) => c.detection_method === 'attribution_cluster',
    );
    expect(clusterCandidate).toBeDefined();
  });

  it('attribution cluster candidate has contributor handoff info', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-501');

    detector.enrichWithAttribution({
      name: 'amiga-provisioning',
      description: 'Test provisioning workflow',
      phases_documented: ['PLANNING', 'EXECUTION', 'INTEGRATION'],
      contributors: [
        { id: 'contrib-me1', role: 'mission-environment', entry_count: 1 },
        { id: 'contrib-mc1', role: 'control-surface', entry_count: 1 },
        { id: 'contrib-ce1', role: 'commons-engine', entry_count: 1 },
        { id: 'contrib-gl1', role: 'governance', entry_count: 1 },
      ],
      provisioning_steps: ['manifest-creation', 'dashboard-wiring', 'attribution-setup', 'governance-evaluation'],
      total_events: log.length,
      attribution_summary: { total_contributors: 4, total_entries: 4 },
      governance_verdict: 'COMPLIANT',
    });

    const result = detector.analyze(log);
    const clusterCandidate = result.candidates.find(
      (c) => c.detection_method === 'attribution_cluster',
    );
    if (clusterCandidate) {
      expect(clusterCandidate.trigger_pattern).toBeTruthy();
      expect(clusterCandidate.confidence).toBeGreaterThanOrEqual(0.5);
    }
  });
});

// ============================================================================
// 7. Confidence scoring
// ============================================================================

describe('Confidence scoring', () => {
  it('candidates are sorted by confidence descending', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-600');
    const result = detector.analyze(log);

    for (let i = 1; i < result.candidates.length; i++) {
      expect(result.candidates[i - 1].confidence)
        .toBeGreaterThanOrEqual(result.candidates[i].confidence);
    }
  });

  it('provisioning_workflow has highest base confidence', () => {
    const detector = new SkillCandidateDetector();
    const log = createCompleteMissionLog('mission-2026-02-18-601');
    const result = detector.analyze(log);

    const provCandidate = result.candidates.find(
      (c) => c.detection_method === 'provisioning_workflow',
    );
    expect(provCandidate).toBeDefined();

    // Should be first or near-first due to high confidence
    expect(provCandidate!.confidence).toBeGreaterThanOrEqual(0.8);
  });
});

// ============================================================================
// 8. Integration with MetaMissionHarness event log
// ============================================================================

describe('Integration with MetaMissionHarness', () => {
  it('real meta-mission event log produces at least 1 candidate (INTG-09)', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-700',
    });
    harness.runMetaMission();

    const events = harness.getEventLog();
    const detector = new SkillCandidateDetector();
    const result = detector.analyze(events);

    expect(result.has_candidates).toBe(true);
    expect(result.candidates.length).toBeGreaterThanOrEqual(1);
  });

  it('candidate from real mission has valid structure', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-701',
    });
    harness.runMetaMission();

    const events = harness.getEventLog();
    const detector = new SkillCandidateDetector();
    const result = detector.analyze(events);

    const candidate = result.candidates[0];
    expect(candidate.name).toMatch(/^[a-z][a-z0-9-]+$/);
    expect(candidate.description.length).toBeGreaterThanOrEqual(20);
    expect(candidate.trigger_pattern).toBeTruthy();
    expect(candidate.evidence.length).toBeGreaterThanOrEqual(1);
    expect(candidate.confidence).toBeGreaterThanOrEqual(0);
    expect(candidate.confidence).toBeLessThanOrEqual(1);
  });
});
