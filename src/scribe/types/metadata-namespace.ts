/**
 * SCRIBE round-trip metadata namespace types.
 *
 * Substrate source-of-truth: examples/cartridges/code-svg-hdl-bridge/svg-to-ast/metadata-spec.md
 *
 * This module types the SVG-side metadata namespace that survives round-trip:
 * `<scribe:graph>` / `<scribe:node>` / `<scribe:edge>` / `<scribe:source>` etc.
 *
 * Distinct from PROV-O graph types (`./prov.ts`): the SVG `<scribe:edge rel="...">`
 * attribute carries a DIFFERENT closed set than the PG `prov_edge.relation` column.
 * See `ScribeEdgeRel` below.
 *
 * @module scribe/types/metadata-namespace
 */

import type { ProvRelation } from './prov.js';

/**
 * The SCRIBE namespace URI. MUST equal this exact string verbatim.
 *
 * Substrate decision (mission README §"Substrate decisions" item 6 + T3 metadata-spec §1).
 * The substrate-conformance test (`namespace-uri-stable.test.ts`, Component 09)
 * asserts this constant equals the literal below.
 *
 * Per the spec: this URI is an identifier (Berners-Lee 1996 URI-as-identifier sense),
 * not necessarily a resolvable URL. Implementations MUST NOT dereference the URI.
 */
export const NAMESPACE_URI = 'https://tibsfox.com/Research/SCRIBE/ns#' as const;

/**
 * Literal type of the namespace URI (so consumers can use `typeof NAMESPACE_URI`
 * for compile-time string-literal narrowing).
 */
export type NamespaceUri = typeof NAMESPACE_URI;

/**
 * Current schema version. Substrate decision (T3 metadata-spec §10):
 * future versions MAY add backward-compatible additions; removal/repurposing
 * requires a major bump. Consumers MUST check `version` on `<scribe:graph>`.
 */
export const NAMESPACE_VERSION = '1' as const;
export type NamespaceVersion = typeof NAMESPACE_VERSION;

/**
 * The `kind` attribute on `<scribe:graph>`. Closed enum per metadata-spec §2.
 */
export type GraphKind =
  | 'ast'
  | 'callgraph'
  | 'dfg'
  | 'cfg'
  | 'netlist'
  | 'fsm';

export const GRAPH_KINDS: ReadonlyArray<GraphKind> = Object.freeze([
  'ast',
  'callgraph',
  'dfg',
  'cfg',
  'netlist',
  'fsm',
]);

/**
 * The OPTIONAL `language` attribute on `<scribe:graph>`. Per metadata-spec §2:
 * meaningless for `kind="netlist"`; required-by-convention for AST/CFG/DFG kinds.
 */
export type SourceLanguage =
  | 'typescript'
  | 'verilog'
  | 'systemverilog'
  | 'vhdl'
  | 'chisel'
  | 'amaranth'
  | 'spinalhdl'
  | 'c'
  | 'cpp'
  | 'python';

export const SOURCE_LANGUAGES: ReadonlyArray<SourceLanguage> = Object.freeze([
  'typescript',
  'verilog',
  'systemverilog',
  'vhdl',
  'chisel',
  'amaranth',
  'spinalhdl',
  'c',
  'cpp',
  'python',
]);

/**
 * SVG-side edge relation closed set. Substrate source: T3 metadata-spec §5.
 *
 * NOT the same as `ProvRelation` (PG-side). The SVG `rel` attribute is a
 * graph-structure relation (parent-child, wires, calls, def-use), with a
 * SUBSET of PROV relations available for persistence-bridging edges.
 *
 * Consumers that confuse this with `ProvRelation` will get a TS error at use
 * site — that's intentional. The two domains are distinct on purpose.
 */
export type ScribeEdgeRel =
  // Tree / graph structural
  | 'child'
  // Netlist
  | 'wire'
  // Callgraph
  | 'calls'
  // DFG
  | 'uses'
  | 'defines'
  // CFG
  | 'next'
  | 'true_branch'
  | 'false_branch'
  // Module instantiation
  | 'instantiates'
  // PROV-O persistence bridging (subset of ProvRelation)
  | 'wasDerivedFrom'
  | 'wasGeneratedBy'
  | 'used';

export const SCRIBE_EDGE_RELS: ReadonlyArray<ScribeEdgeRel> = Object.freeze([
  'child',
  'wire',
  'calls',
  'uses',
  'defines',
  'next',
  'true_branch',
  'false_branch',
  'instantiates',
  'wasDerivedFrom',
  'wasGeneratedBy',
  'used',
]);

/**
 * Compile-time check that the PROV-bridging subset of `ScribeEdgeRel` is a true
 * subset of `ProvRelation`. If a future T5 substrate change drops one of these
 * relations from the SQL CHECK, this won't compile. (Lightweight invariant guard.)
 */
type _ProvBridgeRels = Extract<
  ScribeEdgeRel,
  'wasDerivedFrom' | 'wasGeneratedBy' | 'used'
>;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type _ProvBridgeRelsAreInProv = _ProvBridgeRels extends ProvRelation
  ? true
  : never;

/**
 * `<scribe:source path="..." sha="..." [bytes="..."] [generator="..."]/>`.
 * Per metadata-spec §3.
 */
export interface SourceProvenance {
  /** REQUIRED. Repo-relative path or absolute URI for external sources. */
  readonly path: string;
  /** REQUIRED. Hex digest, leading 16+ chars. SHA-1 (browser) or SHA-256 (production). */
  readonly sha: string;
  /** OPTIONAL. Source-file size in bytes. */
  readonly bytes?: number;
  /** OPTIONAL. Free-form tool identifier (e.g., 'scribe-roundtrip-viewer/1.0'). */
  readonly generator?: string;
}

