/**
 * SCRIBE PROV-O graph types.
 *
 * Substrate source-of-truth: examples/cartridges/retrieval-provenance/migrations/001-init.postgres.sql
 *
 * The closed sets below MUST match the SQL CHECK constraints on `prov_node.node_type`
 * and `prov_edge.relation` exactly. The substrate-conformance test
 * (`src/scribe/__tests__/integration/prov-closed-set.test.ts`, authored in Component 09)
 * parses the migration SQL, extracts the CHECK literals, and diffs against these unions.
 *
 * If the SQL CHECK changes, this file MUST be updated in the same commit. The README
 * mission narrative may abbreviate these enumerations — the SQL is the source of truth.
 *
 * @module scribe/types/prov
 */

/**
 * PROV-O node-type closed set. Substrate decision §6.1 (T5 REPORT).
 *
 * Source-of-truth: SQL `CHECK (node_type IN ('Entity', 'Activity', 'Agent', 'Plan', 'Bundle', 'Collection'))`.
 *
 * `node_type` is CLOSED — adding a new value here without updating
 * `001-init.postgres.sql` is a substrate violation.
 */
export type NodeType =
  | 'Entity'
  | 'Activity'
  | 'Agent'
  | 'Plan'
  | 'Bundle'
  | 'Collection';

/**
 * Frozen array of all `NodeType` values for runtime iteration / set-membership tests.
 * The substrate-conformance test reads this to compare against the SQL CHECK.
 */
export const NODE_TYPES: ReadonlyArray<NodeType> = Object.freeze([
  'Entity',
  'Activity',
  'Agent',
  'Plan',
  'Bundle',
  'Collection',
]);

/**
 * PROV-O edge relation closed set. Substrate decision §6.2 (T5 REPORT).
 *
 * Source-of-truth: SQL CHECK on `prov_edge.relation` — 14 values, mixing
 * PROV-O starting-point properties with PROV-O extended properties.
 *
 * `relation` is CLOSED at the database layer — the SVG `<scribe:edge rel="...">`
 * attribute carries a DIFFERENT closed set; see `metadata-namespace.ts` for that.
 */
export type ProvRelation =
  // PROV-O starting-point properties
  | 'wasGeneratedBy'
  | 'used'
  | 'wasInformedBy'
  | 'wasDerivedFrom'
  | 'wasAttributedTo'
  | 'wasAssociatedWith'
  | 'actedOnBehalfOf'
  // PROV-O extended properties used by SCRIBE
  | 'wasInfluencedBy'
  | 'hadMember'
  | 'wasRevisionOf'
  | 'wasQuotationFrom'
  | 'specializationOf'
  | 'alternateOf'
  | 'hadPlan'
  | 'hadActivity';

/**
 * Frozen array of all `ProvRelation` values for runtime iteration / set-membership tests.
 * Used by the substrate-conformance test to diff against the SQL CHECK.
 */
export const PROV_RELATIONS: ReadonlyArray<ProvRelation> = Object.freeze([
  'wasGeneratedBy',
  'used',
  'wasInformedBy',
  'wasDerivedFrom',
  'wasAttributedTo',
  'wasAssociatedWith',
  'actedOnBehalfOf',
  'wasInfluencedBy',
  'hadMember',
  'wasRevisionOf',
  'wasQuotationFrom',
  'specializationOf',
  'alternateOf',
  'hadPlan',
  'hadActivity',
]);

/**
 * `sub_type` is the OPEN discriminator. Substrate decision §6.3.
 *
 * Examples by node_type (non-exhaustive — extensible per cartridge):
 *   - Entity: 'commit', 'file', 'decision', 'alternative', 'roundtrip-artifact'
 *   - Activity: 'session', 'task', 'roundtrip-event' (Component 05)
 *   - Agent: 'person', 'software'
 *   - Plan: 'mission', 'milestone'
 *
 * Adding a new sub_type does NOT require a substrate change. The closed-vs-open
 * distinction is: `node_type` closed, `sub_type` open.
 */
export type SubType = string;

/**
 * Well-known `sub_type` values. Cartridges may extend this set freely; the registry
 * exists for autocomplete + grep-discoverability, not enforcement.
 */
export const KNOWN_SUB_TYPES = Object.freeze({
  // Entity
  commit: 'commit' as const,
  file: 'file' as const,
  decision: 'decision' as const,
  alternative: 'alternative' as const,
  roundtripArtifact: 'roundtrip-artifact' as const,
  // Activity
  session: 'session' as const,
  task: 'task' as const,
  roundtripEvent: 'roundtrip-event' as const,
  // Agent
  person: 'person' as const,
  software: 'software' as const,
  // Plan
  mission: 'mission' as const,
  milestone: 'milestone' as const,
});

/**
 * The JSONB payload column on `prov_node` and `prov_edge`. Substrate decision §6.4:
 * extensible per-node attributes; promote hot keys to generated columns when needed.
 *
 * Typed as `Record<string, unknown>` rather than `any` so consumers must narrow
 * before reading. Concrete shapes (e.g., `RoundTripMetadata`) live alongside the
 * domain that owns them.
 */
export type ProvPayload = Record<string, unknown>;

