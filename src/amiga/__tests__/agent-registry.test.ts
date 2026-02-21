/**
 * Tests for the AMIGA agent registry and event routing table.
 *
 * Covers:
 * - Individual agent lookup by canonical ID
 * - Team-based agent listing for all 5 teams
 * - Full registry enumeration (14 agents)
 * - Event routing table lookup (11 event types)
 * - Graceful undefined return for unknown IDs and events
 * - AgentIDSchema validation for all registered agent IDs
 */

import { describe, it, expect } from 'vitest';
import {
  getAgent,
  getAllAgents,
  getTeamAgents,
  getRoute,
  getAllRoutes,
  AGENT_REGISTRY,
  ROUTING_TABLE,
} from '../agent-registry.js';
import { AgentIDSchema } from '../types.js';

describe('Agent Registry', () => {
  describe('getAgent', () => {
    it('returns CS-1 with correct team and component', () => {
      const agent = getAgent('CS-1');
      expect(agent).toEqual({
        id: 'CS-1',
        team: 'CS',
        name: 'Dashboard layout & telemetry rendering',
        component: 'MC-1',
      });
    });

    it('returns ME-2 with correct team and component', () => {
      const agent = getAgent('ME-2');
      expect(agent).toEqual({
        id: 'ME-2',
        team: 'ME',
        name: 'Phase engine & swarm coordinator',
        component: 'ME-1',
      });
    });

    it('returns CE-3 with correct team and component', () => {
      const agent = getAgent('CE-3');
      expect(agent).toBeDefined();
      expect(agent!.id).toBe('CE-3');
      expect(agent!.team).toBe('CE');
      expect(agent!.component).toBe('CE-1');
    });

    it('returns GL-1 with correct team and component', () => {
      const agent = getAgent('GL-1');
      expect(agent).toBeDefined();
      expect(agent!.id).toBe('GL-1');
      expect(agent!.team).toBe('GL');
      expect(agent!.component).toBe('GL-1');
    });

    it('returns OPS-1 with cross-cutting component', () => {
      const agent = getAgent('OPS-1');
      expect(agent).toBeDefined();
      expect(agent!.id).toBe('OPS-1');
      expect(agent!.team).toBe('OPS');
      expect(agent!.component).toBe('cross-cutting');
    });

    it('returns undefined for unknown agent ID', () => {
      expect(getAgent('XX-99')).toBeUndefined();
    });
  });

  describe('getAllAgents', () => {
    it('returns all 14 agents', () => {
      const agents = getAllAgents();
      expect(agents).toHaveLength(14);
    });
  });

  describe('getTeamAgents', () => {
    it('returns 3 agents for CS team', () => {
      const agents = getTeamAgents('CS');
      expect(agents).toHaveLength(3);
      expect(agents.every((a) => a.team === 'CS')).toBe(true);
    });

    it('returns 3 agents for ME team', () => {
      const agents = getTeamAgents('ME');
      expect(agents).toHaveLength(3);
      expect(agents.every((a) => a.team === 'ME')).toBe(true);
    });

    it('returns 3 agents for CE team', () => {
      const agents = getTeamAgents('CE');
      expect(agents).toHaveLength(3);
      expect(agents.every((a) => a.team === 'CE')).toBe(true);
    });

    it('returns 2 agents for GL team', () => {
      const agents = getTeamAgents('GL');
      expect(agents).toHaveLength(2);
      expect(agents.every((a) => a.team === 'GL')).toBe(true);
    });

    it('returns 3 agents for OPS team', () => {
      const agents = getTeamAgents('OPS');
      expect(agents).toHaveLength(3);
      expect(agents.every((a) => a.team === 'OPS')).toBe(true);
    });
  });

  describe('AgentID validation', () => {
    it('every registered agent ID validates against AgentIDSchema', () => {
      const agents = getAllAgents();
      for (const agent of agents) {
        const result = AgentIDSchema.safeParse(agent.id);
        expect(result.success, `Agent ID '${agent.id}' should validate`).toBe(true);
      }
    });
  });
});

describe('Routing Table', () => {
  describe('getRoute', () => {
    it('routes TELEMETRY_UPDATE from ME-1 to MC-1 without ack', () => {
      expect(getRoute('TELEMETRY_UPDATE')).toEqual({
        sender: 'ME-1',
        receiver: 'MC-1',
        requiresAck: false,
      });
    });

    it('routes ALERT_SURFACE from ME-1 to MC-1 without ack', () => {
      expect(getRoute('ALERT_SURFACE')).toEqual({
        sender: 'ME-1',
        receiver: 'MC-1',
        requiresAck: false,
      });
    });

    it('routes GATE_SIGNAL from ME-1 to MC-1 with ack', () => {
      expect(getRoute('GATE_SIGNAL')).toEqual({
        sender: 'ME-1',
        receiver: 'MC-1',
        requiresAck: true,
      });
    });

    it('routes GATE_RESPONSE from MC-1 to ME-1 without ack', () => {
      expect(getRoute('GATE_RESPONSE')).toEqual({
        sender: 'MC-1',
        receiver: 'ME-1',
        requiresAck: false,
      });
    });

    it('routes COMMAND_DISPATCH from MC-1 to ME-1 with ack', () => {
      expect(getRoute('COMMAND_DISPATCH')).toEqual({
        sender: 'MC-1',
        receiver: 'ME-1',
        requiresAck: true,
      });
    });

    it('routes LEDGER_ENTRY from ME-1 to CE-1 without ack', () => {
      expect(getRoute('LEDGER_ENTRY')).toEqual({
        sender: 'ME-1',
        receiver: 'CE-1',
        requiresAck: false,
      });
    });

    it('routes DIVIDEND_CALC_REQ from MC-1 to CE-1 with ack', () => {
      expect(getRoute('DIVIDEND_CALC_REQ')).toEqual({
        sender: 'MC-1',
        receiver: 'CE-1',
        requiresAck: true,
      });
    });

    it('routes GOVERNANCE_QUERY from MC-1 to GL-1 with ack', () => {
      expect(getRoute('GOVERNANCE_QUERY')).toEqual({
        sender: 'MC-1',
        receiver: 'GL-1',
        requiresAck: true,
      });
    });

    it('routes RESOURCE_LOCK_REQ from any to OPS with ack', () => {
      expect(getRoute('RESOURCE_LOCK_REQ')).toEqual({
        sender: 'any',
        receiver: 'OPS',
        requiresAck: true,
      });
    });

    it('routes RESOURCE_LOCK_ACK from OPS to any without ack', () => {
      expect(getRoute('RESOURCE_LOCK_ACK')).toEqual({
        sender: 'OPS',
        receiver: 'any',
        requiresAck: false,
      });
    });

    it('routes SKILL_REQUEST from any to ME-1 with ack', () => {
      expect(getRoute('SKILL_REQUEST')).toEqual({
        sender: 'any',
        receiver: 'ME-1',
        requiresAck: true,
      });
    });

    it('returns undefined for unknown event type', () => {
      expect(getRoute('UNKNOWN_EVENT')).toBeUndefined();
    });
  });

  describe('getAllRoutes', () => {
    it('returns all 11 routes', () => {
      const routes = getAllRoutes();
      expect(routes).toHaveLength(11);
    });
  });
});
