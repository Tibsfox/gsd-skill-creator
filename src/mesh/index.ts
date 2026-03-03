/**
 * Mesh Discovery module barrel exports.
 *
 * Re-exports all public types, schemas, constants, and service classes
 * for the mesh node discovery and heartbeat monitoring layer.
 */

// Types and schemas
export {
  NodeCapabilitySchema,
  MeshNodeSchema,
  HeartbeatConfigSchema,
  MeshEventTypeSchema,
  MeshEventSchema,
  // IMP-03 constants
  DEFAULT_HEARTBEAT_INTERVAL_MS,
  MAX_MISSED_HEARTBEATS,
  DEFAULT_CHECK_INTERVAL_MS,
  MESH_EVENT_LOG_VERSION,
} from './types.js';

export type {
  NodeCapability,
  MeshNode,
  HeartbeatConfig,
  MeshEventType,
  MeshEvent,
} from './types.js';

// Event log
export {
  buildMeshEvent,
  writeMeshEvent,
  readMeshEvents,
  MeshEventLog,
} from './event-log.js';

export type { WriteMeshEventInput } from './event-log.js';

// Discovery service
export {
  DiscoveryService,
  createDiscoveryService,
} from './discovery.js';

export type { RegisterNodeInput } from './discovery.js';