/**
 * A single row in `prov_node`.
 *
 * `node_id` schema convention (substrate decision §6.5): typed prefix + identifier,
 * e.g. `'commit:e3ad12b25...'`, `'session:2026-04-25-...'`, `'agent:tibsfox'`.
 * The prefix is informational; the database treats `node_id` as opaque TEXT.
 */
export interface ProvNode {
  /** PRIMARY KEY. Conventional shape `'<prefix>:<identifier>'`. */
  readonly node_id: string;
  /** Closed set; matches SQL CHECK. */
  readonly node_type: NodeType;
  /** Open discriminator within `node_type`. */
  readonly sub_type?: SubType;
  /** Human-readable label (used by `fuzzy_find_node` similarity search). */
  readonly label?: string;
  /** Extensible per-node attributes. Default `{}` per SQL DEFAULT. */
  readonly payload: ProvPayload;
  /** ISO-8601 timestamp; populated for Activity nodes. */
  readonly started_at?: string;
  /** ISO-8601 timestamp; populated for Activity nodes. */
  readonly ended_at?: string;
  /** ISO-8601 timestamp; defaults to `now()` per SQL DEFAULT. */
  readonly created_at: string;
}

/**
 * A single row in `prov_edge`.
 *
 * `edge_id` is content-addressed (substrate decision §6.5): typically
 * `sha256(src_id || relation || dst_id).slice(0, 16)`. See the helper below.
 */
export interface ProvEdge {
  /** PRIMARY KEY. Content-addressed: sha256(src||rel||dst).slice(0,16). */
  readonly edge_id: string;
  /** FOREIGN KEY → prov_node.node_id, ON DELETE CASCADE. */
  readonly src_id: string;
  /** FOREIGN KEY → prov_node.node_id, ON DELETE CASCADE. */
  readonly dst_id: string;
  /** Closed set; matches SQL CHECK. */
  readonly relation: ProvRelation;
  /** Extensible per-edge attributes. Default `{}` per SQL DEFAULT. */
  readonly payload: ProvPayload;
  /** ISO-8601 timestamp; defaults to `now()` per SQL DEFAULT. */
  readonly created_at: string;
}

/**
 * A discriminated-union view of `ProvNode` keyed on `node_type`. Useful for
 * exhaustiveness checks at consumer sites; not a replacement for the structural
 * `ProvNode` interface (which is what the database actually returns).
 */
export type ProvNodeByType =
  | (ProvNode & { node_type: 'Entity' })
  | (ProvNode & { node_type: 'Activity' })
  | (ProvNode & { node_type: 'Agent' })
  | (ProvNode & { node_type: 'Plan' })
  | (ProvNode & { node_type: 'Bundle' })
  | (ProvNode & { node_type: 'Collection' });

/**
 * Type-narrowing helper: returns true (and narrows) when `node` is an Activity.
 */
export function isActivity(
  node: ProvNode,
): node is ProvNode & { node_type: 'Activity' } {
  return node.node_type === 'Activity';
}

/**
 * Type-narrowing helper: returns true (and narrows) when `node` is an Entity.
 */
export function isEntity(
  node: ProvNode,
): node is ProvNode & { node_type: 'Entity' } {
  return node.node_type === 'Entity';
}

/**
 * Type-narrowing helper: returns true (and narrows) when `node` is an Agent.
 */
export function isAgent(
  node: ProvNode,
): node is ProvNode & { node_type: 'Agent' } {
  return node.node_type === 'Agent';
}

/**
 * Type-narrowing helper for `sub_type`. Useful for the `roundtrip-event`
 * pattern in Component 05 where consumers want `node.sub_type === 'roundtrip-event'`
 * to narrow `payload` to `{ roundTrip: RoundTripMetadata }`.
 *
 * Generic over the literal sub_type value so `hasSubType(n, 'roundtrip-event')`
 * narrows precisely.
 */
export function hasSubType<S extends string>(
  node: ProvNode,
  sub: S,
): node is ProvNode & { sub_type: S } {
  return node.sub_type === sub;
}

/**
 * Compute the canonical content-addressed `edge_id` for a (src, relation, dst) triple.
 *
 * Substrate decision §6.5: `edge_id = sha256(src || relation || dst).slice(0, 16)`.
 *
 * This is the canonical recipe; consumers that need to insert edges deterministically
 * (e.g., Component 02 traversal queries, Component 05 round-trip event persistence)
 * call this helper rather than rolling their own.
 *
 * Note: this function is sync and assumes a Node `crypto` import at call site.
 * We intentionally do NOT import `node:crypto` here to keep `prov.ts` zero-runtime-dep
 * per Component 00 spec § Constraints. The `metadata-namespace.ts` and
 * `roundtrip-persistence` modules wrap this with the actual hash call.
 *
 * The function returned here is a pure-data spec for what to hash, in what order,
 * with what slice — NOT the hashing routine itself.
 */
export interface EdgeIdRecipe {
  readonly algorithm: 'sha256';
  readonly inputs: readonly [src: string, relation: ProvRelation, dst: string];
  readonly sliceLength: 16;
}

export function edgeIdRecipe(
  src: string,
  relation: ProvRelation,
  dst: string,
): EdgeIdRecipe {
  return Object.freeze({
    algorithm: 'sha256' as const,
    inputs: [src, relation, dst] as const,
    sliceLength: 16 as const,
  });
}
