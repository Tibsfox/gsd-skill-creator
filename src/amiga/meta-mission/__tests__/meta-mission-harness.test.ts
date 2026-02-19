/**
 * TDD tests for MetaMissionHarness.
 *
 * Tests the meta-mission lifecycle where the mission objective is to
 * produce a skill package documenting the AMIGA provisioning process.
 * Validates: lifecycle (INTG-07), dashboard interaction (INTG-08),
 * skill package generation, telemetry flow, and HOLD/RESUME.
 */

import { describe, it, expect } from 'vitest';
import {
  MetaMissionHarness,
} from '../meta-mission-harness.js';
import type {
  MetaMissionConfig,
  MetaMissionResult,
  SkillPackageDraft,
} from '../meta-mission-harness.js';
import { EventEnvelopeSchema } from '../../message-envelope.js';
import { TelemetryUpdatePayloadSchema } from '../../icd/icd-01.js';

// ============================================================================
// 1. Construction
// ============================================================================

describe('MetaMissionHarness construction', () => {
  it('creates a harness with auto-generated mission ID when no config given', () => {
    const harness = new MetaMissionHarness();
    const state = harness.getState();
    expect(state.missionId).toMatch(/^mission-\d{4}-\d{2}-\d{2}-\d{3}$/);
    expect(state.phase).toBe('BRIEFING');
  });

  it('uses provided mission ID from config', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-001',
    });
    expect(harness.getState().missionId).toBe('mission-2026-02-18-001');
  });

  it('starts at BRIEFING phase', () => {
    const harness = new MetaMissionHarness();
    expect(harness.getState().phase).toBe('BRIEFING');
  });

  it('dashboard tracks one mission after construction', () => {
    const harness = new MetaMissionHarness();
    const view = harness.getDashboardView();
    expect(view.total_missions).toBe(1);
  });
});

// ============================================================================
// 2. Full lifecycle through all 6 phases (INTG-07)
// ============================================================================

describe('INTG-07: Full lifecycle through all 6 phases', () => {
  it('runMetaMission() completes through all 6 phases', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-010',
    });
    const result = harness.runMetaMission();

    expect(result.phasesCompleted).toBe(6);
    expect(result.success).toBe(true);
  });

  it('event log contains TELEMETRY_UPDATE events for phase transitions', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-011',
    });
    harness.runMetaMission();

    const events = harness.getEventLog();
    const telemetryEvents = events.filter((e) => e.type === 'TELEMETRY_UPDATE');

    // At least 6 telemetry events (one per phase transition + initial)
    expect(telemetryEvents.length).toBeGreaterThanOrEqual(6);

    // Extract phases from telemetry events
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
  });

  it('event log contains at least one GATE_SIGNAL from REVIEW_GATE', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-012',
    });
    harness.runMetaMission();

    const events = harness.getEventLog();
    const gateSignals = events.filter((e) => e.type === 'GATE_SIGNAL');
    expect(gateSignals.length).toBeGreaterThanOrEqual(1);
  });

  it('all events pass EventEnvelopeSchema validation', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-013',
    });
    harness.runMetaMission();

    const events = harness.getEventLog();
    expect(events.length).toBeGreaterThan(0);

    let failures = 0;
    for (const event of events) {
      const result = EventEnvelopeSchema.safeParse(event);
      if (!result.success) failures++;
    }
    expect(failures).toBe(0);
  });
});

// ============================================================================
// 3. Dashboard interaction model (INTG-08)
// ============================================================================

