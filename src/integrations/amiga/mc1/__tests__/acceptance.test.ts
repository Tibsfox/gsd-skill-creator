/**
 * CTRL-07: User Acceptance Test
 *
 * Validates that a user unfamiliar with system internals can LAUNCH a mission,
 * watch telemetry progress, respond to a gate review, and DEBRIEF -- all
 * without reading documentation.
 *
 * All imports come through the MC-1 barrel to verify exports are complete.
 */

import { describe, it, expect } from 'vitest';
import {
  StubME1,
  createNominalSequence,
  createAdvisorySequence,
  createFullLifecycleSequence,
  parseCommand,
  Dashboard,
  AlertRenderer,
  TelemetryConsumer,
} from '../index.js';
import type { EventEnvelope } from '../../message-envelope.js';
import { GateResponsePayloadSchema } from '../../icd/icd-01.js';

// ============================================================================
// Tests
// ============================================================================

describe('CTRL-07: User Acceptance - No Documentation Required', () => {
  it('completes a full mission: LAUNCH, watch progress, respond to gate, DEBRIEF', () => {
    // === STEP 1: USER LAUNCHES A MISSION ===
    // The user types "LAUNCH" at the command prompt.
    // They don't need to know mission ID format -- LAUNCH creates one.
    const launchResult = parseCommand('LAUNCH');
    expect(launchResult.ok).toBe(true);
    // The command parser understands natural input and returns a structured command.
    // The user sees: "Mission launched."

    // === STEP 2: TELEMETRY BEGINS FLOWING ===
    // Behind the scenes, ME-1 starts emitting telemetry.
    // We simulate this with a full lifecycle sequence that includes all event types.
    const missionId = 'mission-2026-02-18-001';
    const stub = new StubME1(createFullLifecycleSequence(missionId));

    // Wire up the control surface components.
    const dashboard = new Dashboard();
    const gateResponses: EventEnvelope[] = [];
    const alertRenderer = new AlertRenderer({
      onGateResponse: (env) => gateResponses.push(env),
    });
    const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

    // === STEP 3: USER WATCHES MISSION PROGRESS ===
    // Events arrive one at a time. The user watches the dashboard update.
    // Process events until we hit a gate (mission suspends).
    let event = stub.next();
    let gateEncountered = false;

    while (event !== null) {
      consumer.consume(event);

      // Check if the user sees a gate
      const view = alertRenderer.getView(missionId);
      if (view.tier === 'gate') {
        gateEncountered = true;
        break; // Mission is suspended -- user must respond
      }

      // The user sees the dashboard updating with progress
      const mission = dashboard.getMission(missionId);
      if (mission) {
        // User sees: phase name, progress %, team lights
        expect(mission.phase).toBeDefined();
        expect(mission.progress).toBeGreaterThanOrEqual(0);
      }

      event = stub.next();
    }

    // === STEP 4: USER RESPONDS TO THE GATE ===
    // The user sees a gate panel with Go/No-Go/Redirect buttons.
    // They don't need to understand gate internals -- just click a button.
    expect(gateEncountered).toBe(true);

    const gateView = alertRenderer.getView(missionId);
    expect(gateView.tier).toBe('gate');
    // Assert it's a GateView for type narrowing
    if (gateView.tier === 'gate') {
      // User sees criteria checklist and buttons
      expect(gateView.buttons).toEqual(['go', 'no_go', 'redirect']);
      expect(gateView.criteria.length).toBeGreaterThan(0);
      expect(gateView.gate_signal_id).toBeDefined();

      // User clicks "Go" -- they think the work looks good
      const responded = alertRenderer.respondToGate(
        missionId,
        gateView.gate_signal_id,
        'go',
        'Looks good to me',
        'human',
      );
      expect(responded).toBe(true);
    }

    // Verify gate response was emitted as valid ICD-01
    expect(gateResponses).toHaveLength(1);
    const responsePayload = gateResponses[0].payload;
    const parsed = GateResponsePayloadSchema.safeParse(responsePayload);
    expect(parsed.success).toBe(true);

    // Mission is no longer suspended
    expect(alertRenderer.isSuspended(missionId)).toBe(false);

    // === STEP 5: MISSION CONTINUES AND COMPLETES ===
    // Continue draining remaining events after the gate
    event = stub.next();
    while (event !== null) {
      consumer.consume(event);
      event = stub.next();
    }

    // === STEP 6: USER DEBRIEFS ===
    // The user types "DEBRIEF" with the mission ID.
    const debriefResult = parseCommand(`DEBRIEF ${missionId}`);
    expect(debriefResult.ok).toBe(true);
    if (debriefResult.ok) {
      expect(debriefResult.command.command).toBe('DEBRIEF');
      expect(debriefResult.command.mission_id).toBe(missionId);
    }

    // Dashboard shows mission at completion
    const finalMission = dashboard.getMission(missionId);
    expect(finalMission).toBeDefined();
    expect(finalMission!.phase).toBe('COMPLETION');
    expect(finalMission!.progress).toBe(100);

    // === STEP 7: USER CHECKS STATUS ===
    // User can always check status at any time
    const statusResult = parseCommand('STATUS');
    expect(statusResult.ok).toBe(true);

    const dashView = dashboard.getView();
    expect(dashView.total_missions).toBe(1);
    // Mission is complete -- active_missions should be 0
    expect(dashView.active_missions).toBe(0);

    // === VERIFICATION: No documentation was consulted ===
    // The user used only natural commands (LAUNCH, DEBRIEF, STATUS)
    // and clicked a clearly-labeled button (Go) at a gate.
    // All command names are plain English verbs.
    // All dashboard data is self-describing (phase names, percentages, colors).

    // Check telemetry stats for completeness
    const stats = consumer.getStats();
    expect(stats.total).toBeGreaterThan(0);
    expect(stats.by_type['TELEMETRY_UPDATE']).toBeGreaterThan(0);
  });

  it('handles advisory alerts without requiring user intervention', () => {
    // An advisory rises a panel but doesn't block the mission.
    // The user sees it, notes it, and the mission continues.

    const missionId = 'mission-2026-02-18-005';
    const stub = new StubME1(createAdvisorySequence(missionId));

    const dashboard = new Dashboard();
    const alertRenderer = new AlertRenderer();
    const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

    // Drain all events
    consumer.drainAll(stub.drain());

    // Dashboard was updated
    const mission = dashboard.getMission(missionId);
    expect(mission).toBeDefined();

    // No gate suspension -- user was never blocked
    expect(alertRenderer.isSuspended(missionId)).toBe(false);

    // Advisory may have been cleared by trailing telemetry
    const view = alertRenderer.getView(missionId);
    // Either nominal (cleared) or advisory (still active) -- both are acceptable
    expect(['nominal', 'advisory']).toContain(view.tier);

    // Stats show the advisory was processed
    const stats = consumer.getStats();
    expect(stats.by_type['ALERT_SURFACE']).toBeGreaterThan(0);
  });

  it('supports all 8 commands as plain English verbs', () => {
    // Every command name is an English verb that a non-technical user would understand.
    // No abbreviations, no jargon, no flags required.
    const commands = ['LAUNCH', 'STATUS', 'REDIRECT', 'REVIEW', 'HOLD', 'RESUME', 'ABORT', 'DEBRIEF'];

    for (const cmd of commands) {
      const result = parseCommand(cmd);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.command).toBe(cmd);
      }
    }

    // Case-insensitive: user doesn't need to know about caps
    const lowerResult = parseCommand('launch');
    expect(lowerResult.ok).toBe(true);
  });

  it('provides helpful error messages for mistakes', () => {
    // When a user makes a typo or gives incomplete input,
    // the error message tells them what to do -- no stack traces, no jargon.

    // Typo
    const typoResult = parseCommand('LUNACH');
    expect(typoResult.ok).toBe(false);
    if (!typoResult.ok) {
      // Error should list valid commands
      expect(typoResult.error.message).toBeTruthy();
      expect(typoResult.error.suggestions.length).toBeGreaterThan(0);
    }

    // Empty input
    const emptyResult = parseCommand('');
    expect(emptyResult.ok).toBe(false);
    if (!emptyResult.ok) {
      expect(emptyResult.error.message).toBeTruthy();
    }

    // Ambiguous prefix
    const ambiguousResult = parseCommand('RE');
    expect(ambiguousResult.ok).toBe(false);
    if (!ambiguousResult.ok) {
      expect(ambiguousResult.error.suggestions.length).toBeGreaterThan(1);
    }
  });

  it('dashboard data is self-describing: phases, percentages, colors', () => {
    // Every piece of data shown to the user uses human-readable names.
    // No internal IDs, no raw enums, no codes.

    const missionId = 'mission-2026-02-18-006';
    const stub = new StubME1(createNominalSequence(missionId));
    const dashboard = new Dashboard();
    const alertRenderer = new AlertRenderer();
    const consumer = new TelemetryConsumer({ dashboard, alertRenderer });

    consumer.drainAll(stub.drain());

    const mission = dashboard.getMission(missionId);
    expect(mission).toBeDefined();

    // Phase is a plain English word (BRIEFING, PLANNING, etc.) -- not a code
    const validPhases = ['BRIEFING', 'PLANNING', 'EXECUTION', 'INTEGRATION', 'REVIEW_GATE', 'COMPLETION', 'HOLD', 'ABORT'];
    expect(validPhases).toContain(mission!.phase);

    // Progress is a percentage (0-100) -- universally understood
    expect(mission!.progress).toBeGreaterThanOrEqual(0);
    expect(mission!.progress).toBeLessThanOrEqual(100);

    // Team status uses traffic-light colors -- universally understood
    if (mission!.team_status.length > 0) {
      for (const team of mission!.team_status) {
        expect(['green', 'amber', 'red']).toContain(team.status);
      }
    }
  });
});
