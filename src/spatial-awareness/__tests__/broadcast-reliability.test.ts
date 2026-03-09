/**
 * Wave 3B: 50-Signal Broadcast Reliability Test
 *
 * CF-12: zero missed broadcasts.
 * 5 agents, 50 broadcasts, every agent receives every message.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CommBus, createCommBus } from '../comm-bus.js';
import type { CoordinationMessage } from '../types.js';

// ============================================================================
// Helpers
// ============================================================================

const AGENT_IDS = ['agent-0', 'agent-1', 'agent-2', 'agent-3', 'agent-4'];
const BROADCAST_COUNT = 50;

function setupBusWithAgents(): {
  bus: CommBus;
  received: Map<string, CoordinationMessage[]>;
} {
  const bus = createCommBus();
  const received = new Map<string, CoordinationMessage[]>();

  for (const id of AGENT_IDS) {
    bus.registerAgent(id);
    received.set(id, []);
    bus.subscribe(id, 'BROADCAST', (msg) => {
      received.get(id)!.push(msg);
    });
  }

  return { bus, received };
}

// ============================================================================
// Tests
// ============================================================================

describe('Wave 3B: 50-Signal Broadcast Reliability', () => {
  let bus: CommBus;
  let received: Map<string, CoordinationMessage[]>;

  beforeEach(() => {
    const setup = setupBusWithAgents();
    bus = setup.bus;
    received = setup.received;
  });

  describe('CF-12: Zero missed broadcasts', () => {
    it('delivers 50 broadcasts to all 5 agents with zero misses', () => {
      // Send 50 broadcasts from rotating senders
      for (let i = 0; i < BROADCAST_COUNT; i++) {
        const sender = AGENT_IDS[i % AGENT_IDS.length];
        bus.emit(sender, 'BROADCAST', 'BASELINE', {
          sequence: i,
          payload: `broadcast-${i}`,
        });
      }

      const stats = bus.getStats();
      expect(stats.totalSent).toBe(BROADCAST_COUNT);
      expect(stats.missedBroadcasts).toBe(0);

      // Each agent should receive all broadcasts except the ones they sent
      for (const agentId of AGENT_IDS) {
        const agentMessages = received.get(agentId)!;
        const sentByAgent = Math.ceil(BROADCAST_COUNT / AGENT_IDS.length);
        const expectedReceived = BROADCAST_COUNT - sentByAgent;
        expect(agentMessages.length).toBe(expectedReceived);
      }
    });

    it('total delivered count matches expected (N * (agents - 1))', () => {
      // Single sender sends all 50
      for (let i = 0; i < BROADCAST_COUNT; i++) {
        bus.emit('agent-0', 'BROADCAST', 'BASELINE', { sequence: i });
      }

      const stats = bus.getStats();
      // agent-0 sends, 4 other agents receive each
      expect(stats.totalDelivered).toBe(BROADCAST_COUNT * (AGENT_IDS.length - 1));
      expect(stats.missedBroadcasts).toBe(0);
    });

    it('each non-sender agent receives exactly 50 messages', () => {
      for (let i = 0; i < BROADCAST_COUNT; i++) {
        bus.emit('agent-0', 'BROADCAST', 'BASELINE', { sequence: i });
      }

      for (const agentId of AGENT_IDS) {
        const msgs = received.get(agentId)!;
        if (agentId === 'agent-0') {
          expect(msgs.length).toBe(0); // sender doesn't receive own broadcasts
        } else {
          expect(msgs.length).toBe(BROADCAST_COUNT);
        }
      }
    });
  });

  describe('message integrity', () => {
    it('all messages maintain sequence ordering', () => {
      for (let i = 0; i < BROADCAST_COUNT; i++) {
        bus.emit('agent-0', 'BROADCAST', 'BASELINE', { sequence: i });
      }

      for (const agentId of AGENT_IDS.filter(id => id !== 'agent-0')) {
        const msgs = received.get(agentId)!;
        for (let i = 0; i < msgs.length; i++) {
          expect((msgs[i].payload as any).sequence).toBe(i);
        }
      }
    });

    it('message payloads are preserved intact', () => {
      const testPayload = { data: 'test-value', nested: { key: 42 } };
      bus.emit('agent-0', 'BROADCAST', 'BASELINE', testPayload);

      for (const agentId of AGENT_IDS.filter(id => id !== 'agent-0')) {
        const msgs = received.get(agentId)!;
        expect(msgs.length).toBe(1);
        expect((msgs[0].payload as any).data).toBe('test-value');
        expect((msgs[0].payload as any).nested.key).toBe(42);
      }
    });

    it('message tier is BROADCAST for all delivered messages', () => {
      for (let i = 0; i < 10; i++) {
        bus.emit('agent-0', 'BROADCAST', 'BASELINE', { i });
      }

      for (const agentId of AGENT_IDS.filter(id => id !== 'agent-0')) {
        const msgs = received.get(agentId)!;
        for (const msg of msgs) {
          expect(msg.tier).toBe('BROADCAST');
        }
      }
    });
  });

  describe('concurrent multi-sender broadcasts', () => {
    it('handles interleaved broadcasts from all agents', () => {
      // Each agent sends 10 broadcasts in round-robin
      for (let round = 0; round < 10; round++) {
        for (const sender of AGENT_IDS) {
          bus.emit(sender, 'BROADCAST', 'BASELINE', {
            round,
            sender,
          });
        }
      }

      const stats = bus.getStats();
      // 5 agents * 10 rounds = 50 total broadcasts
      expect(stats.totalSent).toBe(50);
      expect(stats.missedBroadcasts).toBe(0);

      // Each agent sent 10, received 40 (10 per other agent * 4 other agents)
      for (const agentId of AGENT_IDS) {
        const msgs = received.get(agentId)!;
        expect(msgs.length).toBe(40);
      }
    });

    it('no agent receives its own broadcast', () => {
      for (let i = 0; i < BROADCAST_COUNT; i++) {
        const sender = AGENT_IDS[i % AGENT_IDS.length];
        bus.emit(sender, 'BROADCAST', 'BASELINE', { sender, i });
      }

      for (const agentId of AGENT_IDS) {
        const msgs = received.get(agentId)!;
        for (const msg of msgs) {
          expect(msg.sender).not.toBe(agentId);
        }
      }
    });
  });

  describe('tier isolation', () => {
    it('COVERT messages are invisible to non-recipients', () => {
      // Subscribe agent-1 to covert
      const covertReceived: CoordinationMessage[] = [];
      bus.subscribe('agent-1', 'COVERT', (msg) => covertReceived.push(msg));

      bus.emit('agent-0', 'COVERT', 'BASELINE', { secret: true }, ['agent-1']);

      // Only agent-1 sees the message
      expect(covertReceived.length).toBe(1);
      // Other agents' broadcast handlers should NOT see it
      expect(received.get('agent-2')!.length).toBe(0);
      expect(received.get('agent-3')!.length).toBe(0);
    });

    it('DIRECTED messages only reach named recipients', () => {
      const directedReceived: CoordinationMessage[] = [];
      bus.subscribe('agent-2', 'DIRECTED', (msg) => directedReceived.push(msg));

      bus.emit('agent-0', 'DIRECTED', 'BASELINE', { target: true }, ['agent-2']);

      expect(directedReceived.length).toBe(1);
      // Broadcast handlers on other agents should not fire
      expect(received.get('agent-1')!.length).toBe(0);
      expect(received.get('agent-3')!.length).toBe(0);
    });

    it('broadcast + directed + covert can coexist without interference', () => {
      const directedReceived: CoordinationMessage[] = [];
      const covertReceived: CoordinationMessage[] = [];
      bus.subscribe('agent-1', 'DIRECTED', (msg) => directedReceived.push(msg));
      bus.subscribe('agent-2', 'COVERT', (msg) => covertReceived.push(msg));

      // 10 of each tier
      for (let i = 0; i < 10; i++) {
        bus.emit('agent-0', 'BROADCAST', 'BASELINE', { type: 'broadcast', i });
        bus.emit('agent-0', 'DIRECTED', 'BASELINE', { type: 'directed', i }, ['agent-1']);
        bus.emit('agent-0', 'COVERT', 'BASELINE', { type: 'covert', i }, ['agent-2']);
      }

      const stats = bus.getStats();
      expect(stats.byTier.BROADCAST).toBe(10);
      expect(stats.byTier.DIRECTED).toBe(10);
      expect(stats.byTier.COVERT).toBe(10);

      // Broadcast: each non-sender gets 10
      for (const id of AGENT_IDS.filter(a => a !== 'agent-0')) {
        expect(received.get(id)!.length).toBe(10);
      }

      // Directed: only agent-1
      expect(directedReceived.length).toBe(10);

      // Covert: only agent-2
      expect(covertReceived.length).toBe(10);
    });
  });

  describe('bus statistics accuracy', () => {
    it('stats reflect exact send/delivery counts after 50 broadcasts', () => {
      for (let i = 0; i < BROADCAST_COUNT; i++) {
        bus.emit('agent-0', 'BROADCAST', 'BASELINE', { i });
      }

      const stats = bus.getStats();
      expect(stats.totalSent).toBe(BROADCAST_COUNT);
      expect(stats.totalDelivered).toBe(BROADCAST_COUNT * 4);
      expect(stats.byTier.BROADCAST).toBe(BROADCAST_COUNT);
      expect(stats.missedBroadcasts).toBe(0);
      expect(stats.lastMessageTimestamp).not.toBeNull();
    });
  });
});
