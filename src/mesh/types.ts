/**
 * Mesh type system -- Zod schemas and TypeScript types for the Mesh Discovery layer.
 *
 * Defines MeshNode, NodeCapability, HeartbeatConfig, and MeshEvent schemas.
 * Pure type definitions -- no IO, no side effects.
 *
 * IMP-03: All mesh thresholds and defaults are exported as named constants.
 */

import { z } from 'zod';

// ============================================================================
// Constants (IMP-03: Threshold registry -- Wave 3 constants)
// ============================================================================

/** Default heartbeat interval in milliseconds. Nodes should ping at this frequency. */
export const DEFAULT_HEARTBEAT_INTERVAL_MS = 30000;

/** Maximum consecutive missed heartbeats before a node is evicted. */
export const MAX_MISSED_HEARTBEATS = 3;

/** Interval at which the DiscoveryService checks for stale nodes (ms). */
export const DEFAULT_CHECK_INTERVAL_MS = 10000;

/** Version of the mesh event log format. Increment when schema changes. */
export const MESH_EVENT_LOG_VERSION = 1;

// ============================================================================
// NodeCapabilitySchema
// ============================================================================

/**
 * Advertised capabilities of a single chip on a mesh node.
 * Nodes may advertise multiple chips, each with its own capability set.
 */
export const NodeCapabilitySchema = z.object({
  /** Human-readable chip name (matches ChipConfig.name) */
  chipName: z.string().min(1),
  /** List of model identifiers available on this chip */
  models: z.array(z.string()),
  /** Maximum context window length in tokens */
  maxContextLength: z.number().int().positive(),
});

/** TypeScript type for node capabilities */
export type NodeCapability = z.infer<typeof NodeCapabilitySchema>;

// ============================================================================
// MeshNodeSchema
// ============================================================================

/**
 * A registered mesh node that can receive and route DACP bundles.
 * Created on registration; updated on heartbeat; status transitions on eviction.
 */
export const MeshNodeSchema = z.object({
  /** Unique identifier for this node (UUID v4) */
  nodeId: z.string().uuid(),
  /** Human-readable node name */
  name: z.string().min(1),
  /** HTTP endpoint where this node accepts DACP bundles */
  endpoint: z.string().url(),
  /** Capabilities advertised by this node's chips */
  capabilities: z.array(NodeCapabilitySchema),
  /** ISO 8601 timestamp of when this node first registered */
  registeredAt: z.string().datetime(),
  /** ISO 8601 timestamp of the most recent heartbeat */
  lastHeartbeat: z.string().datetime(),
  /** Current health status of this node */
  status: z.enum(['healthy', 'unhealthy', 'evicted']),
});

/** TypeScript type for a mesh node */
export type MeshNode = z.infer<typeof MeshNodeSchema>;

// ============================================================================
// HeartbeatConfigSchema
// ============================================================================

/**
 * Configuration for heartbeat monitoring and stale node eviction.
 * All fields have defaults matching the exported constants.
 */
export const HeartbeatConfigSchema = z.object({
  /** How often nodes are expected to send heartbeats (ms) */
  intervalMs: z.number().int().positive().default(DEFAULT_HEARTBEAT_INTERVAL_MS),
  /** Number of missed heartbeats before a node is evicted */
  maxMissed: z.number().int().positive().default(MAX_MISSED_HEARTBEATS),
  /** How often the DiscoveryService checks for stale nodes (ms) */
  checkIntervalMs: z.number().int().positive().default(DEFAULT_CHECK_INTERVAL_MS),
});

/** TypeScript type for heartbeat configuration */
export type HeartbeatConfig = z.infer<typeof HeartbeatConfigSchema>;

// ============================================================================
// MeshEventSchema
// ============================================================================

/**
 * All event types that can be written to the mesh event log.
 */
export const MeshEventTypeSchema = z.enum([
  'register',
  'deregister',
  'heartbeat',
  'eviction',
  'health-change',
]);

/** TypeScript type for mesh event types */
export type MeshEventType = z.infer<typeof MeshEventTypeSchema>;

/**
 * A single entry in the append-only mesh event log.
 * Written for every node lifecycle event (register, heartbeat, eviction, deregister).
 */
export const MeshEventSchema = z.object({
  /** Unique identifier for this event (UUID v4) */
  id: z.string().uuid(),
  /** ISO 8601 timestamp of when this event was recorded */
  timestamp: z.string().datetime(),
  /** ID of the node this event relates to */
  nodeId: z.string(),
  /** What happened */
  eventType: MeshEventTypeSchema,
  /** Structured context payload -- varies by eventType */
  payload: z.record(z.string(), z.unknown()),
});

/** TypeScript type for mesh events */
export type MeshEvent = z.infer<typeof MeshEventSchema>;
