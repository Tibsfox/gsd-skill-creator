/**
 * MeshTransport -- routes DACP bundles between mesh nodes with provenance
 * tracking and fidelity-adaptive compression.
 *
 * Every bundle sent through MeshTransport carries:
 * - A ProvenanceHeader recording origin, each hop with timestamp, and hop count
 * - Compression adapted to the transport condition (local/mesh/remote)
 *
 * send():    Compress + create provenance header for outbound bundle
 * receive(): Decompress + add receiving node's hop to provenance
 * relay():   receive() at relay node + re-compress for next leg
 *
 * All operations return result objects (never throw on business logic failures).
 */

import { z } from 'zod';
import type { DiscoveryService } from './discovery.js';
import type { MeshEventLog } from './event-log.js';
import {
  createProvenanceHeader,
  addHop,
  serializeProvenance,
  parseProvenance,
  ProvenanceHeaderSchema,
} from './provenance.js';
import type { ProvenanceHeader } from './provenance.js';
import {
  assessTransportCondition,
  compressBundle,
  decompressBundle,
} from './fidelity-adapter.js';
import type { CompressionResult } from './fidelity-adapter.js';

// ============================================================================
// Schemas / Types
// ============================================================================

/**
 * Result returned by send() and relay().
 * Always check success before using other fields.
 */
export const TransportResultSchema = z.object({
  /** Whether the operation succeeded */
  success: z.boolean(),
  /** Provenance header (present on success) */
  provenance: ProvenanceHeaderSchema.optional(),
  /** Serialized provenance header string (for embedding in TransportPayload) */
  provenanceSerialized: z.string().optional(),
  /** Compression metadata (present on success) */
  compression: z
    .object({
      type: z.string(),
      originalSize: z.number(),
      compressedSize: z.number(),
    })
    .optional(),
  /** The compressed/encoded bundle data (present on success) */
  payload: z.string().optional(),
  /** Error message (present on failure) */
  error: z.string().optional(),
});

/** TypeScript type for transport results. */
export type TransportResult = z.infer<typeof TransportResultSchema>;

/**
 * An in-flight transport payload carrying compressed bundle data and
 * serialized provenance header.
 *
 * This is what nodes exchange: data is compressed, provenance is JSON string.
 */
export interface TransportPayload {
  /** Compressed (or identity) bundle data */
  data: string;
  /** Compression type ('none' | 'gzip-standard' | 'gzip-maximum') */
  compressionType: string;
  /** Serialized ProvenanceHeader JSON string */
  provenance: string;
}

/**
 * Result returned by receive().
 */
export interface ReceiveResult {
  success: boolean;
  /** Decompressed original bundle data (present on success) */
  bundleData?: string;
  /** Updated provenance header with this node's hop appended */
  provenance?: ProvenanceHeader;
  error?: string;
}

/**
 * Result returned by relay() -- produces a new TransportPayload for the next leg.
 * Extends TransportResult to carry the provenanceSerialized for embedding.
 */
export interface RelayResult extends TransportResult {
  // relayResult.payload is the re-compressed bundle for the next leg
  // relayResult.provenanceSerialized is the updated provenance for the next leg
}

// ============================================================================
// MeshTransport
// ============================================================================

/**
 * Routes DACP bundles between mesh nodes with provenance tracking and
 * fidelity-adaptive compression.
 *
 * Requires a DiscoveryService to resolve node information.
 * Optionally logs transport events to a MeshEventLog.
 */
