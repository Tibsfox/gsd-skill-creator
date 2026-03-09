/**
 * ChorusProtocol tests — Distributed Pause/Resume
 * CF-14: Zero work loss on pause/resume
 * CF-06: Pause propagation within 500ms
 * CF-08/CF-10: Scout-first re-engagement
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommBus } from '../comm-bus.js';
import { ChorusProtocol, createChorusProtocol } from '../chorus-proto.js';
import type { ChorusEvent } from '../chorus-proto.js';

describe('ChorusProtocol', () => {
  let bus: CommBus;
  let chorus: ChorusProtocol;

  beforeEach(() => {
    bus = new CommBus();
    bus.registerAgent('_chorus_proto_internal');
    chorus = createChorusProtocol(bus);
    chorus.registerAgent('alpha');
    chorus.registerAgent('bravo');
    chorus.registerAgent('charlie');
  });

  describe('agent lifecycle', () => {
    it('registers agents and tracks state', () => {
      const state = chorus.getAgentState('alpha');
      expect(state).toBeDefined();
      expect(state!.phase).toBe('BASELINE');
      expect(state!.paused).toBe(false);
    });

    it('lists all agent states', () => {
      expect(chorus.getAllAgentStates()).toHaveLength(3);
    });

    it('unregisters agents', () => {
      chorus.unregisterAgent('charlie');
      expect(chorus.getAgentState('charlie')).toBeUndefined();
    });
  });

  describe('distributed pause (CF-14, CF-06)', () => {
    it('pauses all agents with state snapshots', () => {
      const workStates = new Map<string, Record<string, unknown>>();
      workStates.set('alpha', { task: 'writing', progress: 42 });
      workStates.set('bravo', { task: 'reviewing', progress: 80 });

      const result = chorus.pause('alpha', workStates);

      expect(result.success).toBe(true);
      expect(result.agentsPaused).toBe(3);
      expect(result.snapshots).toHaveLength(3);
      expect(chorus.isPaused()).toBe(true);
    });

    it('propagates pause within 500ms (CF-06)', () => {
      const result = chorus.pause('alpha');
      expect(result.propagationMs).toBeLessThan(500);
    });

    it('preserves work state in snapshot (CF-14 zero work loss)', () => {
      const workStates = new Map<string, Record<string, unknown>>();
      workStates.set('alpha', { task: 'writing', progress: 42, buffer: [1, 2, 3] });

      const result = chorus.pause('alpha', workStates);
      const alphaSnapshot = result.snapshots.find(s => s.agentId === 'alpha');

      expect(alphaSnapshot).toBeDefined();
      expect(alphaSnapshot!.workState).toEqual({ task: 'writing', progress: 42, buffer: [1, 2, 3] });
    });

    it('marks all agents as paused', () => {
      chorus.pause('alpha');

      for (const state of chorus.getAllAgentStates()) {
        expect(state.paused).toBe(true);
      }
    });

    it('emits snapshot_taken events for all agents', () => {
      const events: ChorusEvent[] = [];
      chorus.onEvent(e => events.push(e));

      chorus.pause('alpha');

      const snapEvents = events.filter(e => e.type === 'snapshot_taken');
      expect(snapEvents).toHaveLength(3);
    });
  });

  describe('resume with scout-first (CF-08, CF-10)', () => {
    it('resumes with scout agent first', () => {
      chorus.pause('alpha');
      const result = chorus.resume('alpha');

      expect(result.success).toBe(true);
      expect(result.agentsResumed).toBe(3);
      expect(result.scoutId).toBeDefined();
      expect(chorus.isPaused()).toBe(false);
    });

    it('prefers scoutReady agent as scout', () => {
      chorus.setScoutReady('bravo', true);
      chorus.pause('alpha');
      const result = chorus.resume('alpha');

      expect(result.scoutId).toBe('bravo');
    });

    it('restores state from snapshot on resume (CF-14)', () => {
      chorus.transitionPhase('alpha', 'ASSESS');
      chorus.transitionPhase('bravo', 'PROBE');

      const workStates = new Map<string, Record<string, unknown>>();
      workStates.set('alpha', { progress: 50 });
      chorus.pause('alpha', workStates);

      // Verify paused state
      expect(chorus.getAgentState('alpha')!.paused).toBe(true);

      chorus.resume('alpha');

      // Phases restored from snapshot
      expect(chorus.getAgentState('alpha')!.phase).toBe('ASSESS');
      expect(chorus.getAgentState('bravo')!.phase).toBe('PROBE');
      expect(chorus.getAgentState('alpha')!.paused).toBe(false);
    });

    it('reports statesRestored count', () => {
      chorus.pause('alpha');
      const result = chorus.resume('alpha');
      expect(result.statesRestored).toBe(3);
    });

    it('returns failure if not paused', () => {
      const result = chorus.resume('alpha');
      expect(result.success).toBe(false);
      expect(result.reason).toBe('Not paused');
    });

    it('emits scout_deployed and full_resume events', () => {
      const events: ChorusEvent[] = [];
      chorus.onEvent(e => events.push(e));

      chorus.pause('alpha');
      chorus.resume('alpha');

      expect(events.some(e => e.type === 'scout_deployed')).toBe(true);
      expect(events.some(e => e.type === 'scout_clear')).toBe(true);
      expect(events.some(e => e.type === 'full_resume')).toBe(true);
    });
  });

  describe('tempo synchronization', () => {
    it('sets tempo for all agents', () => {
      chorus.setTempo(2);
      expect(chorus.getTempo()).toBe(2);

      for (const state of chorus.getAllAgentStates()) {
        expect(state.tempo).toBe(2);
      }
    });

    it('clamps tempo to valid range', () => {
      chorus.setTempo(0.01);
      expect(chorus.getTempo()).toBe(0.1);
      chorus.setTempo(200);
      expect(chorus.getTempo()).toBe(100);
    });

    it('records heartbeats', () => {
      const before = Date.now();
      chorus.heartbeat('alpha');
      const state = chorus.getAgentState('alpha');
      expect(state!.lastBeat).toBeGreaterThanOrEqual(before);
    });
  });

  describe('phase transitions (no leader election)', () => {
    it('transitions agent phase independently', () => {
      const result = chorus.transitionPhase('alpha', 'ASSESS');
      expect(result).toBe(true);
      expect(chorus.getAgentState('alpha')!.phase).toBe('ASSESS');
    });

    it('prevents transition while paused', () => {
      chorus.pause('alpha');
      const result = chorus.transitionPhase('alpha', 'ASSESS');
      expect(result).toBe(false);
    });

    it('broadcasts phase change to peers', () => {
      const beforeCount = bus.getMessages().length;
      chorus.transitionPhase('alpha', 'PROBE');
      const afterCount = bus.getMessages().length;
      expect(afterCount).toBeGreaterThan(beforeCount);
    });

    it('emits phase_transition event', () => {
      const events: ChorusEvent[] = [];
      chorus.onEvent(e => events.push(e));

      chorus.transitionPhase('alpha', 'CLASSIFY');

      const ptEvents = events.filter(e => e.type === 'phase_transition');
      expect(ptEvents).toHaveLength(1);
    });
  });

  describe('resume ordering', () => {
    it('respects resumeOrder for followers', () => {
      chorus.setResumeOrder('alpha', 2);
      chorus.setResumeOrder('bravo', 0);
      chorus.setResumeOrder('charlie', 1);

      expect(chorus.getAgentState('bravo')!.resumeOrder).toBe(0);
    });
  });

  describe('event log', () => {
    it('records all events', () => {
      chorus.pause('alpha');
      chorus.resume('alpha');

      const log = chorus.getEventLog();
      expect(log.length).toBeGreaterThan(0);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      chorus.pause('alpha');
      chorus.reset();

      expect(chorus.getAllAgentStates()).toHaveLength(0);
      expect(chorus.getEventLog()).toHaveLength(0);
      expect(chorus.isPaused()).toBe(false);
    });
  });
});
