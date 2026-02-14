import { describe, it, expect, vi } from 'vitest';
import { SessionEventBridge } from './session-events.js';
import { LifecycleSync } from '../copper/lifecycle-sync.js';
import type { GsdLifecycleEvent } from '../copper/types.js';
import type { SessionState } from './session-events.js';

// ============================================================================
// SessionEventBridge Tests
// ============================================================================

describe('SessionEventBridge', () => {
  // --------------------------------------------------------------------------
  // Construction
  // --------------------------------------------------------------------------

  describe('constructor', () => {
    it('creates with a LifecycleSync instance', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      expect(bridge).toBeDefined();
    });
  });

  // --------------------------------------------------------------------------
  // getTransitionEvent (static)
  // --------------------------------------------------------------------------

  describe('getTransitionEvent', () => {
    it('maps null -> active to session-start', () => {
      expect(SessionEventBridge.getTransitionEvent(null, 'active')).toBe('session-start');
    });

    it('maps active -> paused to session-pause', () => {
      expect(SessionEventBridge.getTransitionEvent('active', 'paused')).toBe('session-pause');
    });

    it('maps stalled -> paused to session-pause', () => {
      expect(SessionEventBridge.getTransitionEvent('stalled', 'paused')).toBe('session-pause');
    });

    it('maps paused -> active to session-resume', () => {
      expect(SessionEventBridge.getTransitionEvent('paused', 'active')).toBe('session-resume');
    });

    it('maps saved -> active to session-resume', () => {
      expect(SessionEventBridge.getTransitionEvent('saved', 'active')).toBe('session-resume');
    });

    it('maps active -> stopped to session-stop', () => {
      expect(SessionEventBridge.getTransitionEvent('active', 'stopped')).toBe('session-stop');
    });

    it('maps paused -> stopped to session-stop', () => {
      expect(SessionEventBridge.getTransitionEvent('paused', 'stopped')).toBe('session-stop');
    });

    it('maps stalled -> stopped to session-stop', () => {
      expect(SessionEventBridge.getTransitionEvent('stalled', 'stopped')).toBe('session-stop');
    });

    it('returns null for same-state transitions', () => {
      expect(SessionEventBridge.getTransitionEvent('active', 'active')).toBeNull();
      expect(SessionEventBridge.getTransitionEvent('paused', 'paused')).toBeNull();
      expect(SessionEventBridge.getTransitionEvent('stopped', 'stopped')).toBeNull();
    });

    it('returns null for undefined transitions', () => {
      expect(SessionEventBridge.getTransitionEvent('active', 'stalled')).toBeNull();
      expect(SessionEventBridge.getTransitionEvent('stopped', 'active')).toBeNull();
      expect(SessionEventBridge.getTransitionEvent('saved', 'paused')).toBeNull();
      expect(SessionEventBridge.getTransitionEvent('active', 'saved')).toBeNull();
    });
  });

  // --------------------------------------------------------------------------
  // onTransition
  // --------------------------------------------------------------------------

  describe('onTransition', () => {
    it('emits session-start on null -> active', () => {
      const sync = new LifecycleSync();
      const emitSpy = vi.spyOn(sync, 'emit');
      const bridge = new SessionEventBridge(sync);

      const result = bridge.onTransition(null, 'active');
      expect(result).toBe('session-start');
      expect(emitSpy).toHaveBeenCalledWith('session-start');
    });

    it('emits session-pause on active -> paused', () => {
      const sync = new LifecycleSync();
      const emitSpy = vi.spyOn(sync, 'emit');
      const bridge = new SessionEventBridge(sync);

      const result = bridge.onTransition('active', 'paused');
      expect(result).toBe('session-pause');
      expect(emitSpy).toHaveBeenCalledWith('session-pause');
    });

    it('emits session-resume on paused -> active', () => {
      const sync = new LifecycleSync();
      const emitSpy = vi.spyOn(sync, 'emit');
      const bridge = new SessionEventBridge(sync);

      const result = bridge.onTransition('paused', 'active');
      expect(result).toBe('session-resume');
      expect(emitSpy).toHaveBeenCalledWith('session-resume');
    });

    it('emits session-stop on active -> stopped', () => {
      const sync = new LifecycleSync();
      const emitSpy = vi.spyOn(sync, 'emit');
      const bridge = new SessionEventBridge(sync);

      const result = bridge.onTransition('active', 'stopped');
      expect(result).toBe('session-stop');
      expect(emitSpy).toHaveBeenCalledWith('session-stop');
    });

    it('returns null and does not emit for undefined transitions', () => {
      const sync = new LifecycleSync();
      const emitSpy = vi.spyOn(sync, 'emit');
      const bridge = new SessionEventBridge(sync);

      const result = bridge.onTransition('active', 'stalled');
      expect(result).toBeNull();
      expect(emitSpy).not.toHaveBeenCalled();
    });

    it('returns null and does not emit for same-state transitions', () => {
      const sync = new LifecycleSync();
      const emitSpy = vi.spyOn(sync, 'emit');
      const bridge = new SessionEventBridge(sync);

      const result = bridge.onTransition('active', 'active');
      expect(result).toBeNull();
      expect(emitSpy).not.toHaveBeenCalled();
    });
  });

  // --------------------------------------------------------------------------
  // fromMetaJson
  // --------------------------------------------------------------------------

  describe('fromMetaJson', () => {
    it('parses active status from meta.json', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      const result = bridge.fromMetaJson(JSON.stringify({ status: 'active' }));
      expect(result).toBe('active');
    });

    it('parses paused status from meta.json', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      const result = bridge.fromMetaJson(JSON.stringify({ status: 'paused' }));
      expect(result).toBe('paused');
    });

    it('parses stopped status from meta.json', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      const result = bridge.fromMetaJson(JSON.stringify({ status: 'stopped' }));
      expect(result).toBe('stopped');
    });

    it('parses stalled status from meta.json', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      const result = bridge.fromMetaJson(JSON.stringify({ status: 'stalled' }));
      expect(result).toBe('stalled');
    });

    it('parses saved status from meta.json', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      const result = bridge.fromMetaJson(JSON.stringify({ status: 'saved' }));
      expect(result).toBe('saved');
    });

    it('throws on invalid JSON', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      expect(() => bridge.fromMetaJson('not json')).toThrow();
    });

    it('throws on missing status field', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      expect(() => bridge.fromMetaJson(JSON.stringify({ name: 'test' }))).toThrow();
    });

    it('throws on invalid status value', () => {
      const sync = new LifecycleSync();
      const bridge = new SessionEventBridge(sync);
      expect(() => bridge.fromMetaJson(JSON.stringify({ status: 'invalid' }))).toThrow();
    });
  });
});