describe('INTG-08: Dashboard interaction model', () => {
  it('issueCommand STATUS returns ok: true', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-020',
    });
    const result = harness.issueCommand('STATUS');
    expect(result.ok).toBe(true);
  });

  it('issueCommand LAUNCH works at BRIEFING', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-021',
    });
    const result = harness.issueCommand('LAUNCH');
    expect(result.ok).toBe(true);
  });

  it('respondToGate works at REVIEW_GATE', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-022',
    });

    // Step through to REVIEW_GATE
    harness.stepPhase(); // BRIEFING -> PLANNING
    harness.stepPhase(); // PLANNING -> EXECUTION
    harness.stepPhase(); // EXECUTION -> INTEGRATION
    harness.stepPhase(); // INTEGRATION -> REVIEW_GATE

    expect(harness.getState().suspended).toBe(true);

    // Respond to gate
    harness.respondToGate('go', 'Meta-mission review complete');
    expect(harness.getState().phase).toBe('COMPLETION');
  });

  it('getDashboardView returns valid data at every phase', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-023',
    });

    const view1 = harness.getDashboardView();
    expect(view1.total_missions).toBe(1);

    harness.stepPhase(); // -> PLANNING
    const view2 = harness.getDashboardView();
    expect(view2.total_missions).toBe(1);

    harness.stepPhase(); // -> EXECUTION
    harness.stepPhase(); // -> INTEGRATION
    harness.stepPhase(); // -> REVIEW_GATE

    const view3 = harness.getDashboardView();
    expect(view3.total_missions).toBe(1);
  });

  it('getMissionView tracks the current phase at each transition', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-024',
    });

    const expectedPhases = [
      'PLANNING',
      'EXECUTION',
      'INTEGRATION',
      'REVIEW_GATE',
    ];

    for (const expected of expectedPhases) {
      harness.stepPhase();
      const missionView = harness.getMissionView();
      expect(missionView).toBeDefined();
      expect(missionView!.phase).toBe(expected);
    }
  });

  it('user interaction is limited to issueCommand, respondToGate, and query methods', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-025',
    });

    // These are the control surface methods (must exist)
    expect(typeof harness.issueCommand).toBe('function');
    expect(typeof harness.respondToGate).toBe('function');
    expect(typeof harness.getDashboardView).toBe('function');
    expect(typeof harness.getMissionView).toBe('function');
    expect(typeof harness.getAlertView).toBe('function');
    expect(typeof harness.getStats).toBe('function');
    expect(typeof harness.getState).toBe('function');
    expect(typeof harness.getEventLog).toBe('function');

    // advancePhase must NOT exist on MetaMissionHarness (internal to FullStackController)
    expect((harness as unknown as Record<string, unknown>).advancePhase).toBeUndefined();
  });
});

// ============================================================================
// 4. Skill package draft generation
// ============================================================================

describe('Skill package draft generation', () => {
  it('runMetaMission produces a valid SkillPackageDraft', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-030',
    });
    const result = harness.runMetaMission();

    expect(result.skillPackage).toBeDefined();
    expect(result.skillPackage.name).toBe('amiga-provisioning');
  });

  it('skill package description mentions AMIGA and provisioning', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-031',
    });
    const result = harness.runMetaMission();

    expect(result.skillPackage.description.toLowerCase()).toContain('amiga');
    expect(result.skillPackage.description.toLowerCase()).toContain('provisioning');
  });

  it('skill package documents at least 3 active phases', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-032',
    });
    const result = harness.runMetaMission();

    // PLANNING, EXECUTION, INTEGRATION are the active work phases
    expect(result.skillPackage.phases_documented.length).toBeGreaterThanOrEqual(3);
  });

  it('skill package has 4 contributors (MC-1, ME-1, CE-1, GL-1)', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-033',
    });
    const result = harness.runMetaMission();

    expect(result.skillPackage.contributors.length).toBe(4);
  });

  it('skill package has at least 3 provisioning steps', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-034',
    });
    const result = harness.runMetaMission();

    expect(result.skillPackage.provisioning_steps.length).toBeGreaterThanOrEqual(3);
  });

  it('skill package total_events reflects pre-debrief event count', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-035',
    });
    const result = harness.runMetaMission();
    const events = harness.getEventLog();

    // Skill package is built before debrief ALERT_SURFACE events are emitted,
    // so total_events may be less than or equal to final event log length.
    // Debrief alerts are appended after the skill package snapshot.
    const debriefAlerts = events.filter(
      (e) =>
        e.type === 'ALERT_SURFACE' &&
        String((e.payload as Record<string, unknown>).message ?? '')
          .toLowerCase()
          .includes('skill candidate'),
    );
    expect(result.skillPackage.total_events).toBe(
      events.length - debriefAlerts.length,
    );
  });

  it('skill package governance verdict is COMPLIANT', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-036',
    });
    const result = harness.runMetaMission();

    expect(result.skillPackage.governance_verdict).toBe('COMPLIANT');
  });
});

