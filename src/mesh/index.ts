/**
 * Mesh module barrel exports.
 *
 * Re-exports all public types, schemas, constants, and service classes for:
 * - Mesh node discovery and heartbeat monitoring (Plan 02)
 * - DACP bundle provenance tracking (Plan 03)
 * - Fidelity-adaptive compression (Plan 03)
 * - Mesh bundle transport with routing and relay (Plan 03)
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

// Provenance tracking
export {
  ProvenanceHeaderSchema,
  createProvenanceHeader,
  addHop,
  getTotalHops,
  serializeProvenance,
  parseProvenance,
} from './provenance.js';

export type { ProvenanceHeader, HopEntry } from './provenance.js';

// Fidelity adapter
export {
  TransportConditionSchema,
  assessTransportCondition,
  compressBundle,
  decompressBundle,
  // IMP-03 constants
  LOCAL_LATENCY_THRESHOLD_MS,
  MESH_LATENCY_THRESHOLD_MS,
} from './fidelity-adapter.js';

export type { TransportCondition, CompressionResult } from './fidelity-adapter.js';

// Mesh transport
export {
  TransportResultSchema,
  MeshTransport,
  createMeshTransport,
} from './transport.js';

export type { TransportResult, TransportPayload, ReceiveResult } from './transport.js';
