/**
 * AMIGA agent registry and event routing table.
 *
 * Provides canonical identifiers for all 14 agents across 5 teams and a
 * routing table mapping 11 event types to sender/receiver pairs. The registry
 * is the phone book of the AMIGA system -- the message bus uses it to dispatch
 * events to the correct agents.
 *
 * Teams:
 * - CS (Command Staff): 3 agents on MC-1
 * - ME (Mission Execution): 3 agents on ME-1
 * - CE (Chief Engineer): 3 agents on CE-1
 * - GL (Gate Lead): 2 agents on GL-1
 * - OPS (Operations): 3 agents, cross-cutting
 *
 * All data structures are frozen ReadonlyMaps. Lookup functions are pure
 * with no side effects.
 */

import type { TeamPrefix } from './types.js';

// ============================================================================
// Types
// ============================================================================

/** Canonical entry for a registered agent. */
export interface AgentEntry {
  /** Agent identifier (validates against AgentIDSchema). */
  id: string;
  /** Team prefix: CS, ME, CE, GL, or OPS. */
  team: string;
  /** Human-readable role description. */
  name: string;
  /** Component assignment: MC-1, ME-1, CE-1, GL-1, or 'cross-cutting'. */
  component: string;
}

/** Routing entry for an event type. */
export interface RouteEntry {
  /** Sender agent/component pattern (e.g., 'ME-1', 'any'). */
  sender: string;
  /** Receiver agent/component pattern (e.g., 'MC-1', 'OPS'). */
  receiver: string;
  /** Whether the sender requires acknowledgement from the receiver. */
  requiresAck: boolean;
}

// ============================================================================
// Agent Registry Data
// ============================================================================

const AGENT_DATA: readonly AgentEntry[] = [
  // CS -- Command Staff (MC-1)
  { id: 'CS-1', team: 'CS', name: 'Dashboard layout & telemetry rendering', component: 'MC-1' },
  { id: 'CS-2', team: 'CS', name: 'Command parser & validation', component: 'MC-1' },
  { id: 'CS-3', team: 'CS', name: 'Alert/gate rendering & acceptance testing', component: 'MC-1' },

  // ME -- Mission Execution (ME-1)
  { id: 'ME-1', team: 'ME', name: 'Provisioning & manifest management', component: 'ME-1' },
  { id: 'ME-2', team: 'ME', name: 'Phase engine & swarm coordinator', component: 'ME-1' },
  { id: 'ME-3', team: 'ME', name: 'Telemetry emitter & archive writer', component: 'ME-1' },

  // CE -- Chief Engineer (CE-1)
  { id: 'CE-1', team: 'CE', name: 'Attribution ledger schema & token architecture', component: 'CE-1' },
  { id: 'CE-2', team: 'CE', name: 'Contribution registry & weighting engine', component: 'CE-1' },
  { id: 'CE-3', team: 'CE', name: 'Invocation recorder & dividend calculator', component: 'CE-1' },

  // GL -- Gate Lead (GL-1)
  { id: 'GL-1', team: 'GL', name: 'Charter document & rules engine', component: 'GL-1' },
  { id: 'GL-2', team: 'GL', name: 'Weighting algorithm spec & policy query', component: 'GL-1' },

  // OPS -- Operations (cross-cutting)
  { id: 'OPS-1', team: 'OPS', name: 'ICD authoring & agent registry', component: 'cross-cutting' },
  { id: 'OPS-2', team: 'OPS', name: 'Schema validation & integration tests', component: 'cross-cutting' },
  { id: 'OPS-3', team: 'OPS', name: 'Go/No-Go gate runner & cross-references', component: 'cross-cutting' },
] as const;

/** Frozen registry mapping agent IDs to their canonical entries. */
export const AGENT_REGISTRY: ReadonlyMap<string, AgentEntry> = new Map(
  AGENT_DATA.map((agent) => [agent.id, agent]),
);

// ============================================================================
// Routing Table Data
// ============================================================================

const ROUTE_DATA: readonly [string, RouteEntry][] = [
  ['TELEMETRY_UPDATE', { sender: 'ME-1', receiver: 'MC-1', requiresAck: false }],
  ['ALERT_SURFACE', { sender: 'ME-1', receiver: 'MC-1', requiresAck: false }],
  ['GATE_SIGNAL', { sender: 'ME-1', receiver: 'MC-1', requiresAck: true }],
  ['GATE_RESPONSE', { sender: 'MC-1', receiver: 'ME-1', requiresAck: false }],
  ['COMMAND_DISPATCH', { sender: 'MC-1', receiver: 'ME-1', requiresAck: true }],
  ['RESOURCE_LOCK_REQ', { sender: 'any', receiver: 'OPS', requiresAck: true }],
  ['RESOURCE_LOCK_ACK', { sender: 'OPS', receiver: 'any', requiresAck: false }],
  ['SKILL_REQUEST', { sender: 'any', receiver: 'ME-1', requiresAck: true }],
  ['LEDGER_ENTRY', { sender: 'ME-1', receiver: 'CE-1', requiresAck: false }],
  ['DIVIDEND_CALC_REQ', { sender: 'MC-1', receiver: 'CE-1', requiresAck: true }],
  ['GOVERNANCE_QUERY', { sender: 'MC-1', receiver: 'GL-1', requiresAck: true }],
] as const;

/** Frozen routing table mapping event types to sender/receiver pairs. */
export const ROUTING_TABLE: ReadonlyMap<string, RouteEntry> = new Map(ROUTE_DATA);

// ============================================================================
// Lookup Functions
// ============================================================================

/**
 * Look up an agent by canonical ID.
 *
 * @param id - Agent identifier (e.g., 'CS-1', 'ME-2')
 * @returns The agent entry, or undefined if not found
 */
export function getAgent(id: string): AgentEntry | undefined {
  return AGENT_REGISTRY.get(id);
}

/**
 * List all agents belonging to a team.
 *
 * @param team - Team prefix (CS, ME, CE, GL, OPS)
 * @returns Array of agent entries for the team (empty if team unknown)
 */
export function getTeamAgents(team: string): AgentEntry[] {
  return AGENT_DATA.filter((agent) => agent.team === team);
}

/**
 * Get all registered agents.
 *
 * @returns Array of all 14 agent entries
 */
export function getAllAgents(): AgentEntry[] {
  return [...AGENT_DATA];
}

/**
 * Look up the routing entry for an event type.
 *
 * @param eventType - Event type name (e.g., 'TELEMETRY_UPDATE')
 * @returns The route entry with sender, receiver, and ack requirement,
 *          or undefined if event type not found
 */
export function getRoute(eventType: string): RouteEntry | undefined {
  return ROUTING_TABLE.get(eventType);
}

/**
 * Get all registered routes.
 *
 * @returns Array of all 11 route entries
 */
export function getAllRoutes(): RouteEntry[] {
  return [...ROUTING_TABLE.values()];
}