// ============================================================================
// 5. Telemetry flows to MC-1 throughout
// ============================================================================

describe('Telemetry flows to MC-1 throughout lifecycle', () => {
  it('dashboard tracks phase transitions in real-time', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-040',
    });

    harness.stepPhase(); // -> PLANNING
    expect(harness.getMissionView()!.phase).toBe('PLANNING');

    harness.stepPhase(); // -> EXECUTION
    expect(harness.getMissionView()!.phase).toBe('EXECUTION');
  });

  it('after completion, mission view shows COMPLETION', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-041',
    });
    harness.runMetaMission();

    const missionView = harness.getMissionView();
    expect(missionView).toBeDefined();
    expect(missionView!.phase).toBe('COMPLETION');
  });

  it('stats show consumed telemetry events', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-042',
    });
    harness.runMetaMission();

    const stats = harness.getStats();
    expect(stats.total).toBeGreaterThan(0);
  });
});

// ============================================================================
// 6. HOLD/RESUME during meta-mission
// ============================================================================

describe('HOLD/RESUME during meta-mission', () => {
  it('HOLD at EXECUTION and RESUME continues correctly', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-050',
    });

    harness.stepPhase(); // -> PLANNING
    harness.stepPhase(); // -> EXECUTION
    expect(harness.getState().phase).toBe('EXECUTION');

    // HOLD
    harness.issueCommand('HOLD');
    expect(harness.getState().phase).toBe('HOLD');

    // RESUME
    harness.issueCommand('RESUME');
    expect(harness.getState().phase).toBe('EXECUTION');
  });

  it('skill package draft is still valid after HOLD/RESUME cycle', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-051',
    });

    harness.stepPhase(); // -> PLANNING
    harness.stepPhase(); // -> EXECUTION

    // HOLD/RESUME mid-mission
    harness.issueCommand('HOLD');
    harness.issueCommand('RESUME');

    // Continue to completion
    harness.stepPhase(); // -> INTEGRATION
    harness.stepPhase(); // -> REVIEW_GATE
    harness.respondToGate('go', 'Approved after HOLD/RESUME');

    expect(harness.getState().phase).toBe('COMPLETION');

    // Build skill package
    const skillPackage = harness.buildSkillPackageDraft();
    expect(skillPackage.name).toBe('amiga-provisioning');
    expect(skillPackage.phases_documented.length).toBeGreaterThanOrEqual(3);
    expect(skillPackage.contributors.length).toBe(4);
  });
});

// ============================================================================
// 7. Error handling
// ============================================================================

describe('Error handling', () => {
  it('respondToGate when not at a gate throws or returns error', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-060',
    });

    // At BRIEFING, not at a gate
    expect(() => {
      harness.respondToGate('go', 'Should fail');
    }).toThrow();
  });

  it('stepPhase from COMPLETION returns error result', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-061',
    });
    harness.runMetaMission();

    expect(harness.getState().phase).toBe('COMPLETION');
    const result = harness.stepPhase();
    expect(result.success).toBe(false);
  });

  it('runMetaMission when already completed throws', () => {
    const harness = new MetaMissionHarness({
      mission_id: 'mission-2026-02-18-062',
    });
    harness.runMetaMission();

    expect(() => {
      harness.runMetaMission();
    }).toThrow();
  });
});
