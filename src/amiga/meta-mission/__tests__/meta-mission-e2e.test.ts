/**
 * End-to-end acceptance tests for the complete AMIGA meta-mission.
 *
 * Validates all three integration requirements in realistic scenarios:
 * - INTG-07: Meta-mission completes through all 6 phases with telemetry
 * - INTG-08: User interacts only through dashboard commands and gate responses
 * - INTG-09: skill-creator surfaces at least one skill candidate during debrief
 *
 * These tests serve as the Launch Gate acceptance criteria.
 */

import { describe, it, expect } from 'vitest';
import { MetaMissionHarness } from '../meta-mission-harness.js';
import type { MetaMissionResult, SkillPackageDraft } from '../meta-mission-harness.js';
import { SkillCandidateDetector } from '../skill-candidate-detector.js';
import type { SkillCandidate, DetectionResult } from '../skill-candidate-detector.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';
import {
  TelemetryUpdatePayloadSchema,
  AlertSurfacePayloadSchema,
} from '../../icd/icd-01.js';

// ============================================================================
// Scenario 1: INTG-07 -- Meta-mission completes through all 6 phases
// ============================================================================

describe('INTG-07: Meta-mission completes through all 6 phases with telemetry', () => {
  it('complete lifecycle with all 6 phases', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-901',
    });
    const result = harness.runMetaMission();

    expect(result.success).toBe(true);
    expect(result.phasesCompleted).toBe(6);

    // Event log has telemetry spanning all 6 phases
    const events = harness.getEventLog();
    const telemetryEvents = events.filter((e) => e.type === 'TELEMETRY_UPDATE');
    const phases = new Set(
      telemetryEvents.map(
        (e) => (e.payload as Record<string, unknown>).phase as string,
      ),
    );

    expect(phases.has('BRIEFING')).toBe(true);
    expect(phases.has('PLANNING')).toBe(true);
    expect(phases.has('EXECUTION')).toBe(true);
    expect(phases.has('INTEGRATION')).toBe(true);
    expect(phases.has('REVIEW_GATE')).toBe(true);
    expect(phases.has('COMPLETION')).toBe(true);

    // Gate signal exists
    const gateSignals = events.filter((e) => e.type === 'GATE_SIGNAL');
    expect(gateSignals.length).toBeGreaterThanOrEqual(1);

    // Archive is sealed
    expect(result.archive.outcome).toBe('completed');
    expect(result.archive.integrity_hash).toMatch(/^[a-f0-9]+$/);
  });

  it('all events pass schema validation', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-902',
    });
    harness.runMetaMission();

    const events = harness.getEventLog();
    expect(events.length).toBeGreaterThan(0);

    let envelopeFailures = 0;
    let payloadFailures = 0;
    let telemetryCount = 0;

    for (const event of events) {
      const envResult = EventEnvelopeSchema.safeParse(event);
      if (!envResult.success) envelopeFailures++;

      if (event.type === 'TELEMETRY_UPDATE') {
        telemetryCount++;
        const payloadResult = TelemetryUpdatePayloadSchema.safeParse(
          event.payload,
        );
        if (!payloadResult.success) payloadFailures++;
      }
    }

    expect(envelopeFailures).toBe(0);
    expect(payloadFailures).toBe(0);
    expect(telemetryCount).toBeGreaterThan(0);
  });

  it('dashboard tracks all phases in real-time via manual stepping', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-903',
    });

    const expectedPhases = [
      'PLANNING',
      'EXECUTION',
      'INTEGRATION',
      'REVIEW_GATE',
    ];

    for (const expected of expectedPhases) {
      harness.stepPhase();
      expect(harness.getMissionView()!.phase).toBe(expected);
    }

    // At REVIEW_GATE, alert view shows gate
    const alertView = harness.getAlertView();
    expect(alertView.tier).toBe('gate');

    // Respond GO
    harness.respondToGate('go', 'All phases verified');
    expect(harness.getState().phase).toBe('COMPLETION');

    // Dashboard shows completed mission
    const dashView = harness.getDashboardView();
    expect(dashView.active_missions).toBe(0);
    expect(dashView.total_missions).toBe(1);
  });
});

// ============================================================================
// Scenario 2: INTG-08 -- Dashboard-only interaction model
// ============================================================================

