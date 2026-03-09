/**
 * CommBus tests — Multi-Tier Communication Bus
 * CF-11: Broadcast delivery to all agents within 1 second
 * CF-12: Zero missed broadcasts across 50 test signals
 * CF-13: Covert invisibility — non-recipients have zero visibility
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommBus, createCommBus, SIGNAL_FILES } from '../comm-bus.js';
import type { CoordinationMessage } from '../types.js';

describe('CommBus', () => {
  let bus: CommBus;

  beforeEach(() => {
    bus = createCommBus();
    bus.registerAgent('alpha');
    bus.registerAgent('bravo');
    bus.registerAgent('charlie');
    bus.registerAgent('delta');
    bus.registerAgent('echo');
  });

  describe('agent registration', () => {
    it('registers and lists agents', () => {
      expect(bus.getRegisteredAgents()).toHaveLength(5);
      expect(bus.getRegisteredAgents()).toContain('alpha');
    });

    it('unregisters agents and cleans subscriptions', () => {
      bus.subscribe('alpha', 'BROADCAST', () => {});
      bus.unregisterAgent('alpha');
      expect(bus.getRegisteredAgents()).not.toContain('alpha');
    });

    it('throws when subscribing unregistered agent', () => {
      expect(() => bus.subscribe('unknown', 'BROADCAST', () => {}))
        .toThrow('not registered');
    });
  });

  describe('BROADCAST tier (CF-11)', () => {
    it('delivers broadcast to all agents within 1 second', () => {
      const received: string[] = [];
      for (const id of ['alpha', 'bravo', 'charlie', 'delta', 'echo']) {
        bus.subscribe(id, 'BROADCAST', () => { received.push(id); });
      }

      const start = Date.now();
      bus.emit('alpha', 'BROADCAST', 'BASELINE');
      const elapsed = Date.now() - start;

      // alpha is sender, should not receive own broadcast
      expect(received).toHaveLength(4);
      expect(received).not.toContain('alpha');
      expect(elapsed).toBeLessThan(1000); // CF-11
    });
  });

  describe('zero missed broadcasts (CF-12)', () => {
    it('delivers all 50 test signals with zero misses', () => {
      const counts: Record<string, number> = {};
      for (const id of ['bravo', 'charlie', 'delta', 'echo']) {
        counts[id] = 0;
        bus.subscribe(id, 'BROADCAST', () => { counts[id]++; });
      }

      for (let i = 0; i < 50; i++) {
        bus.emit('alpha', 'BROADCAST', 'BASELINE', { seq: i });
      }

      // Each non-sender agent should receive exactly 50
      for (const id of ['bravo', 'charlie', 'delta', 'echo']) {
        expect(counts[id]).toBe(50);
      }

      expect(bus.getStats().missedBroadcasts).toBe(0);
    });
  });

  describe('COVERT tier (CF-13)', () => {
    it('delivers only to explicit recipients', () => {
      const received: Record<string, CoordinationMessage[]> = {
        alpha: [], bravo: [], charlie: [],
      };
      bus.subscribe('alpha', 'COVERT', (m) => { received.alpha.push(m); });
      bus.subscribe('bravo', 'COVERT', (m) => { received.bravo.push(m); });
      bus.subscribe('charlie', 'COVERT', (m) => { received.charlie.push(m); });

      bus.emit('alpha', 'COVERT', 'BASELINE', { secret: true }, ['bravo']);

      expect(received.bravo).toHaveLength(1);
      expect(received.alpha).toHaveLength(0); // sender
      expect(received.charlie).toHaveLength(0); // not a recipient
    });

    it('non-recipients have zero visibility of covert messages', () => {
      bus.emit('alpha', 'COVERT', 'BASELINE', { secret: 'data' }, ['bravo']);

      const charlieVisible = bus.getVisibleMessages('charlie');
      const bravoVisible = bus.getVisibleMessages('bravo');

      expect(charlieVisible).toHaveLength(0);
      expect(bravoVisible).toHaveLength(1);
    });
  });

  describe('DIRECTED tier', () => {
    it('delivers to named recipients only', () => {
      const received: string[] = [];
      bus.subscribe('bravo', 'DIRECTED', () => { received.push('bravo'); });
      bus.subscribe('charlie', 'DIRECTED', () => { received.push('charlie'); });
      bus.subscribe('delta', 'DIRECTED', () => { received.push('delta'); });

      bus.emit('alpha', 'DIRECTED', 'BASELINE', {}, ['bravo', 'charlie']);

      expect(received).toContain('bravo');
      expect(received).toContain('charlie');
      expect(received).not.toContain('delta');
    });
  });

  describe('signal extraction', () => {
    it('extracts signals from noisy message stream', () => {
      for (let i = 0; i < 30; i++) {
        bus.emit('alpha', 'BROADCAST', 'BASELINE', { noise: true });
      }
      for (let i = 0; i < 5; i++) {
        bus.emit('alpha', 'BROADCAST', 'SILENCE', { signal: true });
      }

      const all = bus.getMessages();
      const signals = bus.extractSignal(all, m => m.phase === 'SILENCE');

      expect(signals).toHaveLength(5);
      expect(all).toHaveLength(35);
    });
  });

  describe('signal file protocol', () => {
    it('defines correct signal file paths', () => {
      expect(SIGNAL_FILES.CHORUS_PAUSE).toBe('.planning/CHORUS_PAUSE');
      expect(SIGNAL_FILES.CHORUS_RESUME).toBe('.planning/CHORUS_RESUME');
    });

    it('emits and receives signal file events', () => {
      const events: unknown[] = [];
      bus.onSignal((e) => events.push(e));
      bus.emitSignal('CHORUS_PAUSE', { reason: 'test' });

      expect(events).toHaveLength(1);
    });
  });

  describe('message filtering', () => {
    it('filters by tier', () => {
      bus.emit('alpha', 'BROADCAST', 'BASELINE');
      bus.emit('alpha', 'COVERT', 'BASELINE', {}, ['bravo']);

      expect(bus.getMessages({ tier: 'BROADCAST' })).toHaveLength(1);
      expect(bus.getMessages({ tier: 'COVERT' })).toHaveLength(1);
    });

    it('filters by sender', () => {
      bus.subscribe('bravo', 'BROADCAST', () => {});
      bus.emit('alpha', 'BROADCAST', 'BASELINE');
      bus.emit('bravo', 'BROADCAST', 'BASELINE');

      expect(bus.getMessages({ sender: 'alpha' })).toHaveLength(1);
    });
  });

  describe('ALL tier subscription', () => {
    it('receives messages on any tier', () => {
      const received: CoordinationMessage[] = [];
      bus.subscribe('bravo', 'ALL', (m) => { received.push(m); });

      bus.emit('alpha', 'BROADCAST', 'BASELINE');
      bus.emit('alpha', 'DIRECTED', 'BASELINE', {}, ['bravo']);
      bus.emit('alpha', 'COVERT', 'BASELINE', {}, ['bravo']);

      expect(received).toHaveLength(3);
    });
  });

  describe('stats tracking', () => {
    it('tracks message counts per tier', () => {
      bus.subscribe('bravo', 'BROADCAST', () => {});
      bus.emit('alpha', 'BROADCAST', 'BASELINE');
      bus.emit('alpha', 'BROADCAST', 'BASELINE');

      const stats = bus.getStats();
      expect(stats.totalSent).toBe(2);
      expect(stats.byTier.BROADCAST).toBe(2);
    });
  });

  describe('reset', () => {
    it('clears all state', () => {
      bus.emit('alpha', 'BROADCAST', 'BASELINE');
      bus.reset();

      expect(bus.getRegisteredAgents()).toHaveLength(0);
      expect(bus.getMessages()).toHaveLength(0);
      expect(bus.getStats().totalSent).toBe(0);
    });
  });
});