export class MeshTransport {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly eventLog?: MeshEventLog,
  ) {}

  // ── send ──────────────────────────────────────────────────────────────────

  /**
   * Sends a DACP bundle from sourceNodeId to targetNodeId.
   *
   * Steps:
   * 1. Resolve source and target nodes from DiscoveryService
   * 2. Validate target is found and healthy
   * 3. Create provenance header from source node
   * 4. Assess transport condition (latency-based)
   * 5. Compress bundle for the assessed condition
   * 6. Return TransportResult with provenance, compression stats, and payload
   *
   * Returns { success: false, error: '...' } on validation failure (no throw).
   *
   * @param sourceNodeId - ID of the sending node
   * @param targetNodeId - ID of the intended recipient
   * @param bundleData - Bundle JSON string to send
   * @param latencyMs - Optional observed latency for fidelity assessment
   * @returns TransportResult
   */
  async send(
    sourceNodeId: string,
    targetNodeId: string,
    bundleData: string,
    latencyMs?: number,
  ): Promise<TransportResult> {
    // Resolve nodes
    const sourceNode = this.discoveryService.getNode(sourceNodeId);
    const targetNode = this.discoveryService.getNode(targetNodeId);

    if (!targetNode) {
      return { success: false, error: `Target node '${targetNodeId}' not found or unhealthy` };
    }

    if (targetNode.status !== 'healthy') {
      return { success: false, error: `Target node '${targetNodeId}' is unhealthy` };
    }

    // Create provenance header from source node
    const sourceName = sourceNode?.name ?? sourceNodeId;
    const provenance = createProvenanceHeader(sourceNodeId, sourceName);

    // Assess transport condition and compress
    const condition = assessTransportCondition(sourceNodeId, targetNodeId, latencyMs);
    const compressed: CompressionResult = compressBundle(bundleData, condition);

    // Log transport-send event if eventLog available
    if (this.eventLog) {
      await this.eventLog.write({
        nodeId: sourceNodeId,
        eventType: 'health-change', // use existing event type; transport events extend via payload
        payload: {
          type: 'transport-send',
          targetNodeId,
          condition,
          originalSize: compressed.originalSize,
          compressedSize: compressed.compressedSize,
        },
      });
    }

    const provenanceSerialized = serializeProvenance(provenance);

    return {
      success: true,
      provenance,
      provenanceSerialized,
      compression: {
        type: compressed.compressionType,
        originalSize: compressed.originalSize,
        compressedSize: compressed.compressedSize,
      },
      payload: compressed.data,
    };
  }

  // ── receive ───────────────────────────────────────────────────────────────

  /**
   * Receives a TransportPayload at the given node.
   *
   * Steps:
   * 1. Parse and validate provenance from payload
   * 2. Add hop entry for the receiving node
   * 3. Decompress bundle data
   * 4. Return ReceiveResult with decompressed data and updated provenance
   *
   * @param payload - TransportPayload from the sending node
   * @param receivingNodeId - ID of the receiving node
   * @param receivingNodeName - Human-readable name of the receiving node
   * @returns ReceiveResult
   */
  receive(
    payload: TransportPayload,
    receivingNodeId: string,
    receivingNodeName: string,
  ): ReceiveResult {
    try {
      const provenance = parseProvenance(payload.provenance);
      const updatedProvenance = addHop(provenance, receivingNodeId, receivingNodeName);
      const bundleData = decompressBundle(payload.data, payload.compressionType);

      return {
        success: true,
        bundleData,
        provenance: updatedProvenance,
      };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  // ── relay ─────────────────────────────────────────────────────────────────

  /**
   * Relays a TransportPayload through an intermediate node to the next target.
   *
   * Steps:
   * 1. Receive at relay node (decompress + add hop)
   * 2. Re-assess transport condition for relay -> nextTargetNodeId
   * 3. Re-compress for the next leg
   * 4. Return RelayResult with new payload, updated provenance, and compression stats
   *
   * @param payload - Inbound TransportPayload
   * @param relayNodeId - ID of the relay (current) node
   * @param relayNodeName - Human-readable name of the relay node
   * @param nextTargetNodeId - ID of the next hop target
   * @param latencyMs - Optional observed latency to the next target
   * @returns RelayResult (TransportResult shape with new payload for next leg)
   */
  relay(
    payload: TransportPayload,
    relayNodeId: string,
    relayNodeName: string,
    nextTargetNodeId: string,
    latencyMs?: number,
  ): RelayResult {
    // Step 1: Receive at relay (decompress + add hop)
    const received = this.receive(payload, relayNodeId, relayNodeName);
    if (!received.success || received.bundleData === undefined) {
      return { success: false, error: received.error ?? 'Relay receive failed' };
    }

    // Step 2: Re-assess condition for next leg
    const condition = assessTransportCondition(relayNodeId, nextTargetNodeId, latencyMs);

    // Step 3: Re-compress for next leg
    const recompressed = compressBundle(received.bundleData, condition);
    const provenanceSerialized = serializeProvenance(received.provenance!);

    return {
      success: true,
      provenance: received.provenance,
      provenanceSerialized,
      compression: {
        type: recompressed.compressionType,
        originalSize: recompressed.originalSize,
        compressedSize: recompressed.compressedSize,
      },
      payload: recompressed.data,
    };
  }
}

// ============================================================================
// Factory
// ============================================================================

/**
 * Creates a MeshTransport with the given DiscoveryService and optional eventLog.
 *
 * Preferred entry point over direct construction in application code.
 *
 * @param discoveryService - For node resolution
 * @param eventLog - Optional append-only event log for transport events
 * @returns MeshTransport instance
 */
export function createMeshTransport(
  discoveryService: DiscoveryService,
  eventLog?: MeshEventLog,
): MeshTransport {
  return new MeshTransport(discoveryService, eventLog);
}