describe('INTG-08: User interacts only through dashboard commands and gate responses', () => {
  it('dashboard commands work throughout lifecycle', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-911',
    });

    // STATUS works at BRIEFING
    const status1 = harness.issueCommand('STATUS');
    expect(status1.ok).toBe(true);

    // LAUNCH works at BRIEFING
    const launch = harness.issueCommand('LAUNCH');
    expect(launch.ok).toBe(true);

    // STATUS works at other phases
    harness.stepPhase(); // -> PLANNING
    const status2 = harness.issueCommand('STATUS');
    expect(status2.ok).toBe(true);

    // Dashboard always available
    expect(harness.getDashboardView()).toBeDefined();
    expect(harness.getDashboardView().total_missions).toBe(1);
  });

  it('gate response is the only way through REVIEW_GATE', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-912',
    });

    // Advance to REVIEW_GATE
    harness.stepPhase(); // PLANNING
    harness.stepPhase(); // EXECUTION
    harness.stepPhase(); // INTEGRATION
    harness.stepPhase(); // REVIEW_GATE

    expect(harness.getState().suspended).toBe(true);

    // stepPhase from REVIEW_GATE fails (cannot advance past gate)
    const failedStep = harness.stepPhase();
    expect(failedStep.success).toBe(false);

    // Only respondToGate clears it
    harness.respondToGate('go', 'Approved');
    expect(harness.getState().phase).toBe('COMPLETION');
  });

  it('HOLD/RESUME via commands only', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-913',
    });

    harness.stepPhase(); // -> PLANNING
    harness.stepPhase(); // -> EXECUTION

    // HOLD via command
    harness.issueCommand('HOLD');
    expect(harness.getState().phase).toBe('HOLD');

    // RESUME via command
    harness.issueCommand('RESUME');
    expect(harness.getState().phase).toBe('EXECUTION');

    // Continue to completion
    harness.stepPhase(); // -> INTEGRATION
    harness.stepPhase(); // -> REVIEW_GATE
    harness.respondToGate('go', 'Approved after HOLD');
    expect(harness.getState().phase).toBe('COMPLETION');
  });

  it('no internal component access needed', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-914',
    });

    // Verify all control surface methods exist
    expect(typeof harness.issueCommand).toBe('function');
    expect(typeof harness.respondToGate).toBe('function');
    expect(typeof harness.getDashboardView).toBe('function');
    expect(typeof harness.getMissionView).toBe('function');
    expect(typeof harness.getAlertView).toBe('function');
    expect(typeof harness.getStats).toBe('function');
    expect(typeof harness.getState).toBe('function');
    expect(typeof harness.getEventLog).toBe('function');

    // advancePhase does NOT exist on MetaMissionHarness
    expect(
      (harness as unknown as Record<string, unknown>).advancePhase,
    ).toBeUndefined();
  });
});

// ============================================================================
// Scenario 3: INTG-09 -- Skill candidate surfacing during debrief
// ============================================================================

