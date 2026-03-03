/**
 * Provenance tracking for DACP mesh bundles.
 *
 * Every bundle carries a ProvenanceHeader recording its origin and each hop
 * with timestamps. This allows users to audit the full journey of any bundle
 * through the mesh.
 *
 * All functions are pure (no IO, no side effects). addHop() is immutable --
 * it returns a new header rather than mutating the input.
 *
 * IMP-03: Constants exported so callers have a stable reference.
 */

import { z } from 'zod';

// ============================================================================
// Schema
// ============================================================================

/**
 * A single hop entry appended by each intermediate node.
 */
const HopEntrySchema = z.object({
  /** ID of the node that received the bundle at this hop */
  nodeId: z.string(),
  /** Human-readable name of the receiving node */
  nodeName: z.string(),
  /** ISO 8601 timestamp when the bundle arrived at this node */
  arrivedAt: z.string().datetime(),
  /** Zero-based sequential hop index (0 = first hop, 1 = second, ...) */
  hopIndex: z.number().int().nonnegative(),
});

/** TypeScript type for a hop entry */
export type HopEntry = z.infer<typeof HopEntrySchema>;

/**
 * Full provenance header attached to a DACP mesh bundle.
 * Origin is the source node that first sent the bundle.
 * Hops accumulate as the bundle traverses the mesh.
 */
export const ProvenanceHeaderSchema = z.object({
  /** Source node that created and first sent this bundle */
  origin: z.object({
    /** Unique ID of the origin node */
    nodeId: z.string(),
    /** Human-readable name of the origin node */
    nodeName: z.string(),
  }),
  /** Ordered list of intermediate hops (accumulates as bundle travels) */
  hops: z.array(HopEntrySchema),
  /** ISO 8601 timestamp when the provenance header was created */
  createdAt: z.string().datetime(),
});

/** TypeScript type for a provenance header */
export type ProvenanceHeader = z.infer<typeof ProvenanceHeaderSchema>;

// ============================================================================
// Functions
// ============================================================================

/**
 * Creates a new provenance header for a bundle originating from the given node.
 * The hops array is empty -- hops are added as the bundle traverses the mesh.
 *
 * @param originNodeId - Unique ID of the originating node
 * @param originName - Human-readable name of the originating node
 * @returns A new ProvenanceHeader with empty hops
 */
export function createProvenanceHeader(
  originNodeId: string,
  originName: string,
): ProvenanceHeader {
  return {
    origin: { nodeId: originNodeId, nodeName: originName },
    hops: [],
    createdAt: new Date().toISOString(),
  };
}

/**
 * Appends a hop entry to the provenance header (immutable -- returns new header).
 *
 * The hop index is sequential: first hop gets index 0, second gets 1, etc.
 * The input header is never modified.
 *
 * @param header - Existing provenance header (not mutated)
 * @param nodeId - ID of the node receiving the bundle
 * @param nodeName - Human-readable name of the receiving node
 * @returns A new ProvenanceHeader with the hop appended
 */
export function addHop(
  header: ProvenanceHeader,
  nodeId: string,
  nodeName: string,
): ProvenanceHeader {
  const hop: HopEntry = {
    nodeId,
    nodeName,
    arrivedAt: new Date().toISOString(),
    hopIndex: header.hops.length,
  };

  return {
    ...header,
    hops: [...header.hops, hop],
  };
}

/**
 * Returns the total number of hops in the provenance header.
 * Equivalent to header.hops.length but provides a named accessor.
 *
 * @param header - The provenance header to query
 * @returns Total hop count (0 for a bundle that hasn't been relayed yet)
 */
export function getTotalHops(header: ProvenanceHeader): number {
  return header.hops.length;
}

/**
 * Serializes a provenance header to a JSON string.
 * Use parseProvenance() to restore it.
 *
 * @param header - The provenance header to serialize
 * @returns JSON string representation
 */
export function serializeProvenance(header: ProvenanceHeader): string {
  return JSON.stringify(header);
}

/**
 * Parses and validates a serialized provenance header.
 * Throws if the input is not valid JSON or does not match ProvenanceHeaderSchema.
 *
 * @param json - JSON string produced by serializeProvenance()
 * @returns Validated ProvenanceHeader
 * @throws {SyntaxError} If json is not valid JSON
 * @throws {ZodError} If the parsed object does not match the schema
 */
export function parseProvenance(json: string): ProvenanceHeader {
  const parsed: unknown = JSON.parse(json);
  if (parsed === null || parsed === undefined) {
    throw new Error('Provenance JSON must not be null');
  }
  return ProvenanceHeaderSchema.parse(parsed);
}
