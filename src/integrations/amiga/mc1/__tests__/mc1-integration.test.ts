/**
 * Integration tests for MC-1 Control Surface.
 *
 * Validates the end-to-end flow:
 *   StubME1 emits telemetry -> Dashboard processes events -> Command parser dispatches
 *
 * Imports everything through the barrel (src/amiga/mc1/index.ts) to verify
 * all exports resolve correctly.
 */

import { describe, it, expect } from 'vitest';
import {
  StubME1,
  createNominalSequence,
  createAdvisorySequence,
  createFullLifecycleSequence,
  Dashboard,
  parseCommand,
  SUPPORTED_COMMANDS,
} from '../index.js';

// ============================================================================
// Barrel export validation
// ============================================================================

describe('MC-1 integration', () => {
  describe('barrel export validation', () => {
    it('all core imports are defined', () => {
      expect(StubME1).toBeDefined();
      expect(createFullLifecycleSequence).toBeDefined();
      expect(Dashboard).toBeDefined();
      expect(parseCommand).toBeDefined();
      expect(SUPPORTED_COMMANDS).toBeDefined();
    });

    it('SUPPORTED_COMMANDS has 8 entries', () => {
      expect(SUPPORTED_COMMANDS).toHaveLength(8);
    });
  });

  // ============================================================================
  // End-to-end lifecycle: telemetry -> dashboard -> command
  // ============================================================================

  describe('end-to-end lifecycle', () => {
    it('telemetry -> dashboard -> debrief command', () => {
      // 1. Create StubME1 with full lifecycle
      const config = createFullLifecycleSequence('mission-2026-02-18-001');
      const stub = new StubME1(config);

      // 2. Create Dashboard and drain all events through it
      const dashboard = new Dashboard();
      const events = stub.drain();
      for (const event of events) {
        dashboard.processEvent(event);
      }

      // 3. Verify dashboard shows mission at COMPLETION
      const mission = dashboard.getMission('mission-2026-02-18-001');
      expect(mission).toBeDefined();
      expect(mission!.phase).toBe('COMPLETION');
      expect(mission!.progress).toBe(100);

      // 4. Parse a DEBRIEF command for the completed mission
      const result = parseCommand('DEBRIEF mission-2026-02-18-001');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.command).toBe('DEBRIEF');
        expect(result.command.mission_id).toBe('mission-2026-02-18-001');
      }
    });
  });

  // ============================================================================
  // Command -> Dashboard state query flow
  // ============================================================================

  describe('command -> dashboard state query', () => {
    it('status command on partial-progress mission', () => {
      // 1. Create StubME1 with nominal sequence
      const config = createNominalSequence('mission-2026-02-18-002');
      const stub = new StubME1(config);

      // 2. Feed first 3 events (partial progress)
      const dashboard = new Dashboard();
      dashboard.processEvent(stub.next()!);
      dashboard.processEvent(stub.next()!);
      dashboard.processEvent(stub.next()!);

      // 3. Parse STATUS command
      const result = parseCommand('STATUS mission-2026-02-18-002');
      expect(result.ok).toBe(true);

      // 4. Query dashboard
      const mission = dashboard.getMission('mission-2026-02-18-002');
      expect(mission).toBeDefined();
      expect(mission!.phase).not.toBe('COMPLETION');
      expect(mission!.progress).toBeLessThan(100);
    });
  });

  // ============================================================================
  // Alert handling in integrated flow
  // ============================================================================

  describe('alert handling in integrated flow', () => {
    it('advisory alert then HOLD command', () => {
      // 1. Create advisory sequence and feed into dashboard
      const config = createAdvisorySequence('mission-2026-02-18-003');
      const stub = new StubME1(config);
      const dashboard = new Dashboard();
      const events = stub.drain();
      for (const event of events) {
        dashboard.processEvent(event);
      }

      // 2. Dashboard tracks the mission
      const mission = dashboard.getMission('mission-2026-02-18-003');
      expect(mission).toBeDefined();

      // 3. Parse HOLD command
      const result = parseCommand('HOLD mission-2026-02-18-003');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.command.command).toBe('HOLD');
      }
    });
  });

  // ============================================================================
  // Multi-mission dashboard with commands
  // ============================================================================

  describe('multi-mission dashboard with commands', () => {
    it('two missions tracked with independent commands', () => {
      const dashboard = new Dashboard();
      const stub1 = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      const stub2 = new StubME1(createNominalSequence('mission-2026-02-18-002'));

      // Feed events from both
      for (const event of stub1.drain()) {
        dashboard.processEvent(event);
      }
      dashboard.processEvent(stub2.next()!);

      // Dashboard shows 2 missions
      const view = dashboard.getView();
      expect(view.total_missions).toBe(2);

      // Commands parse independently
      const r1 = parseCommand('DEBRIEF mission-2026-02-18-001');
      const r2 = parseCommand('STATUS mission-2026-02-18-002');
      expect(r1.ok).toBe(true);
      expect(r2.ok).toBe(true);
    });
  });

  // ============================================================================
  // Error handling integration
  // ============================================================================

  describe('error handling integration', () => {
    it('ambiguous command returns error with suggestions', () => {
      const result = parseCommand('RE');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error.suggestions.length).toBeGreaterThan(1);
      }
    });

    it('command for non-existent mission parses successfully', () => {
      const dashboard = new Dashboard();
      // Parser does not check dashboard state
      const result = parseCommand('STATUS mission-2026-02-18-999');
      expect(result.ok).toBe(true);
      // Dashboard returns undefined for unknown mission
      expect(dashboard.getMission('mission-2026-02-18-999')).toBeUndefined();
    });

    it('parser and dashboard do not interfere', () => {
      const dashboard = new Dashboard();
      const stub = new StubME1(createNominalSequence('mission-2026-02-18-001'));
      dashboard.processEvent(stub.next()!);

      // Parser error does not affect dashboard
      const badResult = parseCommand('EXPLODE');
      expect(badResult.ok).toBe(false);
      expect(dashboard.getMissions()).toHaveLength(1);

      // Good parse does not affect dashboard
      const goodResult = parseCommand('STATUS');
      expect(goodResult.ok).toBe(true);
      expect(dashboard.getMissions()).toHaveLength(1);
    });
  });
});