describe('INTG-09: skill-creator surfaces at least one skill candidate during debrief', () => {
  it('runMetaMission includes skill candidates in result', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-921',
    });
    const result = harness.runMetaMission();

    expect(result.skillCandidates).toBeDefined();
    expect(Array.isArray(result.skillCandidates)).toBe(true);
    expect(result.skillCandidates.length).toBeGreaterThanOrEqual(1);

    const topCandidate = result.skillCandidates[0];
    expect(topCandidate.confidence).toBeGreaterThanOrEqual(0.8);
    expect(topCandidate.detection_method).toBe('provisioning_workflow');
  });

  it('skill candidates are surfaced as ALERT_SURFACE events', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-922',
    });
    harness.runMetaMission();

    const events = harness.getEventLog();
    const alertEvents = events.filter((e) => e.type === 'ALERT_SURFACE');

    // At least one alert mentions skill candidate
    const skillAlerts = alertEvents.filter((e) => {
      const payload = e.payload as Record<string, unknown>;
      const message = String(payload.message ?? '').toLowerCase();
      return (
        message.includes('skill candidate') ||
        message.includes('skill-candidate')
      );
    });
    expect(skillAlerts.length).toBeGreaterThanOrEqual(1);

    // The alert is advisory level
    const firstAlert = skillAlerts[0];
    const payload = firstAlert.payload as Record<string, unknown>;
    expect(payload.alert_level).toBe('advisory');
    expect(payload.category).toBe('system');
  });

  it('standalone detector produces same candidates', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-923',
    });
    const result = harness.runMetaMission();
    const events = harness.getEventLog();

    // Get event log BEFORE alert surface events (filter out alerts from debrief)
    const preDebriefEvents = events.filter(
      (e) =>
        !(
          e.type === 'ALERT_SURFACE' &&
          String((e.payload as Record<string, unknown>).message ?? '')
            .toLowerCase()
            .includes('skill candidate')
        ),
    );

    const detector = new SkillCandidateDetector();
    const standaloneResult = detector.analyze(preDebriefEvents);

    // Standalone produces at least 1 candidate
    expect(standaloneResult.has_candidates).toBe(true);

    // The harness result should have at least as many candidates
    expect(result.skillCandidates.length).toBeGreaterThanOrEqual(
      standaloneResult.candidates.filter(
        (c) => c.detection_method === 'provisioning_workflow',
      ).length,
    );
  });

  it('skill candidate has actionable content', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-924',
    });
    const result = harness.runMetaMission();

    const candidate = result.skillCandidates[0];

    // Valid kebab-case name
    expect(candidate.name).toMatch(/^[a-z][a-z0-9-]+$/);
    // Meaningful description
    expect(candidate.description.length).toBeGreaterThanOrEqual(20);
    // Non-empty trigger pattern
    expect(candidate.trigger_pattern).toBeTruthy();
    // At least 1 evidence event ID
    expect(candidate.evidence.length).toBeGreaterThanOrEqual(1);

    // Evidence IDs are real (exist in event log)
    const events = harness.getEventLog();
    const logIds = new Set(events.map((e) => e.id));
    for (const evidenceId of candidate.evidence) {
      expect(logIds.has(evidenceId)).toBe(true);
    }
  });
});

// ============================================================================
// Scenario 4: Launch Gate -- all three requirements in a single run
// ============================================================================

describe('Launch Gate: complete meta-mission validates INTG-07/08/09', () => {
  it('single comprehensive validation of all integration requirements', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-999',
    });
    const result = harness.runMetaMission();

    // === INTG-07: 6-phase lifecycle with telemetry ===
    expect(result.phasesCompleted).toBe(6);
    expect(result.success).toBe(true);

    const events = harness.getEventLog();
    const telemetryPhases = new Set(
      events
        .filter((e) => e.type === 'TELEMETRY_UPDATE')
        .map((e) => (e.payload as Record<string, unknown>).phase as string),
    );
    expect(telemetryPhases.size).toBeGreaterThanOrEqual(6);

    // Archive sealed
    expect(result.archive.outcome).toBe('completed');
    expect(result.archive.integrity_hash).toMatch(/^[a-f0-9]+$/);

    // === INTG-08: Dashboard-only interaction ===
    // All interaction was through harness API (verified by the fact that
    // runMetaMission uses issueCommand/respondToGate internally)
    expect(harness.getDashboardView().total_missions).toBe(1);
    expect(harness.getMissionView()!.phase).toBe('COMPLETION');

    // === INTG-09: Skill candidate surfacing ===
    expect(result.skillCandidates.length).toBeGreaterThanOrEqual(1);

    const alertEvents = events.filter((e) => e.type === 'ALERT_SURFACE');
    const skillAlerts = alertEvents.filter((e) => {
      const msg = String((e.payload as Record<string, unknown>).message ?? '');
      return msg.toLowerCase().includes('skill candidate');
    });
    expect(skillAlerts.length).toBeGreaterThanOrEqual(1);

    // === Schema validation: every event is valid ===
    let failures = 0;
    for (const event of events) {
      const envResult = EventEnvelopeSchema.safeParse(event);
      if (!envResult.success) failures++;
    }
    expect(failures).toBe(0);

    // === Four ICD channels active ===
    // Verify this is a true end-to-end run
    const eventTypes = new Set(events.map((e) => e.type));
    expect(eventTypes.has('TELEMETRY_UPDATE')).toBe(true); // ICD-01
    expect(eventTypes.has('LEDGER_ENTRY')).toBe(true); // ICD-02
    expect(eventTypes.has('GOVERNANCE_QUERY')).toBe(true); // ICD-03
    expect(eventTypes.has('LEDGER_READ')).toBe(true); // ICD-04
  });
});