/**
 * `<scribe:node id="..." sub_type="..." label="..." [span="..."] [payload="..."]/>`.
 * Per metadata-spec §4.
 *
 * NOTE: the `sub_type` here is a SVG-graph-level discriminator (e.g., TypeScript
 * SyntaxKind names for AST kind, Yosys cell types for netlist kind). Different
 * registry from the PG `prov_node.sub_type`.
 */
export interface ScribeNode {
  /** REQUIRED. Graph-local identifier; valid CSS identifier. */
  readonly id: string;
  /** REQUIRED. From the closed per-`kind` taxonomy. */
  readonly sub_type: string;
  /** REQUIRED. Human-readable name. */
  readonly label: string;
  /** REQUIRED for `kind="ast"`. Byte-offset range as 'START..END'. */
  readonly span?: string;
  /** OPTIONAL. JSON-encoded extra data. */
  readonly payload?: string;
}

/**
 * `<scribe:edge id="..." rel="..." src="..." dst="..." [payload="..."]/>`.
 * Per metadata-spec §5.
 */
export interface ScribeEdge {
  /** REQUIRED. Content-addressed `sha256(src||rel||dst).slice(0,16)` OR simpler scheme for tests. */
  readonly id: string;
  /** REQUIRED. From `ScribeEdgeRel` closed set. */
  readonly rel: ScribeEdgeRel;
  /** REQUIRED. ID of source node. */
  readonly src: string;
  /** REQUIRED. ID of destination node. */
  readonly dst: string;
  /** OPTIONAL. JSON-encoded extra data; for `child` carries `{"order":N}`. */
  readonly payload?: string;
}

/**
 * `<scribe:layout algorithm="..." [seed="..."]/>`. Per metadata-spec §6.
 * Optional layout hint for re-renderers.
 */
export type LayoutAlgorithm =
  | 'reingold-tilford'
  | 'sugiyama'
  | 'force-directed'
  | 'orthogonal';

export interface LayoutHint {
  readonly algorithm: LayoutAlgorithm;
  readonly seed?: string;
}

/**
 * `<scribe:roundtrip lastSync="..." reverseDirection="..."/>`. Per metadata-spec §7.
 * Optional round-trip stamp.
 */
export type ReverseDirection = 'hand-edit' | 'tool-emit' | 'auto';

export interface RoundTripStamp {
  /** ISO-8601 timestamp. */
  readonly lastSync: string;
  readonly reverseDirection: ReverseDirection;
}

/**
 * The top-level `<scribe:graph>` element. Per metadata-spec §2.
 */
export interface ScribeGraph {
  /** REQUIRED. Currently '1'. */
  readonly version: NamespaceVersion;
  /** REQUIRED. Closed enum. */
  readonly kind: GraphKind;
  /** OPTIONAL for AST/CFG/DFG; meaningless for netlist. */
  readonly language?: SourceLanguage;
  readonly source?: SourceProvenance;
  readonly nodes: ReadonlyArray<ScribeNode>;
  readonly edges: ReadonlyArray<ScribeEdge>;
  readonly layout?: LayoutHint;
  readonly roundtrip?: RoundTripStamp;
}

/**
 * Catch-all for `<scribe:metadata>` carrying any of the typed elements above
 * plus a free-form payload bag (used by Component 05 round-trip event persistence
 * which threads JSON-encoded RoundTripMetadata through `payload`).
 */
export interface ScribeMetadata {
  readonly graph?: ScribeGraph;
  /** Free-form per-implementation extension data. */
  readonly extras?: Record<string, unknown>;
}

/**
 * RoundTripMetadata — the canonical payload shape for `prov_node.payload->'roundTrip'`
 * when `node_type='Activity'` and `sub_type='roundtrip-event'` (Component 05).
 *
 * Substrate source: T3 doc 06 §8 (round-trip event persistence schema).
 */
export interface RoundTripMetadata {
  /** Forward = code → SVG → Verilog; reverse = SVG-metadata → AST → source. */
  readonly direction: 'forward' | 'reverse';
  readonly sourceLanguage: SourceLanguage;
  readonly targetLanguage: SourceLanguage;
  /** Hex digest of the source artifact. */
  readonly sourceSha: string;
  /** Hex digest of the target artifact. */
  readonly targetSha: string;
  /** Hex digest of the SVG artifact. */
  readonly svgSha: string;
  /** OPTIONAL. ISO-8601 timestamp; defaults to now() at insert site. */
  readonly emittedAt?: string;
  /** OPTIONAL. Free-form extra context. */
  readonly extras?: Record<string, unknown>;
}

/**
 * The `<svg>` root attribute name for the SCRIBE namespace declaration:
 *   <svg xmlns:scribe="https://tibsfox.com/Research/SCRIBE/ns#">
 */
export const NAMESPACE_PREFIX = 'scribe' as const;
export const NAMESPACE_DECLARATION_ATTR =
  `xmlns:${NAMESPACE_PREFIX}` as const;

/**
 * Build the namespace declaration attribute key + value pair as a tuple, useful
 * when serializing SVG without a full XML library.
 */
export function namespaceDeclaration(): readonly [
  typeof NAMESPACE_DECLARATION_ATTR,
  NamespaceUri,
] {
  return [NAMESPACE_DECLARATION_ATTR, NAMESPACE_URI] as const;
}
